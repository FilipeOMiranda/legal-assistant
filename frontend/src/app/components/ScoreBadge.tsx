type Props = { score: number };

export function ScoreBadge({ score }: Props) {
  const pct = Math.round(score * 100);

  let tone = "bg-slate-100 text-slate-500 ring-slate-200";
  let dotColor = "bg-slate-400";

  if (score >= 0.8) {
    tone = "bg-emerald-50 text-emerald-700 ring-emerald-200";
    dotColor = "bg-emerald-500";
  } else if (score >= 0.6) {
    tone = "bg-sky-50 text-sky-700 ring-sky-200";
    dotColor = "bg-sky-500";
  } else if (score >= 0.4) {
    tone = "bg-amber-50 text-amber-700 ring-amber-200";
    dotColor = "bg-amber-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
      title={`Similaridade: ${pct}%`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      {pct}%
    </span>
  );
}
