from pathlib import Path
import math
import random

import pandas as pd


random.seed(42)

ROWS = 15000
CAPACITY = 60

# Stops represent different demand levels along a route.
STOP_PROFILES = {
    1: 0.70,
    2: 0.78,
    3: 0.88,
    4: 1.00,
    5: 1.12,
    6: 1.20,
    7: 1.08,
    8: 0.95,
    9: 0.86,
    10: 0.78,
    11: 0.90,
    12: 1.05,
}

rows = []

for _ in range(ROWS):
    hour = random.randint(6, 21)
    day_of_week = random.randint(0, 6)
    stop_id = random.randint(1, 12)

    # Morning and evening commuter peaks.
    if hour in [7, 8, 9]:
        peak_factor = random.uniform(1.20, 1.45)
    elif hour in [17, 18, 19]:
        peak_factor = random.uniform(1.18, 1.42)
    elif hour in [10, 11, 12, 13, 14, 15, 16]:
        peak_factor = random.uniform(0.88, 1.05)
    else:
        peak_factor = random.uniform(0.65, 0.88)

    # Weekends generally have lower commuter demand.
    weekend_factor = (
        random.uniform(0.70, 0.86)
        if day_of_week >= 5
        else random.uniform(0.96, 1.08)
    )

    stop_factor = STOP_PROFILES[stop_id]

    # Weather:
    # 0 = normal
    # 1 = rain/adverse conditions
    weather_index = random.choices([0, 1], weights=[0.78, 0.22])[0]

    weather_factor = (
        random.uniform(0.82, 0.95)
        if weather_index == 1
        else random.uniform(0.98, 1.03)
    )

    # Starting occupancy.
    current_passengers = random.randint(8, 58)

    # Previous observation gives the model a demand trend.
    previous_change = random.randint(-7, 7)
    previous_passengers = max(
        0,
        min(CAPACITY, current_passengers - previous_change)
    )

    passenger_delta = current_passengers - previous_passengers

    # Route demand component.
    expected = (
        current_passengers
        * peak_factor
        * weekend_factor
        * stop_factor
        * weather_factor
    )

    # Boarding pressure increases around popular stops.
    boarding = random.randint(0, 12)

    # More passengers tend to leave at certain stops.
    if stop_id in [3, 6, 9, 12]:
        alighting = random.randint(2, 10)
    else:
        alighting = random.randint(0, 6)

    # Demand momentum.
    trend_effect = passenger_delta * random.uniform(0.25, 0.60)

    # Small realistic noise.
    noise = random.gauss(0, 2.5)

    next_passengers = (
        expected
        + boarding
        - alighting
        + trend_effect
        + noise
    )

    next_passengers = max(
        0,
        min(85, next_passengers)
    )

    occupancy_ratio = current_passengers / CAPACITY

    # Peak indicator.
    peak_period = int(
        hour in [7, 8, 9, 17, 18, 19]
    )

    # Cyclic time representation.
    hour_sin = math.sin(2 * math.pi * hour / 24)
    hour_cos = math.cos(2 * math.pi * hour / 24)

    rows.append({
        "hour": hour,
        "day_of_week": day_of_week,
        "stop_id": stop_id,
        "current_passengers": current_passengers,
        "previous_passengers": previous_passengers,
        "passenger_delta": passenger_delta,
        "occupancy_ratio": round(occupancy_ratio, 4),
        "peak_period": peak_period,
        "hour_sin": round(hour_sin, 4),
        "hour_cos": round(hour_cos, 4),
        "weather_index": weather_index,
        "next_passengers": round(next_passengers, 1),
    })


out = Path(__file__).resolve().parent / "bus_history.csv"

df = pd.DataFrame(rows)
df.to_csv(out, index=False)

print(f"Generated {len(df)} rows at {out}")
print()
print("Columns:")
print(", ".join(df.columns))
print()
print("Target statistics:")
print(df["next_passengers"].describe())
