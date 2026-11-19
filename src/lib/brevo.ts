const BREVO_API_BASE = "https://api.brevo.com/v3";

export async function brevoRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Brevo is not configured yet. Add BREVO_API_KEY to the server environment.");
  const response = await fetch(`${BREVO_API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
      ...(init.headers ?? {}),
    },
  });
  const raw = await response.text();
  let payload: unknown = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch { payload = raw; }
  if (!response.ok) {
    const detail = typeof payload === "object" && payload !== null && "message" in payload
      ? String((payload as { message: unknown }).message)
      : `Brevo returned HTTP ${response.status}.`;
    throw new Error(detail.slice(0, 500));
  }
  return payload as T;
}
