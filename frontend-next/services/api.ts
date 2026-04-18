import type { LeadRequest, LeadResponse, LeadSummary } from "@/types/lead";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 120_000,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail ?? JSON.stringify(body);
      } catch {
        // ignore parse failure
      }
      throw new ApiError(`API ${res.status}: ${detail}`, res.status);
    }

    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiError("Request timed out", 0);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      `Could not reach API at ${API_URL}. Is it running?`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => request<{ status: string }>("/health", {}, 5_000),
  qualifyLead: (lead: LeadRequest) =>
    request<LeadResponse>("/qualify-lead", {
      method: "POST",
      body: JSON.stringify(lead),
    }),
  listLeads: () => request<LeadSummary[]>("/leads", {}, 15_000),
  getLead: (id: number) =>
    request<LeadResponse>(`/lead/${id}`, {}, 15_000),
};

export { ApiError, API_URL };
