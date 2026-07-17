import json
import xml.etree.ElementTree as ET
from pathlib import Path

kml_path = Path('assets/Ios_Custom_route.kml')
geojson_path = Path('data/ios.geojson')

ns = {'kml': 'http://www.opengis.net/kml/2.2'}
text = kml_path.read_text(encoding='utf-8')
root = ET.fromstring(text)

# Find the first LineString route
line_coords = None
for linestring in root.findall('.//kml:LineString', ns):
    coords_text = linestring.find('kml:coordinates', ns).text.strip()
    coords = []
    for part in coords_text.split():
        parts = part.split(',')
        if len(parts) >= 2:
            lng, lat = float(parts[0]), float(parts[1])
            coords.append([lng, lat])
    if coords:
        line_coords = coords
        break

if line_coords is None:
    raise SystemExit('No LineString route found in KML')

# Update the ios.geojson route coordinates only
geojson = json.loads(geojson_path.read_text(encoding='utf-8'))
route_feature = next((f for f in geojson['features'] if f['properties'].get('kind') == 'route'), None)
if route_feature is None:
    raise SystemExit('No route feature found in ios.geojson')

route_feature['geometry'] = {
    'type': 'LineString',
    'coordinates': line_coords,
}

geojson_path.write_text(json.dumps(geojson, indent=2), encoding='utf-8')
print('Updated', geojson_path)
