# IntelliBus AI

> **Predict overcrowding before it becomes dangerous.**

IntelliBus AI is an AI-powered public transport operations platform that predicts next-stop passenger demand, identifies overload risk, evaluates restricted-zone speed compliance, verifies occupancy using camera-based person detection, and converts those signals into operational recommendations.

## Problem

Public transport operators often react to overcrowding only after a bus is already full or passengers are already waiting at the next stop.

IntelliBus AI addresses this by combining:

- Current passenger occupancy
- Historical and synthetic demand patterns
- Next-stop passenger forecasting
- Overload probability classification
- Departure control
- Camera-based visual verification
- Simulated GPS safety-zone monitoring
- A unified operations decision layer

The key idea is:

**Detecting overcrowding is reactive. Predicting it enables intervention.**

---

## What the prototype does

### 1. Live occupancy simulation

The dashboard provides a simulated passenger count for a bus with a configurable capacity.

The operator can:

- Add passengers
- Remove passengers
- Add five passengers at once
- Reset the demonstration
- Switch directly between predefined demo scenarios

The system calculates:

- Current occupancy percentage
- SAFE / MODERATE / HIGH occupancy status
- AI departure readiness

---

### 2. AI next-stop passenger forecasting

The prediction engine estimates passenger demand at the next stop using features including:

- Hour
- Day of week
- Stop ID
- Current passenger count
- Previous passenger count
- Passenger change
- Occupancy ratio
- Peak-period indicator
- Cyclic time features
- Weather index

The prototype uses a **Gradient Boosting regression model** for next-stop passenger forecasting.

The model is trained on synthetic historical bus data generated specifically for the prototype.

---

### 3. Overload probability classification

A separate **Random Forest classifier** estimates the probability that the next-stop passenger count will exceed the bus capacity.

The classifier is trained against the target:

```text
next_passengers > capacity

