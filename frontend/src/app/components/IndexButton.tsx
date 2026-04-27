"use client";

import { useEffect, useRef, useState } from "react";
import { getIndexStatus, indexarBase } from "@/lib/api";
import type { IndexState } from "@/lib/types";

const POLL_INTERVAL_MS = 3000;

export function IndexButton() {
  const [state, setState] = useState<IndexState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ao montar, checa se já tem indexação rodando no servidor
  useEffect(() => {
    refresh();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(refresh, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function refresh() {
    try {
      const s = await getIndexStatus();
      setState(s);
      if (s.status === "running") {
        startPolling();
      } else {
        stopPolling();
      }
    } catch {
      // ignora erros de polling (servidor pode estar hibernando)
    }
  }

  async function handleClick() {
    if (state?.status === "running") return;

    const confirmed = window.confirm(
      "Atualizar a base de teses?\n\n" +
        "O sistema vai buscar arquivos novos ou alterados no Drive e indexá-los.\n" +
        "Pode demorar alguns minutos. Você pode fechar esta página — o processo continua no servidor."
    );
    if (!confirmed) return;

    setError(null);
    try {
      await indexarBase(false);
      // Inicia polling logo após disparar
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  const isRunning = state?.status === "running";
  const isCompleted = state?.status === "completed";
  const hasErrors = (state?.erros ?? 0) > 0;
  const errosDetalhes = state?.detalhes?.filter((d) => d.status === "erro") ?? [];

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isRunning}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRunning ? (
          <>
            <Spinner />
            Indexando…
          </>
        ) : (
          <>
            <RefreshIcon />
            Atualizar base
          </>
        )}
      </button>

      {isRunning && state && (
        <RunningProgress state={state} />
      )}

      {isCompleted && state && (
        <CompletedSummary
          state={state}
          showErrors={showErrors}
          onToggleErrors={() => setShowErrors((v) => !v)}
          errosDetalhes={errosDetalhes}
          hasErrors={hasErrors}
        />
      )}

      {error && (
        <span className="text-[10.5px] text-red-600" title={error}>
          Falhou: {error.length > 50 ? error.slice(0, 50) + "…" : error}
        </span>
      )}
    </div>
  );
}

function RunningProgress({ state }: { state: IndexState }) {
  const total = state.total_arquivos || 0;
  const proc = state.processados || 0;
  const pct = total > 0 ? Math.round((proc / total) * 100) : 0;

  return (
    <div className="flex flex-col items-end gap-1 text-[10.5px] text-slate-600">
      {total > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {proc} de {total} ({pct}%)
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700">{state.indexados} ✓</span>
            {state.ignorados > 0 && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{state.ignorados} ignorados</span>
              </>
            )}
            {state.erros > 0 && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-red-600">{state.erros} erros</span>
              </>
            )}
          </div>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          {state.ultimo_arquivo && (
            <span
              className="max-w-[20rem] truncate text-slate-400"
              title={state.ultimo_arquivo}
            >
              {state.ultimo_arquivo}
            </span>
          )}
        </>
      ) : (
        <span>Listando arquivos do Drive…</span>
      )}
    </div>
  );
}

function CompletedSummary({
  state,
  showErrors,
  onToggleErrors,
  errosDetalhes,
  hasErrors,
}: {
  state: IndexState;
  showErrors: boolean;
  onToggleErrors: () => void;
  errosDetalhes: IndexState["detalhes"];
  hasErrors: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10.5px] text-emerald-700">
        {state.indexados} indexados · {state.atualizados} atualizados ·{" "}
        {state.ignorados} ignorados
        {hasErrors && (
          <>
            {" · "}
            <button
              type="button"
              onClick={onToggleErrors}
              className="text-red-600 underline hover:text-red-700"
            >
              {state.erros} erros
            </button>
          </>
        )}
      </span>

      {showErrors && errosDetalhes.length > 0 && (
        <div className="z-10 mt-1 max-h-80 w-[28rem] max-w-[90vw] overflow-y-auto rounded-lg border border-red-200 bg-white p-3 shadow-lg">
          <header className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-red-700">
              Arquivos com erro ({errosDetalhes.length})
            </span>
            <button
              type="button"
              onClick={onToggleErrors}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </header>
          <ul className="space-y-1.5 text-[11px]">
            {errosDetalhes.map((d) => (
              <li
                key={d.arquivo_id}
                className="border-b border-slate-100 pb-1.5 last:border-0"
              >
                <div
                  className="truncate font-medium text-slate-800"
                  title={d.arquivo_nome}
                >
                  {d.arquivo_nome}
                </div>
                {d.erro && <div className="mt-0.5 text-red-600">{d.erro}</div>}
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
            Para corrigir: abra cada arquivo no Word/Google Docs, salve novamente como
            .docx, e suba no Drive substituindo. Depois clique em &quot;Atualizar
            base&quot; novamente.
          </p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
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
  );
}

function RefreshIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
