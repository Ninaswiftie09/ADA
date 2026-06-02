# Distance Matrix API calls
# Este archivo se encarga de obtener las distancias reales por carretera entre destinos usando Google Maps
import os
from math import asin, cos, radians, sin, sqrt
from typing import Iterable, List, Mapping, Sequence

import requests

# Distancia máxima permitida entre cualquier par de destinos
MAX_RADIUS_KM = 100.0
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


# Calcula la distancia en línea recta entre dos coordenadas usando la fórmula Haversine
def haversine_km(a: Mapping[str, float], b: Mapping[str, float]) -> float:
    lat1, lon1 = radians(float(a["lat"])), radians(float(a["lng"]))
    lat2, lon2 = radians(float(b["lat"])), radians(float(b["lng"]))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(h))


# Valida que los destinos sean válidos antes de llamar a la API
def validate_destinations(destinations: Sequence[Mapping[str, float]]) -> None:
    # Verifica que haya entre 2 y 15 destinos (límite del AG y de la API)
    if not 2 <= len(destinations) <= 15:
        raise ValueError("Debes enviar entre 2 y 15 destinos.")

    for idx, destination in enumerate(destinations):
        # Verifica que cada destino tenga latitud y longitud
        if "lat" not in destination or "lng" not in destination:
            raise ValueError(f"El destino {idx + 1} debe incluir lat y lng.")

        lat = float(destination["lat"])
        lng = float(destination["lng"])

        # Verifica que las coordenadas estén dentro de rangos geográficos válidos
        if not -90 <= lat <= 90 or not -180 <= lng <= 180:
            raise ValueError(f"El destino {idx + 1} tiene coordenadas invalidas.")

    # Verifica que ningún par de destinos esté a más de 100 km entre sí
    for i in range(len(destinations)):
        for j in range(i + 1, len(destinations)):
            if haversine_km(destinations[i], destinations[j]) > MAX_RADIUS_KM:
                raise ValueError(
                    "Todos los destinos deben estar dentro de un radio maximo de 100 km entre si."
                )


# Convierte una lista de destinos a formato "lat,lng|lat,lng|..." que requiere la API
def _coord_list(destinations: Iterable[Mapping[str, float]]) -> str:
    return "|".join(f'{float(d["lat"]):.7f},{float(d["lng"]):.7f}' for d in destinations)


# Llama a Google Maps Distance Matrix API y construye la matriz de distancias N×N
def build_distance_matrix(destinations: Sequence[Mapping[str, float]]) -> List[List[float]]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY no esta configurada.")

    validate_destinations(destinations)

    coords = _coord_list(destinations)

    # Hace la petición a Google Maps: todos los destinos son origen Y destino a la vez
    response = requests.get(
        DISTANCE_MATRIX_URL,
        params={
            "origins": coords,
            "destinations": coords,
            "mode": "driving",
            "units": "metric",
            "key": api_key,
        },
        timeout=20,
    )

    response.raise_for_status()
    payload = response.json()

    if payload.get("status") != "OK":
        raise RuntimeError(f'Error en Distance Matrix API: {payload.get("status")}.')

    # Extrae las distancias de la respuesta y las convierte a km
    matrix: List[List[float]] = []

    for row in payload.get("rows", []):
        values = []

        for element in row.get("elements", []):
            if element.get("status") != "OK":
                raise RuntimeError("No se pudo calcular la distancia entre todos los destinos.")

            # La API devuelve metros, se convierte a kilómetros
            values.append(float(element["distance"]["value"]) / 1000.0)

        matrix.append(values)

    # Verifica que la matriz resultante sea cuadrada N×N
    if len(matrix) != len(destinations) or any(len(row) != len(destinations) for row in matrix):
        raise RuntimeError("Distance Matrix API devolvio una matriz invalida.")

    return matrix
