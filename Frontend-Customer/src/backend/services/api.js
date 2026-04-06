const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const authApi = {
  register: (payload) =>
    request("/api/auth/register", { method: "POST", body: payload }),

  login: (payload) =>
    request("/api/auth/login", { method: "POST", body: payload }),

  me: (token) =>
    request("/api/auth/me", { token }),
};