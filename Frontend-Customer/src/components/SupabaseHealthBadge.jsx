import React, { useCallback, useEffect, useMemo, useState } from "react";
import { checkSupabaseProfileHealth } from "../backend/services/supabaseHealth";

const badgeStyle = {
  position: "fixed",
  right: 12,
  bottom: 12,
  zIndex: 2000,
  width: 320,
  maxWidth: "calc(100vw - 24px)",
  background: "#ffffff",
  border: "1px solid #d9d9d9",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  padding: "10px 12px",
  fontSize: 12,
  lineHeight: 1.4,
  color: "#1d1d1f",
};

const titleStyle = {
  fontWeight: 700,
  marginBottom: 6,
};

const mutedStyle = {
  color: "#5f6368",
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
};

const buttonStyle = {
  marginTop: 8,
  border: "1px solid #d0d0d0",
  background: "#fafafa",
  borderRadius: 6,
  fontSize: 11,
  padding: "4px 8px",
  cursor: "pointer",
};

const okColor = "#0b8f49";
const badColor = "#c62828";

const SupabaseHealthBadge = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await checkSupabaseProfileHealth();
      setHealth(result);
    } catch (err) {
      setError(err?.message || "Unable to check Supabase health.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    void runCheck();
  }, [runCheck]);

  const statusText = useMemo(() => {
    if (loading) return "Checking...";
    if (error) return "Check failed";
    if (!health?.configured) return "Not configured";
    return health?.ok ? "Healthy" : "Schema issue";
  }, [loading, error, health]);

  const statusColor = useMemo(() => {
    if (loading) return mutedStyle.color;
    if (error) return badColor;
    if (!health?.configured) return badColor;
    return health?.ok ? okColor : badColor;
  }, [loading, error, health]);

  if (!import.meta.env.DEV) return null;

  return (
    <aside style={badgeStyle}>
      <div style={titleStyle}>Supabase Dev Health</div>
      <div style={rowStyle}>
        <span style={mutedStyle}>Status</span>
        <strong style={{ color: statusColor }}>{statusText}</strong>
      </div>

      <div style={{ ...mutedStyle, marginTop: 6 }}>
        Host: <code>{health?.host || "(checking...)"}</code>
      </div>

      {error ? (
        <div style={{ color: badColor, marginTop: 6 }}>{error}</div>
      ) : (
        health?.checks?.length > 0 && (
          <div style={{ marginTop: 6 }}>
            {health.checks.map((check) => (
              <div key={check.table} style={rowStyle}>
                <span style={mutedStyle}>{check.table}</span>
                <span style={{ color: check.ok ? okColor : badColor }}>
                  {check.ok ? "OK" : "Missing/Inaccessible"}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      <button type="button" style={buttonStyle} onClick={() => void runCheck()} disabled={loading}>
        Recheck
      </button>
    </aside>
  );
};

export default SupabaseHealthBadge;
