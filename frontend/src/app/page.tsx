import { SearchPanel } from "./components/SearchPanel";

export default function Home() {
  return (
    <main className="flex-1">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
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
            <h1 className="text-base font-semibold tracking-tight text-slate-900">
              Teses Trabalhistas
            </h1>
            <p className="text-xs text-slate-500">
              Busca inteligente com análise por IA
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            O que você precisa rebater?
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-600">
            Descreva o argumento da parte contrária ou a tese a refutar. A IA
            analisa o acervo e indica os trechos mais relevantes para sua
            argumentação.
          </p>
        </section>

        <SearchPanel />
      </div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 text-xs text-slate-500">
          Sistema interno · Acervo indexado a partir do Drive
        </div>
      </footer>
    </main>
  );
}
