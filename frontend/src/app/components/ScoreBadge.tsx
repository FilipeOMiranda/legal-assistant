type Props = { score: number };

export function ScoreBadge({ score }: Props) {
  const pct = Math.round(score * 100);

  let tone = "bg-slate-100 text-slate-600 ring-slate-200";
  if (score >= 0.8) tone = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  else if (score >= 0.6) tone = "bg-sky-50 text-sky-700 ring-sky-200";
  else if (score >= 0.4) tone = "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
      title={`Similaridade: ${pct}%`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {pct}% de similaridade
    </span>
  );
}
