type Props = { resumo: string };

export function AiAnalysis({ resumo }: Props) {
  const paragraphs = resumo
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <header className="relative mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-400/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-indigo-300"
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
          <h2 className="text-base font-semibold text-white">Análise da IA</h2>
          <p className="text-xs text-indigo-300/70">
            Síntese sobre as teses encontradas para o caso
          </p>
        </div>
      </header>

      <div className="relative space-y-4 text-[15px] leading-relaxed text-slate-300">
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
