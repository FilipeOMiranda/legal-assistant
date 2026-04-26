"use client";

import { useState } from "react";
import { indexarBase } from "@/lib/api";
import type { IndexResponse } from "@/lib/types";

type Status = "idle" | "running" | "done" | "error";

export function IndexButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<IndexResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (status === "running") return;

    const confirmed = window.confirm(
      "Atualizar a base de teses?\n\n" +
        "O sistema vai buscar arquivos novos ou alterados no Drive e indexá-los.\n" +
        "Pode demorar alguns minutos. Você pode continuar usando a busca normalmente."
    );
    if (!confirmed) return;

    setStatus("running");
    setResult(null);
    setError(null);

    try {
      const data = await indexarBase(false);
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "running"}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "running" ? (
          <>
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
            Indexando…
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
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Atualizar base
          </>
        )}
      </button>

      {status === "done" && result && (
        <ResultSummary result={result} />
      )}

      {status === "error" && error && (
        <span className="text-[10.5px] text-red-600" title={error}>
          Falhou: {error.length > 50 ? error.slice(0, 50) + "…" : error}
        </span>
      )}
    </div>
  );
}

function ResultSummary({ result }: { result: IndexResponse }) {
  const [showErrors, setShowErrors] = useState(false);
  const errosDetalhes = result.detalhes.filter((d) => d.status === "erro");

  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10.5px] text-emerald-700">
        {result.indexados} indexados · {result.atualizados} atualizados ·{" "}
        {result.ignorados} ignorados
        {result.erros > 0 && (
          <>
            {" · "}
            <button
              type="button"
              onClick={() => setShowErrors((v) => !v)}
              className="text-red-600 underline hover:text-red-700"
            >
              {result.erros} erros
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
              onClick={() => setShowErrors(false)}
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
                {d.erro && (
                  <div className="mt-0.5 text-red-600">{d.erro}</div>
                )}
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
