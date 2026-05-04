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

const LOADING_MESSAGES = [
  "Buscando teses no acervo jurídico...",
  "Analisando os argumentos da parte contrária...",
  "Identificando jurisprudências aplicáveis...",
  "Comparando precedentes e decisões relevantes...",
  "Formulando linha estratégica de defesa...",
  "Preparando análise completa do caso...",
];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SearchResponse | null>(null);

  async function fetchCategorias() {
    setLoadingCategorias(true);
    try {
      const cats = await listarCategorias();
      setCategorias(cats);
    } catch {
      // silently fail — will retry after first successful search
    } finally {
      setLoadingCategorias(false);
    }
  }

  useEffect(() => {
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when backend wakes up after first search, retry categories if still empty
  useEffect(() => {
    if (data && categorias.length === 0) {
      fetchCategorias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:border-indigo-300 focus-within:shadow-md focus-within:ring-4 focus-within:ring-indigo-50">
          {/* categories row — always visible */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
            <label
              htmlFor="categoria"
              className="shrink-0 text-xs font-medium text-slate-400"
            >
              Categoria:
            </label>
            {loadingCategorias ? (
              <div className="h-6 w-44 animate-pulse rounded-md bg-slate-100" />
            ) : categorias.length > 0 ? (
              <>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={loading}
                  className="cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:opacity-50"
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
                    className="ml-0.5 text-xs text-slate-400 transition-colors hover:text-slate-600"
                    title="Limpar filtro"
                  >
                    ✕
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-400">Todas as categorias</span>
            )}
          </div>

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
            className="block w-full resize-y rounded-xl bg-transparent px-4 py-4 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
            disabled={loading}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-400">
              {query.length}/2000 ·{" "}
              <span className="hidden sm:inline">
                Pressione{" "}
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  Ctrl
                </kbd>
                +
                <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  Enter
                </kbd>{" "}
                para buscar
              </span>
            </span>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">Exemplos:</span>
            {EXEMPLOS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuery(ex)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
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
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const intervalId = setInterval(() => {
      setVisible(false);
      timeoutId = setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setVisible(true);
      }, 350);
    }, 2800);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 shadow-md shadow-indigo-200">
            <svg
              className="h-4 w-4 animate-spin text-white"
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
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">
              Análise em andamento
            </p>
            <p
              className="mt-1 text-sm text-indigo-600 transition-opacity duration-300"
              style={{ opacity: visible ? 1 : 0 }}
            >
              {LOADING_MESSAGES[msgIndex]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-1 overflow-hidden rounded-full bg-indigo-100"
            >
              <div
                className="h-full rounded-full bg-indigo-400 animate-pulse"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
          <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-8/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-7/12 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Results({ data }: { data: SearchResponse }) {
  return (
    <div className="animate-fade-up space-y-8">
      <AiAnalysis resumo={data.resumo_ia} />

      <section>
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Documentos encontrados
          </h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {data.total_encontrado}{" "}
            {data.total_encontrado === 1 ? "resultado" : "resultados"}
          </span>
        </header>

        {data.resultados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
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
