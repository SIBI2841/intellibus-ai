import { useEffect, useState } from "react";

const initialTelemetry = {
  distanceCm: 42,
  gpsLat: 11.0168,
  gpsLon: 76.9558,
  speedKmh: 32,
  doorOpen: false,
  heartbeat: 0,
};

function Metric({ label, value, unit = "", detail }) {
  return (
    <div className="iot-metric">
      <span className="iot-muted">{label}</span>
      <strong>{value}{unit}</strong>
      <small>{detail}</small>
    </div>
  );
}

function DeviceCard({ icon, title, status, children }) {
  return (
    <article className="card iot-device-card">
      <div className="iot-device-heading">
        <span className="iot-device-icon" aria-hidden="true">{icon}</span>
        <div>
          <h3>{title}</h3>
          <span className="iot-muted">ESP32 prototype</span>
        </div>
        <span className="iot-sim-badge">SIMULATED</span>
      </div>
      {children}
      <div className="iot-device-status">
        <span className="iot-status-dot" />
        {status}
      </div>
    </article>
  );
}


const circuitParts = {
  esp32: {
    title: "ESP32 DevKit",
    description: "Main microcontroller. Reads sensor signals and is designed to transmit telemetry over Wi-Fi.",
    pins: "GPIO 5 ? GPIO 18 ? GPIO 19 ? GPIO 16 (RX2) ? GPIO 17 (TX2)",
    voltage: "Typically 3.3 V GPIO logic"
  },
  ultrasonic: {
    title: "HC-SR04 ultrasonic sensor",
    description: "Measures distance using an ultrasonic pulse and its echo. In this demo, the reading is simulated.",
    pins: "TRIG ? GPIO 5 ? ECHO ? GPIO 18",
    voltage: "Check the module voltage; level-shift the 5 V ECHO signal before connecting to ESP32 GPIO"
  },
  gps: {
    title: "GPS / UART module",
    description: "Provides latitude and longitude to the controller. Coordinates shown here are simulated or supplied by the dashboard.",
    pins: "GPS TX ? GPIO 16 (RX2) ? GPS RX ? GPIO 17 (TX2)",
    voltage: "Verify the specific GPS board's supply and logic levels"
  },
  door: {
    title: "Door status input",
    description: "Represents a digital door-position switch. The on-screen door control changes the simulated state only.",
    pins: "Signal ? GPIO 19 ? GND ? GND",
    voltage: "Use a suitable switch circuit and input pull-up/pull-down"
  }
};

