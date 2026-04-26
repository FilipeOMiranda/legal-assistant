"use client";

import { useEffect, useState, type FormEvent } from "react";
import { listarCategorias, searchTeses } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { AiAnalysis } from "./AiAnalysis";
import { DocumentCard } from "./DocumentCard";

const EXEMPLOS = [
  "Reversão de justa causa por abandono de emprego",
  "Horas in itinere em local de difícil acesso",
  "Reconhecimento de vínculo empregatício de motorista de aplicativo",
];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await searchTeses({
        query: q,
        categoria: categoria || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
          {categorias.length > 0 && (
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <label
                htmlFor="categoria"
                className="text-xs font-medium text-slate-500"
              >
                Categoria:
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                disabled={loading}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:opacity-50"
              >
                <option value="">Todas as categorias</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {categoria && (
                <button
                  type="button"
                  onClick={() => setCategoria("")}
                  className="text-xs text-slate-400 hover:text-slate-600"
                  title="Limpar filtro"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          <label htmlFor="query" className="sr-only">
            Descreva a tese que precisa rebater
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
              }
            }}
            rows={5}
            maxLength={2000}
            placeholder="Descreva o argumento da parte contrária ou a tese que você precisa rebater. Quanto mais contexto, melhor a análise."
            className="block w-full resize-y rounded-xl bg-transparent px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-2">
            <span className="text-xs text-slate-400">
              {query.length}/2000 ·{" "}
              <span className="hidden sm:inline">
                Pressione <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-600">Ctrl</kbd>+
                <kbd className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-medium text-slate-600">Enter</kbd> para buscar
              </span>
            </span>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                    />
                  </svg>
                  Analisando…
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  Buscar Teses
                </>
              )}
            </button>
          </div>
        </div>

        {!data && !loading && !error && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="text-slate-400">Exemplos:</span>
            {EXEMPLOS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <strong className="font-semibold">Não foi possível buscar:</strong>{" "}
          {error}
        </div>
      )}

      {loading && <LoadingState />}

      {data && !loading && <Results data={data} />}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-8/12 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Results({ data }: { data: SearchResponse }) {
  return (
    <div className="space-y-8">
      <AiAnalysis resumo={data.resumo_ia} />

      <section>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Documentos encontrados
          </h2>
          <span className="text-sm text-slate-500">
            {data.total_encontrado}{" "}
            {data.total_encontrado === 1 ? "resultado" : "resultados"}
          </span>
        </header>

        {data.resultados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Nenhum trecho relevante encontrado para esta consulta.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.resultados.map((doc, i) => (
              <DocumentCard key={doc.chunk_id} doc={doc} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
