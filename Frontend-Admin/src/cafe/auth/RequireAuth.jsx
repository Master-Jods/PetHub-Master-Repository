import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading, error, sessionStatus, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isLoading) return <div style={{ padding: 24 }}>Loading session...</div>;

  if (!isAuthenticated) {
    if (sessionStatus === "backend_unavailable") {
      return <div style={{ padding: 24, color: "#a11" }}>{error || "Supabase is unavailable. Please try again later."}</div>;
    }

    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      setLoginError("");
      setLoading(true);
      try {
        await login({ email, password });
      } catch (err) {
        setLoginError(err.message || "Invalid credentials");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#FFF7F9" }}>
        <div style={{ background: "white", padding: 32, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", width: "100%", maxWidth: 400 }}>
          <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: "bold", color: "#bf2456", textAlign: "center" }}>Happy Tails Cafe Admin</h2>
          <p style={{ marginBottom: 24, fontSize: 14, color: "#6b7280", textAlign: "center" }}>Please log in with your Cafe credentials to continue.</p>
          {loginError && <div style={{ color: "#dc3545", backgroundColor: "#f8d7da", padding: 10, borderRadius: 6, marginBottom: 16, fontSize: 13 }}>{loginError}</div>}
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6 }} placeholder="cafe-admin@happytails.com" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6 }} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px", backgroundColor: "#bf2456", color: "white", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
