type Props = { resumo: string };

export function AiAnalysis({ resumo }: Props) {
  const paragraphs = resumo
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-white p-6 shadow-sm sm:p-8">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
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
            <path d="M12 2v4" />
            <path d="m6.4 6.4 2.8 2.8" />
            <path d="M2 12h4" />
            <path d="m6.4 17.6 2.8-2.8" />
            <path d="M12 18v4" />
            <path d="m17.6 17.6-2.8-2.8" />
            <path d="M18 12h4" />
            <path d="m17.6 6.4-2.8 2.8" />
          </svg>
        </span>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Análise da IA
          </h2>
          <p className="text-xs text-slate-500">
            Síntese sobre as teses encontradas para o caso
          </p>
        </div>
      </header>

      <div className="space-y-4 text-[15px] leading-relaxed text-slate-700">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {p}
            </p>
          ))
        ) : (
          <p className="whitespace-pre-wrap">{resumo}</p>
        )}
      </div>
    </section>
  );
}
