# Distance Matrix API calls
import os
from math import asin, cos, radians, sin, sqrt
from typing import Iterable, List, Mapping, Sequence

import requests

MAX_RADIUS_KM = 100.0
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


def haversine_km(a: Mapping[str, float], b: Mapping[str, float]) -> float:
    lat1, lon1 = radians(float(a["lat"])), radians(float(a["lng"]))
    lat2, lon2 = radians(float(b["lat"])), radians(float(b["lng"]))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(h))


def validate_destinations(destinations: Sequence[Mapping[str, float]]) -> None:
    if not 2 <= len(destinations) <= 15:
        raise ValueError("Debes enviar entre 2 y 15 destinos.")

    for idx, destination in enumerate(destinations):
        if "lat" not in destination or "lng" not in destination:
            raise ValueError(f"El destino {idx + 1} debe incluir lat y lng.")

        lat = float(destination["lat"])
        lng = float(destination["lng"])

        if not -90 <= lat <= 90 or not -180 <= lng <= 180:
            raise ValueError(f"El destino {idx + 1} tiene coordenadas invalidas.")

    for i in range(len(destinations)):
        for j in range(i + 1, len(destinations)):
            if haversine_km(destinations[i], destinations[j]) > MAX_RADIUS_KM:
                raise ValueError(
                    "Todos los destinos deben estar dentro de un radio maximo de 100 km entre si."
                )


def _coord_list(destinations: Iterable[Mapping[str, float]]) -> str:
    return "|".join(f'{float(d["lat"]):.7f},{float(d["lng"]):.7f}' for d in destinations)


def build_distance_matrix(destinations: Sequence[Mapping[str, float]]) -> List[List[float]]:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY no esta configurada.")

    validate_destinations(destinations)

    coords = _coord_list(destinations)

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

    matrix: List[List[float]] = []

    for row in payload.get("rows", []):
        values = []

        for element in row.get("elements", []):
            if element.get("status") != "OK":
                raise RuntimeError("No se pudo calcular la distancia entre todos los destinos.")

            values.append(float(element["distance"]["value"]) / 1000.0)

        matrix.append(values)

    if len(matrix) != len(destinations) or any(len(row) != len(destinations) for row in matrix):
        raise RuntimeError("Distance Matrix API devolvio una matriz invalida.")

    return matrix
