import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
KML_PATH = ROOT / "assets" / "Anafi_Custom_route.kml"
GEOJSON_PATH = ROOT / "data" / "anafi.geojson"

NS = {"kml": "http://www.opengis.net/kml/2.2"}

waypoint_specs = [
    {
        "name": "Ronkounas Parking",
        "coordinates": [25.795761, 36.349311],
        "type": "trailhead",
        "period": "Present day",
        "description": "Start from the parking area above the coastal road and follow the ridge path toward Kasteli.",
    },
    {
        "name": "Trailhead to Kasteli",
        "coordinates": [25.797674, 36.350969],
        "type": "path",
        "period": "Present day",
        "description": "The initial uphill section climbs from the parking area toward the ancient settlement of Kasteli.",
    },
    {
        "name": "Kasteli",
        "coordinates": [25.799671, 36.359165],
        "type": "settlement",
        "period": "Bronze Age / Early Cycladic",
        "description": "The ancient settlement of Kasteli crowns the ridge and provides a dramatic introduction to Anafi's prehistoric landscape.",
    },
    {
        "name": "Agios Mamas",
        "coordinates": [25.829776, 36.358121],
        "type": "archaeology",
        "period": "Classical / later antiquity",
        "description": "Agios Mamas marks a significant sacred or architectural point along the wider ridge landscape, with a long history of reuse.",
    },
    {
        "name": "Ancient Terracing",
        "coordinates": [25.810834, 36.352147],
        "type": "archaeology",
        "period": "Ancient agricultural landscape",
        "description": "The final stop is among the extant terraces that demonstrate the island's long history of cultivation and land management.",
    },
]


def parse_coordinates(text: str):
    coords = []
    for part in text.split():
        parts = part.split(",")
        if len(parts) >= 2:
            lng, lat = float(parts[0]), float(parts[1])
            coords.append([lng, lat])
    return coords


root = ET.parse(KML_PATH).getroot()
route_coords = []
for linestring in root.findall(".//kml:LineString", NS):
    coordinates = linestring.find("kml:coordinates", NS)
    if coordinates is not None and coordinates.text:
        route_coords.extend(parse_coordinates(coordinates.text))

if not route_coords:
    raise SystemExit("No route coordinates found in KML")

geojson = {
    "type": "FeatureCollection",
    "properties": {
        "island": "Anafi",
        "trailName": "Anafi Ridge Walk",
        "region": "Cyclades",
        "center": [25.8025, 36.3565],
        "zoom": 13,
        "summary": "A scenic ridge walk on Anafi linking the parking area, Kasteli, and the island's dramatic terrace landscape.",
        "distanceKm": 9.78,
        "elevationGainM": 462,
        "difficulty": "Moderate",
        "estimatedTime": "3.5–4 hr",
        "basedOn": "Derived from the Anafi custom route KML and the supplied waypoint details.",
        "note": "Route coordinates are taken from the supplied KML and the waypoint list was translated into a prototype GeoJSON itinerary.",
    },
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": route_coords},
            "properties": {"kind": "route"},
        }
    ],
}

for index, spec in enumerate(waypoint_specs, start=1):
    geojson["features"].append(
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [spec["coordinates"][0], spec["coordinates"][1]]},
            "properties": {
                "kind": "waypoint",
                "order": index,
                "type": spec["type"],
                "name": spec["name"],
                "period": spec["period"],
                "description": spec["description"],
            },
        }
    )

GEOJSON_PATH.write_text(json.dumps(geojson, indent=2), encoding="utf-8")
print(f"Wrote {GEOJSON_PATH}")
print(f"Route points: {len(route_coords)}")
print(f"Waypoints: {len(waypoint_specs)}")
