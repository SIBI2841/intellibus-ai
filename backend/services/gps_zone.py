ZONES = [
    {
        "id": "school-01",
        "name": "Demo School Zone",
        "type": "school",
        "lat": 11.0168,
        "lon": 76.9558,
        "radius_m": 300,
        "speed_limit": 30,
    },
    {
        "id": "hospital-01",
        "name": "Demo Hospital Zone",
        "type": "hospital",
        "lat": 11.0183,
        "lon": 76.9725,
        "radius_m": 350,
        "speed_limit": 30,
    },
    {
        "id": "terminal-01",
        "name": "Demo Bus Terminal",
        "type": "terminal",
        "lat": 11.0167,
        "lon": 76.9550,
        "radius_m": 250,
        "speed_limit": 20,
    },
]


def distance_m(lat1, lon1, lat2, lon2):
    # Equirectangular approximation, adequate for this local demo.
    import math
    r = 6371000
    x = math.radians(lon2 - lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat2 - lat1)
    return math.sqrt(x*x + y*y) * r


def evaluate_gps(lat: float, lon: float, speed: float):
    nearest = None
    nearest_distance = float("inf")

    for zone in ZONES:
        d = distance_m(lat, lon, zone["lat"], zone["lon"])
        if d <= zone["radius_m"] and d < nearest_distance:
            nearest = zone
            nearest_distance = d

    if nearest is None:
        return {
            "inside_zone": False,
            "zone": None,
            "allowed_speed": None,
            "current_speed": speed,
            "status": "NO_RESTRICTED_ZONE",
        }

    violation = speed > nearest["speed_limit"]

    return {
        "inside_zone": True,
        "zone": nearest,
        "allowed_speed": nearest["speed_limit"],
        "current_speed": speed,
        "status": "SPEED_VIOLATION" if violation else "SAFE",
    }
