import { useEffect, useState } from "react";
import CameraAI from "./CameraAI";
import LiveMap from "./LiveMap";
import OperationsInsights from "./OperationsInsights";

const API = "https://intellibus-ai-backend.onrender.com/api";

async function get(path) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function post(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function StatusPill({status}) {
  return <span className={`pill ${status.toLowerCase().replace("_","-")}`}>{status}</span>;
}

function App() {
  const [bus, setBus] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [gps, setGps] = useState(null);
  const [operations, setOperations] = useState(null);
  const [cameraVerification, setCameraVerification] = useState(null);
  const [gpsZones, setGpsZones] = useState([]);
  const [gpsZoneId, setGpsZoneId] = useState("school-01");
  const [gpsSpeed, setGpsSpeed] = useState(42);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      const selectedZone = gpsZones.find(
        (zone) => zone.id === gpsZoneId
      );

      const lat = selectedZone?.lat ?? 11.0168;
      const lon = selectedZone?.lon ?? 76.9558;

      const [b, p, g, o] = await Promise.all([
        get("/bus"),
        get("/prediction"),
        post("/gps/evaluate", {
          lat,
          lon,
          speed: gpsSpeed,
        }),
        get(
          `/operations/status?lat=${lat}&lon=${lon}&speed=${gpsSpeed}`
        ),
      ]);

      setBus(b);
      setPrediction(p);
      setGps(g);
      setOperations(o);
    } catch (e) {
      setError("Backend not ready. Start FastAPI and train the model first.");
    }
  }

  useEffect(() => {
    get("/gps/zones")
      .then(setGpsZones)
      .catch(() => setError("Could not load GPS zones."));
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 2500);
    return () => clearInterval(timer);
  }, [gpsZoneId, gpsSpeed]);

  async function change(delta) {
    await post("/bus/passengers", {delta});
    refresh();
  }

  async function reset() {
    await post("/bus/reset", {});
    refresh();
  }

  async function setScenario(targetPassengers) {
    await post("/bus/reset", {});

    const delta = targetPassengers - 54;

    if (delta !== 0) {
      await post("/bus/passengers", {delta});
    }

    refresh();
  }

  if (!bus || !prediction) {
    return (
      <main className="app">
        <section className="hero">
          <div>
            <div className="eyebrow">INTELLIBUS AI</div>
            <h1>Predict overcrowding before it becomes dangerous.</h1>
            <p>Starting dashboard...</p>
            {error && <div className="error">{error}</div>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">INTELLIBUS AI</div>
          <h1>Transport Operations Dashboard</h1>
        </div>
        <div className="bus-id">{bus.bus_id}</div>
      </header>

      {operations && (
        <section className={`operations-banner ${operations.overall_status.toLowerCase()}`}>
          <div>
            <div className="card-title">SYSTEM OPERATIONS STATUS</div>
            <div className="operations-status">
              {operations.overall_status}
            </div>
          </div>

          <div className="operations-action">
            <span>Recommended action</span>
            <strong>{operations.action}</strong>
          </div>

          <div className="operations-flags">
            {operations.safety_flags.length > 0 ? (
              operations.safety_flags.map((flag) => (
                <StatusPill key={flag} status={flag} />
              ))
            ) : (
              <StatusPill status="NORMAL" />
            )}
          </div>
        </section>
      )}

      <OperationsInsights
      bus={bus}
      prediction={prediction}
      operations={operations}
      gps={gps}
    />

    <section className="grid">
      {gps && (
        <LiveMap
          gpsZones={gpsZones}
          gps={gps}
          gpsZoneId={gpsZoneId}
          gpsSpeed={gpsSpeed}
        />
      )}
        <article className="card occupancy">
          <div className="card-title">LIVE OCCUPANCY</div>
          <div className="big-number">{bus.passengers}<span> / {bus.capacity}</span></div>
          <div className="progress">
            <div style={{width: `${Math.min(bus.occupancy_percent, 100)}%`}} />
          </div>
          <div className="row">
            <span>{bus.occupancy_percent}% occupied</span>
            <StatusPill status={bus.occupancy_status}/>
          </div>
          <div className="controls">
            <button onClick={() => change(-1)}>- Passenger</button>
            <button onClick={() => change(1)}>+ Passenger</button>
            <button className="danger" onClick={() => change(5)}>+5</button>
            <button onClick={reset}>Reset</button>
          </div>

          <div className="scenario-controls">
            <div className="scenario-label">
              <span>Simulation controls</span>
              <small>Synthetic demo data</small>
            </div>
            <button onClick={() => setScenario(24)}>NORMAL</button>
            <button onClick={() => setScenario(40)}>WARNING</button>
            <button className="danger" onClick={() => setScenario(45)}>CRITICAL</button>
          </div>
        </article>

        <article className="card">
          <div className="card-title">AI NEXT-STOP FORECAST</div>
          <div className="forecast">{prediction.predicted_passengers}</div>
          <div className="muted">predicted passengers at {prediction.next_stop}</div>
          <div className="forecast-meta">
            <div>
              <span>Predicted occupancy</span>
              <strong>{prediction.predicted_occupancy}%</strong>
            </div>
            <div>
              <span>Overload probability</span>
              <strong>{prediction.overload_probability}%</strong>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-title">AI RECOMMENDATION</div>
          <div className="risk">
            <StatusPill status={prediction.risk_level}/>
          </div>
          <p className="recommendation">{prediction.recommendation}</p>
          <div className="route">
            <span>{prediction.current_stop}</span>
            <b>?</b>
            <span>{prediction.next_stop}</span>
          </div>
        </article>

        <article className={`card departure ${bus.departure_status === "LOCKED" ? "locked" : ""}`}>
          <div className="card-title">DEPARTURE CONTROL</div>
          <div className="departure-status">{bus.departure_status}</div>
          <p>
            {bus.departure_status === "LOCKED"
              ? `AI predicts ${prediction.predicted_occupancy}% occupancy at ${prediction.next_stop}. Hold departure and dispatch additional capacity.`
              : "Bus is permitted to depart under current capacity."}
          </p>

          {cameraVerification?.cameraOn && (
            <div className="departure-camera-note">
              Visual verification: <strong>{cameraVerification.verificationStatus}</strong>
            </div>
          )}
        </article>

        <CameraAI
          busPassengers={bus.passengers}
          capacity={bus.capacity}
          onVerificationChange={setCameraVerification}
        />
        <article className="card gps-card">
          <div className="card-title">GPS SAFETY ZONE</div>

          <div className="gps-controls">
            <div className="gps-control">
              <label htmlFor="gps-zone">Simulated zone</label>
              <select
                id="gps-zone"
                value={gpsZoneId}
                onChange={(e) => setGpsZoneId(e.target.value)}
              >
                {gpsZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="gps-control">
              <label htmlFor="gps-speed">Vehicle speed</label>
              <div className="gps-speed-value">{gpsSpeed} km/h</div>
              <input
                id="gps-speed"
                className="gps-range"
                type="range"
                min="0"
                max="80"
                value={gpsSpeed}
                onChange={(e) => setGpsSpeed(Number(e.target.value))}
              />
            </div>
          </div>

          {gps && gps.inside_zone ? (
            <>
              <h2>{gps.zone.name}</h2>
              <div className="speed-row">
                <div>
                  <span>Current</span>
                  <strong>{gps.current_speed} km/h</strong>
                </div>
                <div>
                  <span>Allowed</span>
                  <strong>{gps.allowed_speed} km/h</strong>
                </div>
              </div>
              <StatusPill status={gps.status}/>
            </>
          ) : (
            <p>No restricted zone detected.</p>
          )}

          <p className="muted">Simulated GPS input for the prototype.</p>
        </article>
      </section>

      <footer>
        Hackathon prototype · Synthetic demo data · No real vehicle control
      </footer>
    </main>
  );
}

export default App;



















