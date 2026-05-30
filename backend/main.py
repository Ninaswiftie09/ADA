# Cloud Function entry point
import os
from typing import Any

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import auth as firebase_auth
from flask import Request, jsonify, make_response

from distance_matrix import build_distance_matrix, validate_destinations
from genetic_algorithm import GAConfig, optimize_route as run_ga

load_dotenv()

if not firebase_admin._apps:
    firebase_admin.initialize_app(options={
        'projectId': os.getenv('FIREBASE_PROJECT_ID'),
    })


def _cors_headers() -> dict[str, str]:
    return {
        "Access-Control-Allow-Origin": os.getenv("CORS_ORIGINS", "*"),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def _json_response(payload: dict[str, Any], status: int = 200):
    response = make_response(jsonify(payload), status)

    for key, value in _cors_headers().items():
        response.headers[key] = value

    return response


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For", "")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.remote_addr or ""


def _allowed_ips() -> set[str]:
    return {ip.strip() for ip in os.getenv("ALLOWED_IPS", "").split(",") if ip.strip()}


def _check_ip(request: Request) -> None:
    allowed = _allowed_ips()

    if not allowed:
        raise PermissionError("ALLOWED_IPS no esta configurado.")

    ip = _client_ip(request)

    if ip not in allowed:
        raise PermissionError("Esta IP no tiene permiso para llamar a la funcion.")


def _verify_user(request: Request) -> dict[str, Any]:
    header = request.headers.get("Authorization", "")

    if not header.startswith("Bearer "):
        raise PermissionError("Falta el token de Firebase.")

    token = header.replace("Bearer ", "", 1).strip()

    return firebase_auth.verify_id_token(token)


def optimize_route(request: Request):
    if request.method == "OPTIONS":
        return _json_response({}, 204)

    if request.method != "POST":
        return _json_response({"error": "Solo se permite el metodo POST."}, 405)

    try:
        _check_ip(request)

        user = _verify_user(request)

        payload = request.get_json(silent=True) or {}
        destinations = payload.get("destinations", [])
        mode = payload.get("mode", "closed")

        validate_destinations(destinations)

        matrix = build_distance_matrix(destinations)

        config = GAConfig(
            population_size=int(os.getenv("GA_POPULATION_SIZE", "120")),
            generations=int(os.getenv("GA_GENERATIONS", "400")),
            mutation_rate=float(os.getenv("GA_MUTATION_RATE", "0.08")),
        )

        order, total_distance_km = run_ga(matrix, mode, config)

        ordered_destinations = [destinations[i] for i in order]

        return _json_response({
            "user": user.get("uid"),
            "mode": mode,
            "order": order,
            "orderedDestinations": ordered_destinations,
            "totalDistanceKm": round(total_distance_km, 2),
        })

    except PermissionError as exc:
        return _json_response({"error": str(exc)}, 403)

    except ValueError as exc:
        return _json_response({"error": str(exc)}, 400)

    except Exception as exc:
        return _json_response({
            "error": "Error interno del servidor.",
            "detail": str(exc),
        }, 500)
