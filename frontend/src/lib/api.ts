import type {
  IndexStartResponse,
  IndexState,
  SearchRequest,
  SearchResponse,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://localhost:8000";

export async function searchTeses(payload: SearchRequest): Promise<SearchResponse> {
  const res = await fetch(`${API_URL}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = String(data.detail);
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function listarCategorias(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/categorias`);
  if (!res.ok) {
    throw new Error(`Erro ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data?.categorias) ? data.categorias : [];
}

export async function indexarBase(forceReindex = false): Promise<IndexStartResponse> {
  const res = await fetch(`${API_URL}/api/index`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ force_reindex: forceReindex }),
  });

  if (!res.ok) {
    let detail = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = String(data.detail);
    } catch {}
    throw new Error(detail);
  }

  return res.json();
}

export async function getIndexStatus(): Promise<IndexState> {
  const res = await fetch(`${API_URL}/api/index/status`);
  if (!res.ok) {
    throw new Error(`Erro ${res.status}`);
  }
  return res.json();
}
