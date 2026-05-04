import { IndexButton } from "./components/IndexButton";
import { SearchPanel } from "./components/SearchPanel";

export default function Home() {
  return (
    <main className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="h-[3px] bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
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
                <path d="M12 3 4 7v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4z" />
              </svg>
            </span>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                Teses Trabalhistas
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Busca inteligente com análise por IA
              </p>
            </div>
          </div>
          <IndexButton />
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-500">
            Análise Jurídica por IA
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.2rem] sm:leading-tight">
            O que você precisa rebater?
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500">
            Descreva o argumento da parte contrária ou a tese a refutar. A IA
            analisa o acervo e indica os trechos mais relevantes para sua
            argumentação.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:py-12">
        <SearchPanel />
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-400">
          Sistema interno · Acervo indexado a partir do Google Drive
        </div>
      </footer>
    </main>
  );
}
