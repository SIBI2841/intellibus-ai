def occupancy_percent(passengers: int, capacity: int) -> float:
    if capacity <= 0:
        return 0.0
    return round((passengers / capacity) * 100, 1)


def occupancy_status(passengers: int, capacity: int) -> str:
    pct = occupancy_percent(passengers, capacity)

    if pct > 100:
        return "OVERLOAD"
    if pct >= 85:
        return "HIGH"
    if pct >= 70:
        return "MODERATE"
    return "SAFE"


def departure_status(passengers: int, capacity: int) -> str:
    return "LOCKED" if passengers > capacity else "READY"
