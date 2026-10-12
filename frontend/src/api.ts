import type { CreateWorkRequest, NormativeDocument, WorkDetails, WorkSummary } from "./types.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.error === "string" ? body.error : "Запрос не выполнен.";
    throw new Error(message);
  }
  return body as T;
}

export function fetchWorks(): Promise<WorkSummary[]> {
  return request("/api/works");
}

export function fetchWork(id: number): Promise<WorkDetails> {
  return request(`/api/works/${id}`);
}

export function fetchDocuments(): Promise<NormativeDocument[]> {
  return request("/api/normative-documents");
}

export function createWork(payload: CreateWorkRequest): Promise<WorkDetails> {
  return request("/api/works", { method: "POST", body: JSON.stringify(payload) });
}