function CircuitVisualizer({ telemetry, doorOpen, onToggleDoor }) {
  const [selected, setSelected] = useState("esp32");
  const part = circuitParts[selected];

  const selectPart = (id) => setSelected(id);
  const keyboardSelect = (event, id) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectPart(id);
    }
  };

  return (
    <article className="card iot-circuit">
      <div className="iot-circuit-heading">
        <div>
          <p className="iot-eyebrow">INTERACTIVE HARDWARE MODEL</p>
          <h3>ESP32 connected circuit</h3>
          <p className="iot-muted">Select a board or sensor to inspect its connections.</p>
        </div>
        <span className="iot-sim-badge">VIRTUAL WIRING</span>
      </div>

      <div className="iot-circuit-legend">
        <span><i className="wire-dot wire-red" />Power / supply</span>
        <span><i className="wire-dot wire-black" />Ground</span>
        <span><i className="wire-dot wire-yellow" />Digital signal</span>
        <span><i className="wire-dot wire-blue" />UART data</span>
      </div>

      <div className="iot-circuit-canvas">
        <svg className="iot-circuit-svg" viewBox="0 0 900 470" role="img" aria-label="Interactive ESP32 circuit with connected ultrasonic sensor, GPS module and door switch">
          <defs>
            <pattern id="circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity=".08"/>
            </pattern>
          </defs>
          <rect width="900" height="470" rx="16" fill="url(#circuit-grid)"/>

          {/* Wires are behind the component artwork. */}
          <g className="circuit-wire-group" onClick={() => selectPart("ultrasonic")}>
            <path d="M180 165 H260 V125 H380" className="circuit-wire wire-red"/>
            <path d="M180 185 H245 V365 H380" className="circuit-wire wire-black"/>
            <path d="M180 205 H300 V190 H380" className="circuit-wire wire-yellow"/>
            <path d="M180 225 H320 V220 H380" className="circuit-wire wire-yellow"/>

            <path d="M520 145 H600 V115 H660" className="circuit-wire wire-red"/>
            <path d="M520 170 H625 V190 H660" className="circuit-wire wire-black"/>
            <path d="M520 195 H610 V165 H660" className="circuit-wire wire-blue"/>
            <path d="M520 220 H635 V140 H660" className="circuit-wire wire-blue"/>

            <path d="M520 320 H620 V350 H660" className="circuit-wire wire-yellow"/>
            <path d="M520 345 H600 V390 H660" className="circuit-wire wire-black"/>
          </g>

          {/* HC-SR04 ultrasonic sensor */}
          <g className={selected === "ultrasonic" ? "circuit-part selected" : "circuit-part"} role="button" tabIndex="0" aria-label="Inspect ultrasonic sensor" onClick={() => selectPart("ultrasonic")} onKeyDown={(e) => keyboardSelect(e, "ultrasonic")}>
            <rect x="25" y="115" width="155" height="155" rx="12" className="circuit-module"/>
            <rect x="42" y="135" width="121" height="48" rx="8" className="circuit-sensor-board"/>
            <circle cx="72" cy="159" r="15" className="circuit-sensor-eye"/>
            <circle cx="72" cy="159" r="9" className="circuit-sensor-core"/>
            <circle cx="133" cy="159" r="15" className="circuit-sensor-eye"/>
            <circle cx="133" cy="159" r="9" className="circuit-sensor-core"/>
            <circle cx="180" cy="165" r="4" className="circuit-terminal"/>
            <circle cx="180" cy="185" r="4" className="circuit-terminal"/>
            <circle cx="180" cy="205" r="4" className="circuit-terminal"/>
            <circle cx="180" cy="225" r="4" className="circuit-terminal"/>
            <text x="102" y="207" textAnchor="middle" className="circuit-label">HC-SR04</text>
            <text x="102" y="229" textAnchor="middle" className="circuit-sub-label">{telemetry.distanceCm} cm (demo)</text>
            <text x="102" y="250" textAnchor="middle" className="circuit-pin-label">VCC TRIG ECHO GND</text>
          </g>

          {/* ESP32 DevKit controller */}
          <g className={selected === "esp32" ? "circuit-part selected" : "circuit-part"} role="button" tabIndex="0" aria-label="Inspect ESP32 controller" onClick={() => selectPart("esp32")} onKeyDown={(e) => keyboardSelect(e, "esp32")}>
            <rect x="350" y="80" width="190" height="315" rx="16" className="circuit-esp-board"/>
            <rect x="405" y="105" width="80" height="30" rx="5" className="circuit-chip"/>
            <path d="M420 115H470 M420 122H470 M420 129H470" className="circuit-metal-line"/>
            <rect x="380" y="155" width="130" height="125" rx="8" className="circuit-chip"/>
            <text x="445" y="202" textAnchor="middle" className="circuit-chip-text">ESP32</text>
            <text x="445" y="224" textAnchor="middle" className="circuit-chip-small">DEVKIT</text>
            <text x="445" y="305" textAnchor="middle" className="circuit-label">CONTROLLER</text>
            <text x="445" y="370" textAnchor="middle" className="circuit-sub-label">Virtual board</text>

            <circle cx="380" cy="125" r="5" className="circuit-terminal"/>
            <circle cx="380" cy="190" r="5" className="circuit-terminal"/>
            <circle cx="380" cy="220" r="5" className="circuit-terminal"/>
            <circle cx="380" cy="365" r="5" className="circuit-terminal"/>
            <text x="365" y="119" textAnchor="end" className="circuit-pin-label">5V</text>
            <text x="365" y="184" textAnchor="end" className="circuit-pin-label">GPIO 5</text>
            <text x="365" y="214" textAnchor="end" className="circuit-pin-label">GPIO 18</text>
            <text x="365" y="359" textAnchor="end" className="circuit-pin-label">GND</text>

            <circle cx="520" cy="145" r="5" className="circuit-terminal"/>
            <circle cx="520" cy="170" r="5" className="circuit-terminal"/>
            <circle cx="520" cy="195" r="5" className="circuit-terminal"/>
            <circle cx="520" cy="220" r="5" className="circuit-terminal"/>
            <circle cx="520" cy="320" r="5" className="circuit-terminal"/>
            <circle cx="520" cy="345" r="5" className="circuit-terminal"/>
            <text x="535" y="140" className="circuit-pin-label">3V3</text>
            <text x="535" y="165" className="circuit-pin-label">GND</text>
            <text x="535" y="190" className="circuit-pin-label">GPIO 16</text>
            <text x="535" y="215" className="circuit-pin-label">GPIO 17</text>
            <text x="535" y="315" className="circuit-pin-label">GPIO 19</text>
            <text x="535" y="340" className="circuit-pin-label">GND</text>
          </g>

          {/* GPS module */}
          <g className={selected === "gps" ? "circuit-part selected" : "circuit-part"} role="button" tabIndex="0" aria-label="Inspect GPS module" onClick={() => selectPart("gps")} onKeyDown={(e) => keyboardSelect(e, "gps")}>
            <rect x="660" y="65" width="215" height="175" rx="12" className="circuit-module"/>
            <circle cx="660" cy="115" r="5" className="circuit-terminal"/>
            <circle cx="660" cy="140" r="5" className="circuit-terminal"/>
            <circle cx="660" cy="165" r="5" className="circuit-terminal"/>
            <circle cx="660" cy="190" r="5" className="circuit-terminal"/>
            <rect x="710" y="83" width="125" height="48" rx="5" className="circuit-gps-antenna"/>
            <path d="M720 95H825 M720 105H825 M720 115H825 M750 88V126 M775 88V126 M800 88V126" className="circuit-antenna-line"/>
            <text x="767" y="157" textAnchor="middle" className="circuit-chip-small">GPS / UART</text>
            <text x="767" y="184" textAnchor="middle" className="circuit-label">GPS MODULE</text>
            <text x="767" y="211" textAnchor="middle" className="circuit-pin-label">VCC GND TX RX</text>
          </g>

          {/* Door status switch */}
          <g className={selected === "door" ? "circuit-part selected" : "circuit-part"} role="button" tabIndex="0" aria-label="Inspect door status switch" onClick={() => selectPart("door")} onKeyDown={(e) => keyboardSelect(e, "door")}>
            <rect x="660" y="310" width="215" height="105" rx="12" className="circuit-module"/>
            <circle cx="660" cy="350" r="5" className="circuit-terminal"/>
            <circle cx="660" cy="390" r="5" className="circuit-terminal"/>
            <rect x="682" y="330" width="48" height="36" rx="5" className={doorOpen ? "circuit-door-open" : "circuit-door-closed"}/>
            <path d={doorOpen ? "M690 358L722 337" : "M690 358H722"} className="circuit-switch-line"/>
            <circle cx="690" cy="358" r="4" className="circuit-terminal"/>
            <circle cx="722" cy="358" r="4" className="circuit-terminal"/>
            <text x="745" y="345" className="circuit-label">DOOR INPUT</text>
            <text x="745" y="370" className="circuit-sub-label">{doorOpen ? "OPEN" : "CLOSED"}</text>
            <text x="767" y="395" textAnchor="middle" className="circuit-pin-label">GPIO 19 (simulated)</text>
          </g>

          <text x="25" y="450" className="circuit-footnote">Illustrative wiring only. Verify pinout, voltage and logic levels before physical assembly.</text>
        </svg>
      </div>

      <div className="iot-circuit-selectors" aria-label="Select a circuit component">
        {Object.entries(circuitParts).map(([id, item]) => (
          <button key={id} type="button" className={selected === id ? "iot-circuit-select active" : "iot-circuit-select"} onClick={() => selectPart(id)} aria-pressed={selected === id}>
            {item.title}
          </button>
        ))}
      </div>

      <div className="iot-circuit-details" aria-live="polite">
        <div>
          <p className="iot-eyebrow">SELECTED COMPONENT</p>
          <h4>{part.title}</h4>
          <p>{part.description}</p>
        </div>
        <div className="iot-circuit-specs">
          <div><span>Connections</span><strong>{part.pins}</strong></div>
          <div><span>Electrical note</span><strong>{part.voltage}</strong></div>
          {selected === "ultrasonic" && <div><span>Current demo reading</span><strong>{telemetry.distanceCm} cm ? simulated</strong></div>}
          {selected === "door" && (
            <button type="button" className="iot-action-button" onClick={onToggleDoor}>
              Simulate {doorOpen ? "closing" : "opening"} door
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HardwareIoT({ settings = {}, gps, bus }) {
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [doorOpen, setDoorOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTelemetry((previous) => ({
        ...previous,
        distanceCm: Math.round(25 + Math.random() * 95),
        speedKmh: Math.round(18 + Math.random() * 32),
        heartbeat: previous.heartbeat + 1,
      }));
    }, 2500);

    return () => window.clearInterval(timer);
  }, []);

  const capacity = Number(settings.capacity) || bus?.capacity || 60;
  const passengers = Number(bus?.passengers) || 0;
  const busId = settings.busId || "TN-38-AB-1234";
  const speed = Number(gps?.speed ?? telemetry.speedKmh);
  const speedLimit = Number(settings.speedLimit) || 40;
  const latitude = Number(gps?.lat ?? telemetry.gpsLat);
  const longitude = Number(gps?.lon ?? telemetry.gpsLon);

  return (
    <section className="iot-page">
      <div className="iot-page-header">
        <div>
          <p className="iot-eyebrow">INTELLIBUS / DEVICE LAYER</p>
          <h2>Hardware &amp; IoT</h2>
          <p className="iot-muted">
            ESP32 sensor network, live dashboard integration and device architecture.
          </p>
        </div>
        <span className="iot-sim-badge iot-sim-badge-large">
          DEMO · SIMULATED HARDWARE
        </span>
      </div>

      <div className="iot-notice" role="note">
        <strong>Simulation mode</strong>
        <span>
          No physical ESP32 or external sensors are connected. Sensor values
          are generated for demonstration; GPS values may use the dashboard
          evaluation data when available.
        </span>
      </div>

      <div className="iot-overview-grid">
        <Metric label="DEVICE ID" value="ESP32-BUS-01" detail="Virtual controller" />
        <Metric label="BUS" value={busId} detail="Current dashboard configuration" />
        <Metric label="PASSENGERS" value={`${passengers} / ${capacity}`} detail="Dashboard occupancy" />
        <Metric label="HEARTBEAT" value={telemetry.heartbeat} detail="Simulated updates · 2.5 sec" />
      </div>

      <div className="iot-device-grid">
        <DeviceCard icon="▦" title="ESP32 controller" status="Virtual device running">
          <div className="iot-detail-list">
            <div><span>Transport</span><strong>Wi-Fi / HTTP-ready</strong></div>
            <div><span>Connection</span><strong>Simulation only</strong></div>
            <div><span>Firmware</span><strong>Prototype v1.0</strong></div>
          </div>
        </DeviceCard>

        <DeviceCard icon="◉" title="AI camera" status="Uses existing browser camera module">
          <div className="iot-detail-list">
            <div><span>Inference</span><strong>COCO-SSD in browser</strong></div>
            <div><span>Video source</span><strong>Browser webcam</strong></div>
            <div><span>ESP32 camera</span><strong>Not connected</strong></div>
          </div>
        </DeviceCard>

        <DeviceCard icon="⌁" title="Ultrasonic sensor" status="Simulated distance readings">
          <div className="iot-sensor-reading">
            <strong>{telemetry.distanceCm}</strong><span>cm</span>
          </div>
          <p className="iot-muted">
            Example HC-SR04 distance reading. Passenger counts still come from
            the dashboard and AI workflow, not this simulated distance.
          </p>
        </DeviceCard>

        <DeviceCard icon="⌖" title="GPS module" status="Dashboard coordinates or simulated fallback">
          <div className="iot-detail-list">
            <div><span>Latitude</span><strong>{Number.isFinite(latitude) ? latitude.toFixed(5) : "—"}</strong></div>
            <div><span>Longitude</span><strong>{Number.isFinite(longitude) ? longitude.toFixed(5) : "—"}</strong></div>
            <div><span>Source</span><strong>{gps ? "Dashboard evaluation" : "Simulated fallback"}</strong></div>
          </div>
        </DeviceCard>

        <DeviceCard icon="↗" title="Speed monitoring" status={speed > speedLimit ? "Over configured speed limit" : "Within configured limit"}>
          <div className="iot-sensor-reading">
            <strong>{Number.isFinite(speed) ? speed.toFixed(0) : "—"}</strong><span>km/h</span>
          </div>
          <div className="iot-detail-list">
            <div><span>Configured limit</span><strong>{speedLimit} km/h</strong></div>
            <div><span>Reading source</span><strong>{gps ? "Dashboard data" : "Simulated"}</strong></div>
          </div>
        </DeviceCard>

        <DeviceCard icon="⇆" title="Door status sensor" status={doorOpen ? "Door open · simulated alert" : "Door closed · simulated"}>
          <div className="iot-door-control">
            <span className={`iot-door-indicator ${doorOpen ? "is-open" : ""}`} />
            <strong>{doorOpen ? "OPEN" : "CLOSED"}</strong>
            <button type="button" className="iot-action-button" onClick={() => setDoorOpen((value) => !value)}>
              Simulate {doorOpen ? "closing" : "opening"} door
            </button>
          </div>
          <p className="iot-muted">Demo control only. It does not operate a real bus door.</p>
        </DeviceCard>
      </div>

      <CircuitVisualizer telemetry={telemetry} doorOpen={doorOpen} onToggleDoor={() => setDoorOpen((value) => !value)} />

      <article className="card iot-architecture">
        <p className="iot-eyebrow">SYSTEM ARCHITECTURE</p>
        <h3>From sensors to safety insights</h3>
        <div className="iot-flow">
          <div><strong>ESP32</strong><span>Ultrasonic · GPS · speed · door</span></div>
          <span className="iot-flow-arrow">→</span>
          <div><strong>HTTP / MQTT</strong><span>Planned telemetry transport</span></div>
          <span className="iot-flow-arrow">→</span>
          <div><strong>FastAPI</strong><span>API and safety evaluation</span></div>
          <span className="iot-flow-arrow">→</span>
          <div><strong>Dashboard</strong><span>AI · occupancy · alerts</span></div>
        </div>
        <p className="iot-muted">
          The transport and physical-device link are architectural targets,
          not active connections in this demo.
        </p>
      </article>

      <article className="card iot-pinout">
        <p className="iot-eyebrow">PROPOSED WIRING</p>
        <h3>ESP32 pin assignment</h3>
        <p className="iot-muted">Example wiring plan for a future physical prototype. Verify voltage levels and board pin constraints before wiring.</p>
        <div className="iot-pin-table">
          <div className="iot-pin-row iot-pin-head"><span>Component</span><span>ESP32 pin</span><span>Purpose</span></div>
          <div className="iot-pin-row"><span>HC-SR04 TRIG</span><code>GPIO 5</code><span>Trigger output</span></div>
          <div className="iot-pin-row"><span>HC-SR04 ECHO</span><code>GPIO 18</code><span>Echo input · level shifting required</span></div>
          <div className="iot-pin-row"><span>Door sensor</span><code>GPIO 19</code><span>Digital input</span></div>
          <div className="iot-pin-row"><span>GPS module TX</span><code>GPIO 16 (RX2)</code><span>UART receive</span></div>
          <div className="iot-pin-row"><span>GPS module RX</span><code>GPIO 17 (TX2)</code><span>UART transmit</span></div>
          <div className="iot-pin-row"><span>Wi-Fi telemetry</span><code>Built-in</code><span>Network connection</span></div>
        </div>
      </article>
    </section>
  );
}
