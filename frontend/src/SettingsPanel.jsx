import { useEffect, useState } from "react";

const defaults = {
  busId: "TN-38-AB-1234",
  capacity: 60,
  routeStart: "Gandhipuram",
  routeEnd: "Hope College",
  speedLimit: 40,
  alertThreshold: 85,
  theme: "dark",
};

const stops = [
  "Gandhipuram", "Town Hall", "Ukkadam", "Railway Station",
  "Lakshmi Mills", "Peelamedu", "Hope College", "PSG Tech",
  "Airport", "Singanallur", "Saibaba Colony", "Brookefields",
  "Coimbatore Medical College", "Uppilipalayam", "Ganapathy",
  "Saravanampatti",
];

function StopPicker({ label, value, onChange, icon }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const matches = stops.filter((stop) =>
    stop.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  function choose(stop) {
    onChange(stop);
    setQuery(stop);
    setOpen(false);
  }

  return (
    <div className="stop-picker">
      <label className="stop-picker-label">{label}</label>
      <div className={`stop-combobox ${open ? "is-open" : ""}`}>
        <span className="stop-pin" aria-hidden="true">{icon}</span>
        <input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={label}
          aria-controls={`stop-list-${icon}`}
          value={query}
          placeholder="Search stops"
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches.length) choose(matches[0]);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
        />
        <button
          type="button"
          className="stop-menu-button"
          aria-label={`Show ${label.toLowerCase()} suggestions`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={`stop-chevron ${open ? "rotated" : ""}`}>⌄</span>
        </button>
        {open && (
          <div className="stop-suggestions" id={`stop-list-${icon}`} role="listbox">
            <div className="suggestions-heading">SUGGESTED STOPS</div>
            {matches.length ? matches.map((stop) => (
              <button
                type="button"
                role="option"
                aria-selected={value === stop}
                className={`stop-option ${value === stop ? "selected" : ""}`}
                key={stop}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(stop)}
              >
                <span className="suggestion-pin">{value === stop ? "✓" : "●"}</span>
                <span>{stop}</span>
                {value === stop && <span className="suggestion-check">Selected</span>}
              </button>
            )) : (
              <div className="no-stop-results">No matching stops. Choose a listed stop.</div>
            )}
            <div className="suggestions-footer">Coimbatore demo stop list</div>
          </div>
        )}
      </div>
      {!stops.includes(value) && (
        <span className="stop-validation">Choose a stop from the suggestion list.</span>
      )}
    </div>
  );
}

function GlassSlider({ label, value, min, max, suffix = "", onChange }) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="glass-slider-field">
      <div className="glass-slider-label">
        <label>{label}</label>
        <output>{value}{suffix}</output>
      </div>
      <input
        aria-label={label}
        className="glass-range"
        type="range"
        min={min}
        max={max}
        value={value}
        style={{ "--range-progress": `${percent}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="glass-range-ends"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
    </div>
  );
}

export default function SettingsPanel({ onClose, onSave, initialSettings }) {
  const [settings, setSettings] = useState(() => {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem("intellibus-settings") || "{}"),
        ...(initialSettings || {}),
      };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.intellibusTheme = settings.theme;
  }, [settings.theme]);

  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  }

  function save(event) {
    event.preventDefault();
    if (!stops.includes(settings.routeStart) || !stops.includes(settings.routeEnd)) {
      setError("Select both stops from the suggestions before saving.");
      return;
    }
    if (settings.routeStart === settings.routeEnd) {
      setError("Choose a different destination and starting stop.");
      return;
    }
    localStorage.setItem("intellibus-settings", JSON.stringify(settings));
    document.documentElement.dataset.intellibusTheme = settings.theme;
    onSave?.(settings);
    setSaved(true);
    setError("");
  }

  function reset() {
    setSettings(defaults);
    localStorage.setItem("intellibus-settings", JSON.stringify(defaults));
    document.documentElement.dataset.intellibusTheme = defaults.theme;
    onSave?.(defaults);
    setSaved(true);
    setError("");
  }

  return (
    <div className="settings-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <aside className="settings-panel settings-panel-polished" aria-label="Dashboard settings">
        <div className="settings-heading">
          <div>
            <div className="eyebrow">PREFERENCES</div>
            <h2>Control settings</h2>
            <p>Personalize your IntelliBus workspace.</p>
          </div>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="appearance-row">
          <div className="appearance-icon">{settings.theme === "dark" ? "☾" : "☀"}</div>
          <div className="appearance-copy">
            <strong>Appearance</strong>
            <span>{settings.theme === "dark" ? "Dark glass" : "Light glass"}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.theme === "dark"}
            aria-label="Toggle dark mode"
            className={`glass-switch ${settings.theme === "dark" ? "is-on" : ""}`}
            onClick={() => update("theme", settings.theme === "dark" ? "light" : "dark")}
          ><span /></button>
        </div>

        <form onSubmit={save} className="settings-form-polished">
          <div className="settings-section-title">VEHICLE</div>
          <label className="settings-text-field">
            Bus identifier
            <input value={settings.busId} onChange={(e) => update("busId", e.target.value)} required maxLength={32} />
          </label>

          <GlassSlider label="Passenger capacity" value={settings.capacity} min={10} max={100} onChange={(v) => update("capacity", v)} />

          <div className="settings-section-title">ROUTE PLANNER</div>
          <StopPicker label="Starting stop" icon="●" value={settings.routeStart} onChange={(v) => update("routeStart", v)} />
          <StopPicker label="Destination stop" icon="◎" value={settings.routeEnd} onChange={(v) => update("routeEnd", v)} />

          <div className="route-preview">
            <span className="route-preview-dot" />
            <div><strong>{settings.routeStart || "Starting stop"}</strong><span>Selected origin</span></div>
            <span className="route-preview-line" />
            <span className="route-preview-destination">◎</span>
            <div><strong>{settings.routeEnd || "Destination"}</strong><span>Selected destination</span></div>
          </div>

          <div className="settings-section-title">SAFETY THRESHOLDS</div>
          <GlassSlider label="Speed limit" value={settings.speedLimit} min={5} max={120} suffix=" km/h" onChange={(v) => update("speedLimit", v)} />
          <GlassSlider label="Occupancy alert threshold" value={settings.alertThreshold} min={50} max={100} suffix="%" onChange={(v) => update("alertThreshold", v)} />

          <p className="settings-note">Preferences are saved in this browser. Route suggestions are demo data and do not update the live backend or control a real vehicle.</p>
          {error && <p className="settings-error" role="alert">{error}</p>}
          <div className="settings-actions">
            <button type="submit" className="settings-save">Save settings</button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          {saved && <div className="settings-saved" role="status">✓ Preferences saved</div>}
        </form>
      </aside>
    </div>
  );
}
