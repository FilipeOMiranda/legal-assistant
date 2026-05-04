import type { TrechoDoc } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

type Props = { doc: TrechoDoc; index: number };

export function DocumentCard({ doc, index }: Props) {
  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 text-[11px] font-bold text-slate-500">
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3
              className="truncate text-sm font-semibold leading-snug text-slate-900"
              title={doc.arquivo_nome}
            >
              {doc.arquivo_nome}
            </h3>
            {doc.pagina != null && (
              <p className="mt-0.5 text-xs text-slate-400">p. {doc.pagina}</p>
            )}
          </div>
        </div>
        <ScoreBadge score={doc.score} />
      </header>

      <blockquote className="mb-4 flex-1 border-l-2 border-slate-200 pl-3 text-[13px] leading-relaxed text-slate-600">
        <p className="line-clamp-6 whitespace-pre-wrap">{doc.trecho}</p>
      </blockquote>

      <a
        href={doc.arquivo_link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition-all hover:text-indigo-800"
      >
        Abrir no Drive
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
      </a>
    </article>
  );
}
