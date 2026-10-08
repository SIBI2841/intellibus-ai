export default function OperationsInsights({
  bus,
  prediction,
  operations,
  gps,
}) {
  if (!bus || !prediction || !operations) {
    return null;
  }

  const predictedPassengers = Number(prediction.predicted_passengers || 0);
  const currentPassengers = Number(bus.passengers || 0);
  const capacity = Number(bus.capacity || 0);
  const currentOccupancy = Number(bus.occupancy_percent || 0);
  const predictedOccupancy = Number(prediction.predicted_occupancy || 0);
  const overloadProbability = Number(prediction.overload_probability || 0);

  const passengerDelta = predictedPassengers - currentPassengers;

  const reasons = [];

  if (predictedOccupancy > 100) {
    reasons.push(
      `Predicted occupancy ${predictedOccupancy.toFixed(1)}% exceeds the ${capacity}-passenger capacity.`
    );
  } else if (predictedOccupancy >= 85) {
    reasons.push(
      `Predicted occupancy reaches ${predictedOccupancy.toFixed(1)}%, entering the high-risk range.`
    );
  }

  if (overloadProbability >= 70) {
    reasons.push(
      `The overload classifier estimates ${overloadProbability.toFixed(1)}% probability of capacity exceedance.`
    );
  }

  if (currentOccupancy >= 85) {
    reasons.push(
      `Current occupancy is already high at ${currentOccupancy.toFixed(1)}%.`
    );
  }

  if (bus.hour >= 7 && bus.hour <= 9) {
    reasons.push("The bus is operating during the morning peak period.");
  }

  if (passengerDelta > 0) {
    reasons.push(
      `The forecast adds approximately ${passengerDelta.toFixed(1)} passengers by the next stop.`
    );
  }

  if (reasons.length === 0) {
    reasons.push("Current demand indicators remain within the normal operating range.");
  }

  const isCritical = operations.overall_status === "CRITICAL";
  const isWarning = operations.overall_status === "WARNING";

  const fleetCritical = isCritical ? 1 : 0;
  const fleetWarning = isWarning ? 1 : 0;
  const fleetNormal = 12 - fleetCritical - fleetWarning;

  const eventRows = [
    {
      time: "NOW",
      type: "DATA",
      message: `${currentPassengers}/${capacity} passengers currently onboard`,
    },
    {
      time: "AI",
      type: "FORECAST",
      message: `${predictedPassengers.toFixed(1)} passengers predicted at ${bus.next_stop}`,
    },
    {
      time: "AI",
      type: "RISK",
      message: `${prediction.risk_level} · ${overloadProbability.toFixed(1)}% overload probability`,
    },
  ];

  if (gps?.status === "SPEED_VIOLATION") {
    eventRows.push({
      time: "GPS",
      type: "SAFETY",
      message: `Speed violation: ${gps.current_speed} km/h in a ${gps.allowed_speed} km/h zone`,
    });
  }

  eventRows.push({
    time: "SYSTEM",
    type: "DECISION",
    message: `${operations.overall_status} · ${operations.action}`,
  });

  return (
    <section className="insights-section">
      <div className="insights-heading">
        <div>
          <div className="card-title">AI OPERATIONS INTELLIGENCE</div>
          <h2>From prediction to operational decision</h2>
        </div>
        <span className="insights-live">LIVE ANALYSIS</span>
      </div>

      <div className="insights-grid">
        <section className="card ai-insights-card">
          <div className="card-title">AI INSIGHTS</div>

          <div className="insight-risk">
            <div>
              <span>OVERLOAD RISK</span>
              <strong>{overloadProbability.toFixed(1)}%</strong>
            </div>

            <span className={`insight-level ${prediction.risk_level.toLowerCase()}`}>
              {prediction.risk_level}
            </span>
          </div>

          <div className="insight-reasons">
            {reasons.slice(0, 4).map((reason, index) => (
              <div className="insight-reason" key={index}>
                <span className="insight-check">✓</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card prediction-timeline-card">
          <div className="card-title">PREDICTION TIMELINE</div>

          <div className="prediction-route">
            <div className="prediction-stop">
              <span className="prediction-dot"></span>
              <small>CURRENT</small>
              <strong>{currentPassengers}</strong>
              <span>passengers</span>
              <em>{currentOccupancy.toFixed(1)}%</em>
              <label>{bus.current_stop}</label>
            </div>

            <div className="prediction-line">
              <span>AI FORECAST</span>
              <b>→</b>
            </div>

            <div className="prediction-stop next">
              <span className="prediction-dot"></span>
              <small>NEXT STOP</small>
              <strong>{predictedPassengers.toFixed(1)}</strong>
              <span>passengers</span>
              <em>{predictedOccupancy.toFixed(1)}%</em>
              <label>{bus.next_stop}</label>
            </div>
          </div>
        </section>

        <section className="card intervention-card">
          <div className="card-title">RECOMMENDED INTERVENTION</div>

          <div className={`intervention-status ${operations.overall_status.toLowerCase()}`}>
            {operations.overall_status}
          </div>

          <h3>{operations.action}</h3>

          <div className="intervention-reason">
            <span>Decision basis</span>
            <strong>
              {isCritical
                ? "Multiple safety conditions require immediate intervention."
                : isWarning
                  ? "A developing risk requires operator attention."
                  : "No immediate intervention is required."}
            </strong>
          </div>
        </section>

        <section className="card why-critical-card">
          <div className="card-title">
            WHY {operations.overall_status}?
          </div>

          <div className="critical-checks">
            <div className={predictedOccupancy > 100 ? "triggered" : ""}>
              <span>✓</span>
              <div>
                <strong>Predicted occupancy</strong>
                <small>
                  {predictedOccupancy.toFixed(1)}% vs 100% capacity
                </small>
              </div>
            </div>

            <div className={overloadProbability >= 70 ? "triggered" : ""}>
              <span>✓</span>
              <div>
                <strong>Overload probability</strong>
                <small>{overloadProbability.toFixed(1)}%</small>
              </div>
            </div>

            <div className={gps?.status === "SPEED_VIOLATION" ? "triggered" : ""}>
              <span>✓</span>
              <div>
                <strong>GPS safety</strong>
                <small>
                  {gps?.status === "SPEED_VIOLATION"
                    ? `${gps.current_speed} km/h > ${gps.allowed_speed} km/h`
                    : "No active speed violation"}
                </small>
              </div>
            </div>
          </div>
        </section>

        <section className="card model-performance-card">
          <div className="card-title">MODEL PERFORMANCE</div>

          <div className="model-metrics">
            <div>
              <span>Forecast MAE</span>
              <strong>4.58</strong>
              <small>passengers</small>
            </div>

            <div>
              <span>Forecast R²</span>
              <strong>0.895</strong>
              <small>validation</small>
            </div>

            <div>
              <span>Classifier ROC-AUC</span>
              <strong>0.976</strong>
              <small>validation</small>
            </div>
          </div>

          <div className="model-note">
            Validation results from synthetic prototype data. These metrics
            are not real-world transit accuracy claims.
          </div>
        </section>

        <section className="card fleet-card">
          <div className="card-title">FLEET OVERVIEW</div>

          <div className="fleet-total">
            <strong>12</strong>
            <span>simulated buses monitored</span>
          </div>

          <div className="fleet-bars">
            <div>
              <span>NORMAL</span>
              <strong>{fleetNormal}</strong>
            </div>
            <div>
              <span>WARNING</span>
              <strong>{fleetWarning}</strong>
            </div>
            <div>
              <span>CRITICAL</span>
              <strong>{fleetCritical}</strong>
            </div>
          </div>

          <div className="fleet-disclaimer">
            Fleet figures are simulated for demonstration.
          </div>
        </section>

        <section className="card event-log-card">
          <div className="card-title">EVENT / ACTION LOG</div>

          <div className="event-log">
            {eventRows.map((event, index) => (
              <div className="event-row" key={`${event.type}-${index}`}>
                <span className="event-time">{event.time}</span>
                <span className={`event-type ${event.type.toLowerCase()}`}>
                  {event.type}
                </span>
                <span className="event-message">{event.message}</span>
              </div>
            ))}
          </div>

          <div className="event-flow">
            DATA <b>→</b> AI <b>→</b> RISK <b>→</b> DECISION <b>→</b> ACTION
          </div>
        </section>
      </div>
    </section>
  );
}
