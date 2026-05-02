import requests
import os

API_KEY = os.environ.get("MAPS_KEY")

resp = requests.post(
    "https://places.googleapis.com/v1/places:searchText",
    headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location",
    },
    json={
        "textQuery": "Torre del Reformador Guatemala"
    }
)

print(resp.json())