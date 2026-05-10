import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000";

const GRADE_CONFIG = {
  A: { bg: "#1a7a4a", label: "Excellent", desc: "Very good nutritional quality" },
  B: { bg: "#85bb2f", label: "Good",      desc: "Good nutritional quality" },
  C: { bg: "#f5a623", label: "Moderate",  desc: "Average nutritional quality" },
  D: { bg: "#e07720", label: "Poor",      desc: "Poor nutritional quality" },
  E: { bg: "#e63c12", label: "Bad",       desc: "Very poor nutritional quality" },
};

const GradeBadge = ({ grade, size = "md" }) => {
  const cfg = GRADE_CONFIG[grade] || {};
  const dim = size === "lg" ? 80 : 44;
  const fs  = size === "lg" ? 32 : 18;
  return (
    <div style={{
      width: dim, height: dim, borderRadius: "50%",
      background: cfg.bg || "#999",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: fs, flexShrink: 0,
    }}>
      {grade}
    </div>
  );
};

const VerdictBanner = ({ verdict, claimed, calculated }) => {
  if (!verdict) return null;
  const colors = {
    match:    { bg: "#eaf7ef", border: "#1a7a4a", text: "#0f4d2e", icon: "✓" },
    mismatch: { bg: "#fff2ed", border: "#e63c12", text: "#7a1a00", icon: "✗" },
    unknown:  { bg: "#f5f5f5", border: "#aaa",    text: "#444",    icon: "?" },
  };
  const c = colors[verdict.status] || colors.unknown;
  return (
    <div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 12, padding: "16px 20px", marginTop: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 24, color: c.border }}>{c.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: c.text, fontSize: 16 }}>{verdict.message}</div>
          {verdict.status === "mismatch" && (
            <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#555" }}>
                Label claims: <strong style={{ color: GRADE_CONFIG[claimed]?.bg }}>{claimed}</strong>
              </span>
              <span style={{ fontSize: 13, color: "#555" }}>
                Our calculation: <strong style={{ color: GRADE_CONFIG[calculated]?.bg }}>{calculated}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScoreBreakdown = ({ breakdown, score, grade }) => {
  const { negative, positive } = breakdown;
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px" }}>Score breakdown (per 100g)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Negative nutrients */}
        <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#c00", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Negative nutrients (add points)
          </div>
          {[
            ["Energy", `${negative.energy_kj.value.toFixed(0)} kJ`, negative.energy_kj.points],
            ["Sugars", `${negative.sugars_g.value.toFixed(1)} g`, negative.sugars_g.points],
            ["Saturated fat", `${negative.saturated_fat_g.value.toFixed(1)} g`, negative.saturated_fat_g.points],
            ["Sodium", `${negative.sodium_mg.value.toFixed(0)} mg`, negative.sodium_mg.points],
          ].map(([label, val, pts]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "0.5px solid #f5ccc" }}>
              <span style={{ color: "#444" }}>{label} <span style={{ color: "#999" }}>({val})</span></span>
              <span style={{ fontWeight: 600, color: "#c00" }}>+{pts}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 8, color: "#900" }}>
            <span>Total negative</span><span>+{negative.total}</span>
          </div>
        </div>

        {/* Positive nutrients */}
        <div style={{ background: "#f0faf5", border: "1px solid #9de", borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a7a4a", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Positive nutrients (reduce points)
          </div>
          {[
            ["Fiber", `${positive.fiber_g.value.toFixed(1)} g`, positive.fiber_g.points],
            ["Protein", `${positive.protein_g.value.toFixed(1)} g`, positive.protein_g.points],
            ["Fruits / veg", `${positive.fruits_veg_pct.value.toFixed(0)}%`, positive.fruits_veg_pct.points],
          ].map(([label, val, pts]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "0.5px solid #bde" }}>
              <span style={{ color: "#444" }}>{label} <span style={{ color: "#999" }}>({val})</span></span>
              <span style={{ fontWeight: 600, color: "#1a7a4a" }}>-{pts}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 8, color: "#0f4d2e" }}>
            <span>Total positive</span><span>-{positive.total}</span>
          </div>
        </div>
      </div>

      {/* Final score */}
      <div style={{ background: "#f8f8f8", borderRadius: 10, padding: "14px 18px", marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: "#666" }}>Final score = {negative.total} − {positive.total}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{score} points → Grade <span style={{ color: GRADE_CONFIG[grade]?.bg }}>{grade}</span></div>
        </div>
        <GradeBadge grade={grade} size="lg" />
      </div>
    </div>
  );
};

// ── Manual form ────────────────────────────────────────────────────────────────
const FIELDS = [
  { key: "energy_kj",    label: "Energy (kJ)",         placeholder: "e.g. 1250",  step: 1,   hint: "per 100g or 100ml" },
  { key: "sugars",       label: "Sugars (g)",           placeholder: "e.g. 12",   step: 0.1, hint: "per 100g" },
  { key: "saturated_fat",label: "Saturated fat (g)",   placeholder: "e.g. 5",    step: 0.1, hint: "per 100g" },
  { key: "sodium_mg",    label: "Sodium (mg)",          placeholder: "e.g. 320",  step: 1,   hint: "per 100g — multiply salt g × 400" },
  { key: "fiber",        label: "Dietary fiber (g)",   placeholder: "e.g. 3",    step: 0.1, hint: "per 100g" },
  { key: "protein",      label: "Protein (g)",         placeholder: "e.g. 8",    step: 0.1, hint: "per 100g" },
  { key: "fruits_veg_nuts_pct", label: "Fruits / veg / nuts (%)", placeholder: "e.g. 0", step: 1, hint: "if not stated, leave 0" },
];

const ManualTab = () => {
  const empty = FIELDS.reduce((a, f) => ({ ...a, [f.key]: "" }), { claimed_grade: "", is_beverage: false });
  const [form,    setForm]    = useState(empty);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState(null);

  const submit = async () => {
    setError(null); setResult(null);
    const missing = FIELDS.slice(0, 6).find(f => form[f.key] === "");
    if (missing) { setError(`Please fill in "${missing.label}"`); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      FIELDS.forEach(f => { if (payload[f.key] !== "") payload[f.key] = parseFloat(payload[f.key]); });
      const res = await fetch(`${API}/check/manual`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>
        Enter the values from the nutrition table on the product (per 100g or 100ml).
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 4 }}>{f.label}</label>
            <input
              type="number" step={f.step} placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
            />
            <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{f.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 4 }}>
            Grade printed on label (optional)
          </label>
          <select
            value={form.claimed_grade}
            onChange={e => setForm(p => ({ ...p, claimed_grade: e.target.value }))}
            style={{ padding: "9px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, width: "100%" }}
          >
            <option value="">— not stated / unknown —</option>
            {["A","B","C","D","E"].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_beverage} onChange={e => setForm(p => ({ ...p, is_beverage: e.target.checked }))} />
          This is a beverage
        </label>
      </div>

      <button onClick={submit} disabled={loading}
        style={{ marginTop: 20, width: "100%", padding: "13px", background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Calculating…" : "Calculate & Verify Nutri-Score"}
      </button>

      {error && <div style={{ marginTop: 16, padding: 14, background: "#fff0f0", border: "1px solid #fcc", borderRadius: 8, color: "#c00", fontSize: 14 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 8 }}>
          <VerdictBanner verdict={result.verdict} claimed={result.verdict?.claimed} calculated={result.verdict?.calculated} />
          <ScoreBreakdown breakdown={result.breakdown} score={result.score} grade={result.grade} />
        </div>
      )}
    </div>
  );
};

// ── Barcode tab ────────────────────────────────────────────────────────────────
const BarcodeTab = () => {
  const [barcode,  setBarcode]  = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState(null);
  const videoRef = useRef(null);
  const quaggaRef = useRef(null);

  const stopCamera = () => {
    if (quaggaRef.current) { quaggaRef.current.stop(); quaggaRef.current = null; }
    setScanning(false);
  };

  const startCamera = async () => {
    setError(null);
    if (!window.Quagga) { setError("Quagga scanner not loaded. Please refresh."); return; }
    setScanning(true);
    setTimeout(() => {
      window.Quagga.init({
        inputStream: { type: "LiveStream", target: videoRef.current, constraints: { facingMode: "environment" } },
        decoder: { readers: ["ean_reader", "ean_8_reader"] },
      }, err => {
        if (err) { setError("Camera access failed: " + err.message); setScanning(false); return; }
        window.Quagga.start();
        quaggaRef.current = window.Quagga;
        window.Quagga.onDetected(data => {
          const code = data.codeResult.code;
          stopCamera();
          setBarcode(code);
          lookup(code);
        });
      });
    }, 300);
  };

  useEffect(() => () => stopCamera(), []);

  const lookup = async (code) => {
    const bc = code || barcode;
    if (!bc.trim()) { setError("Enter or scan a barcode first."); return; }
    setError(null); setResult(null); setLoading(true);
    try {
      const res = await fetch(`${API}/check/barcode/${bc.trim()}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Product not found"); }
      setResult(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>
        Scan the barcode on the product packaging or type it manually. We fetch the nutrition data from the Open Food Facts database.
      </p>

      {/* Camera scanner */}
      <div style={{ background: "#f5f5f5", borderRadius: 12, overflow: "hidden", marginBottom: 16, position: "relative" }}>
        <div ref={videoRef} style={{ width: "100%", display: scanning ? "block" : "none", minHeight: 220 }} />
        {!scanning && (
          <div style={{ textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <button onClick={startCamera}
              style={{ padding: "10px 24px", background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Scan barcode with camera
            </button>
          </div>
        )}
        {scanning && (
          <button onClick={stopCamera}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
            ✕ Stop
          </button>
        )}
      </div>

      {/* Manual barcode entry */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          type="text" placeholder="Or type EAN barcode (e.g. 4006381333931)"
          value={barcode} onChange={e => setBarcode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          style={{ flex: 1, padding: "11px 14px", border: "1.5px solid #ddd", borderRadius: 10, fontSize: 15 }}
        />
        <button onClick={() => lookup()} disabled={loading}
          style={{ padding: "11px 22px", background: "#1a7a4a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "…" : "Check"}
        </button>
      </div>

      {error && <div style={{ marginTop: 14, padding: 14, background: "#fff0f0", border: "1px solid #fcc", borderRadius: 8, color: "#c00", fontSize: 14 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 20 }}>
          {/* Product info header */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "#fafafa", border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
            {result.image_url && <img src={result.image_url} alt="" style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 8, border: "1px solid #eee" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{result.product_name}</div>
              {result.brand && <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>{result.brand}</div>}
              <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
                Barcode data found in Open Food Facts database.
              </div>
            </div>
            <GradeBadge grade={result.grade} size="lg" />
          </div>

          <VerdictBanner verdict={result.verdict} claimed={result.verdict?.claimed} calculated={result.verdict?.calculated} />
          <ScoreBreakdown breakdown={result.breakdown} score={result.score} grade={result.grade} />
        </div>
      )}
    </div>
  );
};

// ── App shell ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("barcode");

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f0", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a7a4a", color: "#fff", padding: "28px 24px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🔬</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>NutriScore Verifier</h1>
              <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.85 }}>
                Verify the Nutri-Score on German & European supermarket products using the official EU algorithm
              </p>
            </div>
          </div>

          {/* Grade legend */}
          <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
            {Object.entries(GRADE_CONFIG).map(([g, c]) => (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 10px" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>{g}</div>
                <span style={{ fontSize: 12 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div style={{ maxWidth: 700, margin: "24px auto", padding: "0 16px" }}>
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1.5px solid #eee" }}>
            {[
              { id: "barcode", icon: "📷", label: "Scan barcode" },
              { id: "manual",  icon: "✏️",  label: "Enter manually" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, padding: "16px", border: "none", background: tab === t.id ? "#fff" : "#f8f8f8", fontWeight: tab === t.id ? 700 : 400, fontSize: 15, cursor: "pointer", color: tab === t.id ? "#1a7a4a" : "#555", borderBottom: tab === t.id ? "2.5px solid #1a7a4a" : "none" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>
            {tab === "barcode" ? <BarcodeTab /> : <ManualTab />}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 20, padding: "16px 20px", background: "#e8f4ee", borderRadius: 12, fontSize: 13, color: "#2a5a3a" }}>
          <strong>How we verify:</strong> We apply the official EU Nutri-Score 2023 algorithm to the raw nutrition data and compare the result against the grade printed on the product. A mismatch may indicate a calculation error, an outdated formula being used, or the product's ingredients not matching the label.
        </div>
      </div>

      {/* Quagga CDN */}
      <script src="https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js" />
    </div>
  );
}
