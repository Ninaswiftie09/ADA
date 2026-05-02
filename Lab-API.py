import requests, os

API_KEY = os.environ.get("MAPS_KEY")
resp = requests.get(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
    params={
        "input": "Torre del Reformador Guatemala",
        "inputtype": "textquery",
        "fields": "place_id,name,geometry,formatted_address",
        "key": API_KEY,
    }
)

print(resp.json())


