import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Approximate illustrative coordinates for the Coimbatore demo.
// These are not verified bus-stop GPS coordinates.
const STOP_COORDINATES = {
  "Gandhipuram": [11.0183, 76.9725],
  "Town Hall": [10.9950, 76.9614],
  "Ukkadam": [10.9880, 76.9590],
  "Railway Station": [10.9965, 76.9660],
  "Lakshmi Mills": [11.0090, 76.9780],
  "Peelamedu": [11.0260, 77.0120],
  "Hope College": [11.0450, 77.0270],
  "PSG Tech": [11.0240, 77.0020],
  "Airport": [11.0300, 77.0430],
  "Singanallur": [11.0000, 77.0280],
  "Saibaba Colony": [11.0250, 76.9470],
  "Brookefields": [11.0020, 76.9670],
  "Coimbatore Medical College": [11.0280, 77.0200],
  "Uppilipalayam": [11.0050, 76.9840],
  "Ganapathy": [11.0430, 76.9940],
  "Saravanampatti": [11.0800, 77.0050],
};

const ROUTE_START = STOP_COORDINATES["Gandhipuram"];
const ROUTE_END = STOP_COORDINATES["Hope College"];

function makeFallbackRoute(start, end) {
  return Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    return [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
    ];
  });
}

const FALLBACK_ROUTE = [
  [11.0168, 76.9558],
  [11.0170, 76.9570],
  [11.0172, 76.9585],
  [11.0177, 76.9600],
  [11.0180, 76.9620],
  [11.0182, 76.9640],
  [11.0184, 76.9660],
  [11.0184, 76.9680],
  [11.0183, 76.9700],
  [11.0183, 76.9725],
];

const ZONE_NAMES = {
  "school-01": "Demo School Zone",
  "hospital-01": "Demo Hospital Zone",
  "terminal-01": "Demo Bus Terminal",
};

const busIcon = L.divIcon({
  className: "intellibus-map-marker",
  html: `
    <div class="map-bus-marker">
      <span class="map-bus-pulse"></span>

      <svg
        class="rendered-bus-svg"
        width="58"
        height="58"
        viewBox="0 0 58 58"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="29" cy="29" r="23" fill="#0f172a" opacity="0.92"/>

        <rect
          x="13"
          y="10"
          width="32"
          height="38"
          rx="7"
          fill="#1e293b"
          stroke="#f5f7fb"
          stroke-width="2"
        />

        <rect
          x="17"
          y="14"
          width="24"
          height="12"
          rx="3"
          fill="#64748b"
          stroke="#cbd5e1"
          stroke-width="1"
        />

        <line x1="25" y1="14" x2="25" y2="26" stroke="#cbd5e1" stroke-width="1"/>
        <line x1="33" y1="14" x2="33" y2="26" stroke="#cbd5e1" stroke-width="1"/>

        <rect x="17" y="30" width="24" height="7" rx="2" fill="#334155"/>

        <circle cx="18" cy="44" r="4" fill="#020617" stroke="#94a3b8" stroke-width="1.5"/>
        <circle cx="40" cy="44" r="4" fill="#020617" stroke="#94a3b8" stroke-width="1.5"/>

        <circle cx="16" cy="20" r="2" fill="#f8fafc"/>
        <circle cx="42" cy="20" r="2" fill="#f8fafc"/>

        <rect x="24" y="39" width="10" height="3" rx="1.5" fill="#22c55e"/>
      </svg>
    </div>
  `,
  iconSize: [58, 58],
  iconAnchor: [29, 29],
});

function interpolate(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
}

function interpolateRoute(route, value) {
  if (!route.length) return ROUTE_START;

  if (route.length === 1) return route[0];

  const scaled = value * (route.length - 1);
  const index = Math.min(Math.floor(scaled), route.length - 2);
  const localProgress = scaled - index;

  return interpolate(
    route[index],
    route[index + 1],
    localProgress
  );
}

