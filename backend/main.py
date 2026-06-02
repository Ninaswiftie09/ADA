# Cloud Function entry point
# Este archivo es el punto de entrada de la API desplegada en Google Cloud Functions
import os
from typing import Any

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import auth as firebase_auth
from flask import Request, jsonify, make_response

from distance_matrix import build_distance_matrix, validate_destinations
from genetic_algorithm import GAConfig, optimize_route as run_ga

# Carga las variables de entorno desde el archivo .env
load_dotenv()

# Inicializa Firebase solo una vez (evita reinicializarlo en cada llamada)
if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
    })


# Cabeceras CORS para permitir llamadas desde el frontend
def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.getenv("CORS_ORIGINS", "*"),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


# Construye una respuesta JSON con las cabeceras CORS incluidas
def _json_response(payload: dict[str, Any], status: int = 200):
    response = make_response(jsonify(payload), status)

    for key, value in _cors_headers().items():
        response.headers[key] = value

    return response


# Obtiene la IP real del cliente (considera proxies via X-Forwarded-For)
def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For", "")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.remote_addr or ""


# Lee la lista de IPs permitidas desde la variable de entorno ALLOWED_IPS
def _allowed_ips() -> set[str]:
    return {ip.strip() for ip in os.getenv("ALLOWED_IPS", "").split(",") if ip.strip()}


# Seguridad por IP: verifica que quien llama esté en la lista blanca
def _check_ip(request: Request) -> None:
    allowed = _allowed_ips()

    # Si no hay IPs configuradas, rechaza todo
    if not allowed:
        raise PermissionError("ALLOWED_IPS no esta configurado.")

    ip = _client_ip(request)

    # Si la IP del cliente no está en la lista, bloquea la solicitud
    if ip not in allowed:
        raise PermissionError("Esta IP no tiene permiso para llamar a la funcion.")


# Seguridad por usuario: verifica el token JWT de Firebase para autenticar al usuario
def _verify_user(request: Request) -> dict[str, Any]:
    header = request.headers.get("Authorization", "")

    if not header.startswith("Bearer "):
        raise PermissionError("Falta el token de Firebase.")

    token = header.replace("Bearer ", "", 1).strip()

    # Valida el token con Firebase y devuelve la info del usuario
    return firebase_auth.verify_id_token(token)


# Función principal que expone Google Cloud Functions
def optimize_route(request: Request):
    # Responde al preflight de CORS (navegadores lo hacen antes del POST real)
    if request.method == "OPTIONS":
        return _json_response({}, 204)

    if request.method != "POST":
        return _json_response({"error": "Solo se permite el metodo POST."}, 405)

    try:
        # Capa 1 de seguridad: verifica que la IP esté permitida
        _check_ip(request)

        # Capa 2 de seguridad: verifica que el usuario esté autenticado con Firebase
        user = _verify_user(request)

        # Lee los destinos y el modo (open/closed) del cuerpo de la solicitud
        payload = request.get_json(silent=True) or {}
        destinations = payload.get("destinations", [])
        mode = payload.get("mode", "closed")

        # Valida que los destinos sean correctos (cantidad, coordenadas, radio)
        validate_destinations(destinations)

        # Llama a Google Maps para obtener las distancias reales por carretera entre todos los destinos
        matrix = build_distance_matrix(destinations)

        # Configura los parámetros del algoritmo genético (desde .env o valores por defecto)
        config = GAConfig(
            population_size=int(os.getenv("GA_POPULATION_SIZE", "120")),
            generations=int(os.getenv("GA_GENERATIONS", "400")),
            mutation_rate=float(os.getenv("GA_MUTATION_RATE", "0.08")),
        )

        # Ejecuta el algoritmo genético para encontrar la ruta óptima
        order, total_distance_km = run_ga(matrix, mode, config)

        # Reordena los destinos según el orden óptimo encontrado
        ordered_destinations = [destinations[i] for i in order]

        # Devuelve la ruta optimizada con la distancia total
        return _json_response({
            "user": user.get("uid"),
            "mode": mode,
            "order": order,
            "orderedDestinations": ordered_destinations,
            "totalDistanceKm": round(total_distance_km, 2),
        })

    # Errores de permisos (IP bloqueada o token inválido)
    except PermissionError as exc:
        return _json_response({"error": str(exc)}, 403)

    # Errores de validación (destinos mal formados, fuera de rango, etc.)
    except ValueError as exc:
        return _json_response({"error": str(exc)}, 400)

    # Cualquier otro error inesperado
    except Exception as exc:
        return _json_response({
            "error": "Error interno del servidor.",
            "detail": str(exc),
        }, 500)
