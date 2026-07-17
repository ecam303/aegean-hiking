import json
from pathlib import Path

IOS = Path('data/ios.geojson')

new_waypoints = [
    {
        'order': 1,
        'type': 'settlement',
        'name': 'Skarkos',
        'period': 'Early Cycladic II',
        'description': 'Skarkos archaeological settlement.' ,
        'coords': [25.2828, 36.7319]
    },
    {
        'order': 2,
        'type': 'house',
        'name': 'Early Modern Houses',
        'period': 'Present day',
        'description': 'Cluster of early modern houses near the route.',
        'coords': [25.28374, 36.727355]
    },
    {
        'order': 3,
        'type': 'viewpoint',
        'name': 'Windmills',
        'period': 'Historic',
        'description': 'Traditional windmills on the ridge.',
        'coords': [25.285109, 36.723382]
    },
    {
        'order': 4,
        'type': 'museum',
        'name': 'Archaeological Museum',
        'period': 'Present day',
        'description': 'Local archaeological museum in Chora.',
        'coords': [25.285109, 36.723382]
    }
]

geo = json.loads(IOS.read_text(encoding='utf-8'))
# keep non-waypoint features (route etc.)
base_features = [f for f in geo.get('features', []) if f.get('properties', {}).get('kind') != 'waypoint']

# append new waypoint features
for wp in new_waypoints:
    feat = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': wp['coords']
        },
        'properties': {
            'kind': 'waypoint',
            'order': wp['order'],
            'type': wp['type'],
            'name': wp['name'],
            'period': wp['period'],
            'description': wp['description']
        }
    }
    base_features.append(feat)

geo['features'] = base_features
IOS.write_text(json.dumps(geo, indent=2, ensure_ascii=False), encoding='utf-8')
print('Wrote', IOS)
