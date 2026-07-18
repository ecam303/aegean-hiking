import json
import unittest
from pathlib import Path


class AnafiGeoJSONTests(unittest.TestCase):
    def setUp(self):
        self.geojson_path = Path(__file__).resolve().parents[1] / "data" / "anafi.geojson"
        self.data = json.loads(self.geojson_path.read_text(encoding="utf-8"))

    def test_route_and_waypoints_exist(self):
        self.assertEqual(self.data["properties"]["island"], "Anafi")
        self.assertEqual(self.data["properties"]["trailName"], "Anafi Ridge Walk")
        self.assertGreater(self.data["properties"]["distanceKm"], 9)
        self.assertGreater(self.data["properties"]["elevationGainM"], 400)

        route = next(f for f in self.data["features"] if f["properties"].get("kind") == "route")
        self.assertEqual(route["geometry"]["type"], "LineString")
        self.assertGreater(len(route["geometry"]["coordinates"]), 50)

        waypoints = [f for f in self.data["features"] if f["properties"].get("kind") == "waypoint"]
        self.assertEqual(len(waypoints), 5)
        names = [f["properties"]["name"] for f in waypoints]
        self.assertIn("Ronkounas Parking", names)
        self.assertIn("Trailhead to Kasteli", names)
        self.assertIn("Kasteli", names)
        self.assertIn("Agios Mamas", names)
        self.assertIn("Ancient Terracing", names)


if __name__ == "__main__":
    unittest.main()