export default function LiveMap({
  gpsZones = [],
  gps,
  gpsZoneId = "school-01",
  gpsSpeed = 42,
  settings = {},
}) {
  const routeStartName = settings.routeStart || "Gandhipuram";
  const routeEndName = settings.routeEnd || "Hope College";
  const startPoint = STOP_COORDINATES[routeStartName] || ROUTE_START;
  const endPoint = STOP_COORDINATES[routeEndName] || ROUTE_END;
  const busId = settings.busId || "{busId}";

  const [roadRoute, setRoadRoute] = useState(() => makeFallbackRoute(startPoint, endPoint));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRoadRoute() {
      try {
        const start = `${startPoint[1]},${startPoint[0]}`;
        const end = `${endPoint[1]},${endPoint[0]}`;

        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
          throw new Error("Road routing request failed");
        }

        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (!coordinates?.length) {
          throw new Error("No road geometry returned");
        }

        const route = coordinates.map(([lon, lat]) => [lat, lon]);

        if (!cancelled) {
          setRoadRoute(route);
        }
      } catch {
        if (!cancelled) {
          setRoadRoute(makeFallbackRoute(startPoint, endPoint));
        }
      }
    }

    loadRoadRoute();

    return () => {
      cancelled = true;
    };
  }, [routeStartName, routeEndName]);

  useEffect(() => {
    setProgress(0);
  }, [routeStartName, routeEndName]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gpsSpeed <= 0) {
        return;
      }

      setProgress((value) => {
        const movement = Math.max(0.0015, gpsSpeed / 9000);
        const next = value + movement;

        if (next >= 1) {
          return 0;
        }

        return next;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [gpsSpeed]);

  const position = useMemo(
    () => interpolateRoute(roadRoute, progress),
    [roadRoute, progress]
  );

  const selectedZone = gpsZones.find(
    (zone) => zone.id === gpsZoneId
  );

  const activeZone = selectedZone || gps?.zone;

  const mapStatus =
    gps?.status === "SPEED_VIOLATION"
      ? "SPEED VIOLATION"
      : gps?.inside_zone
        ? "ZONE SAFE"
        : "EN ROUTE";

  return (
    <section className="card live-map-card">
      <div className="card-title">LIVE BUS TRACKING</div>
      <div className="map-route-label">Demo route: {routeStartName} ? {routeEndName}</div>

      <div className="live-map-header">
        <div>
          <div className="live-map-title">{busId}</div>
          <div className="live-map-subtitle">
            Simulated GPS telemetry · Road-following route
          </div>
        </div>

        <div
          className={`map-status ${
            gps?.status === "SPEED_VIOLATION"
              ? "danger"
              : "safe"
          }`}
        >
          <span className="map-live-dot"></span>
          {mapStatus}
        </div>
      </div>

      <div className="live-map">
        <MapContainer
          key={`${routeStartName}-${routeEndName}`}
          center={[(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2]}
          zoom={13}
          scrollWheelZoom={true}
          attributionControl={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline
            positions={roadRoute}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.85,
            }}
          />

          {gpsZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lon]}
              radius={zone.radius_m}
              pathOptions={{
                color:
                  zone.id === gpsZoneId
                    ? "#f59e0b"
                    : "#64748b",
                fillOpacity:
                  zone.id === gpsZoneId
                    ? 0.12
                    : 0.05,
              }}
            />
          ))}

          <Marker position={position} icon={busIcon}>
            <Popup>
              <strong>{busId}</strong>
              <br />
              Speed: {gpsSpeed} km/h
              <br />
              Status: {mapStatus}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="map-telemetry">
        <div>
          <span>Current position</span>
          <strong>
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </strong>
        </div>

        <div>
          <span>Vehicle speed</span>
          <strong>{gpsSpeed} km/h</strong>
        </div>

        <div>
          <span>Active zone</span>
          <strong>
            {activeZone?.name ||
              ZONE_NAMES[gpsZoneId] ||
              "No restricted zone"}
          </strong>
        </div>

        <div>
          <span>GPS status</span>
          <strong>{mapStatus}</strong>
        </div>
      </div>

      <div className="map-note">
        Selected-stop coordinates are illustrative demo approximations. Road routing uses OpenStreetMap routing data when available; GPS movement is simulated for this hackathon demonstration.
      </div>
    </section>
  );
}
