export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading PaulNova"
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        background: "#080d1b",
        color: "#ffffff",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            borderRadius: 22,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #756bff, #4035c8)",
            boxShadow: "0 12px 48px rgba(99,91,255,.35)",
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "-3px",
          }}
        >
          PN
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-1px" }}>PaulNova</div>
          <div style={{ marginTop: 7, color: "#aab2c5", fontSize: 11, letterSpacing: "2.4px", textTransform: "uppercase" }}>
            Technology. Intelligence. Opportunities.
          </div>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: 148,
            height: 3,
            borderRadius: 99,
            overflow: "hidden",
            background: "#263149",
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: "42%",
              height: "100%",
              borderRadius: 99,
              background: "#827bff",
              animation: "paulnova-loading 1.15s ease-in-out infinite",
            }}
          />
        </div>
        <div style={{ color: "#aab2c5", fontSize: 13 }}>Getting things ready…</div>
      </div>
      <style>{`@keyframes paulnova-loading { 0% { transform: translateX(-110%); } 100% { transform: translateX(360%); } }`}</style>
    </main>
  );
}
