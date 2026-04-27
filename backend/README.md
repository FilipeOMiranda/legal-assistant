# Teses Jurídicas Trabalhistas — Sistema de Busca Inteligente

Sistema completo de busca semântica de teses jurídicas trabalhistas com análise por IA. O advogado descreve o argumento que precisa rebater e o sistema localiza automaticamente os trechos mais relevantes do acervo, gerando uma análise estratégica.

---

## Como funciona

```
Advogado digita o argumento
        ↓
Frontend (Next.js) envia para o Backend (FastAPI)
        ↓
Backend gera embedding vetorial da consulta (OpenAI)
        ↓
Busca semântica no Supabase (pgvector) — similaridade coseno
        ↓
Trechos mais relevantes são analisados pela IA (OpenAI GPT-4o)
        ↓
Retorna: análise estratégica + documentos com link para o Drive
```

---

## Arquitetura

```
legal-assistant/
├── backend/                         # FastAPI — Python 3.12
│   ├── app/
│   │   ├── api/
│   │   │   ├── health.py            # GET /health
│   │   │   ├── search.py            # POST /api/search
│   │   │   └── index.py             # POST /api/index
│   │   ├── core/
│   │   │   ├── config.py            # Variáveis de ambiente (pydantic-settings)
│   │   │   └── supabase.py          # Cliente Supabase singleton
│   │   ├── models/
│   │   │   └── schemas.py           # Modelos Pydantic (request/response)
│   │   ├── services/
│   │   │   ├── drive_service.py     # Listagem recursiva e extração de texto do Drive
│   │   │   ├── chunking_service.py  # Divisão inteligente de texto jurídico
│   │   │   ├── embedding_service.py # Geração de embeddings via OpenAI
│   │   │   ├── vector_service.py    # Busca vetorial no Supabase
│   │   │   └── openai_service.py    # Análise e resumo via GPT-4o
│   │   └── main.py                  # Entrypoint FastAPI + CORS
│   ├── credentials/                 # NÃO commitar — gitignored
│   │   └── google-service-account.json
│   ├── .env                         # NÃO commitar — gitignored
│   ├── .env.example                 # Template seguro (sem credenciais reais)
│   ├── .python-version              # Fixa Python 3.12 no Render
│   ├── render.yaml                  # Configuração de deploy no Render.com
│   └── requirements.txt
│
└── frontend/                        # Next.js 16 + Tailwind CSS 4
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   │   ├── SearchPanel.tsx   # Formulário de busca (Client Component)
    │   │   │   ├── AiAnalysis.tsx    # Card com análise da IA
    │   │   │   ├── DocumentCard.tsx  # Card por documento encontrado
    │   │   │   └── ScoreBadge.tsx    # Badge de similaridade colorido
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   └── globals.css
    │   └── lib/
    │       ├── api.ts                # Cliente HTTP para o backend
    │       └── types.ts              # Tipos TypeScript espelhando os schemas
    ├── .env.local                    # NÃO commitar — gitignored
    ├── netlify.toml                  # Configuração de deploy no Netlify
    └── package.json
```

---

## O que o sistema faz

### Indexação (`POST /api/index`)
- Conecta ao Google Drive via Service Account
- Lista recursivamente **todos os arquivos em todas as subpastas** da pasta configurada
- Suporta: `.pdf`, `.docx`, Google Docs e `.txt`
- Extrai o texto de cada arquivo
- Divide o texto em chunks com sobreposição inteligente (evita cortar argumentos jurídicos no meio)
- Gera embeddings vetoriais para cada chunk via OpenAI `text-embedding-3-small`
- Salva no Supabase com controle de versão — arquivos não modificados são ignorados no reindexamento
- Retorna relatório detalhado: indexados, atualizados, ignorados e erros

### Busca (`POST /api/search`)
- Gera embedding da consulta do advogado
- Busca por similaridade coseno no Supabase (pgvector) retornando os chunks mais relevantes
- Envia os trechos encontrados para o GPT-4o gerar uma análise estratégica consolidada
- Retorna: análise da IA + lista de documentos com score de similaridade e link direto para o Drive

### Frontend
- Interface limpa e profissional voltada para advogados
- Chips de exemplo para consultas rápidas
- Atalho `Ctrl+Enter` para buscar
- Estado de loading com skeleton animado
- Badge de similaridade colorido por faixa (verde ≥80%, azul ≥60%, âmbar ≥40%)
- Link direto para abrir o documento no Google Drive

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Status da API e conexão com Supabase |
| `POST` | `/api/index` | Indexa/reindexia arquivos do Google Drive |
| `POST` | `/api/search` | Busca teses e retorna análise da IA |

### POST /api/search
```json
// Request
{ "query": "empregado alega assédio moral como motivo para rescisão indireta", "top_k": 8 }

// Response
{
  "query": "...",
  "resumo_ia": "Com base nas teses encontradas, os principais argumentos são...",
  "resultados": [
    {
      "chunk_id": "uuid",
      "arquivo_nome": "Tese_Rescisao_Indireta.docx",
      "arquivo_link": "https://drive.google.com/...",
      "trecho": "A rescisão indireta prevista no art. 483 da CLT...",
      "score": 0.87,
      "pagina": 3
    }
  ],
  "total_encontrado": 5
}
```

### POST /api/index
```json
// Request
{ "force_reindex": false }

// Response
{
  "total_arquivos": 42,
  "indexados": 10,
  "atualizados": 2,
  "ignorados": 30,
  "erros": 0,
  "detalhes": [...]
}
```

---

## Infraestrutura de produção

| Componente | Serviço | URL |
|---|---|---|
| Backend (FastAPI) | Render.com | `https://legal-assistant-wge8.onrender.com` |
| Frontend (Next.js) | Netlify | (configurar após deploy) |
| Banco vetorial | Supabase (pgvector) | — |
| Embeddings | OpenAI `text-embedding-3-small` | — |
| Análise IA | OpenAI GPT-4o | — |
| Documentos | Google Drive | — |

---

## Setup local

### Pré-requisitos
- Python 3.12
- Node.js 18+
- Conta Supabase com `pgvector` ativado
- Service Account do Google Cloud com acesso ao Drive
- API key da OpenAI

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # preencher com suas credenciais
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
# criar .env.local com:
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

### Primeira indexação

```bash
curl -X POST http://localhost:8000/api/index \
  -H "Content-Type: application/json" \
  -d '{"force_reindex": false}'
```

---

## Variáveis de ambiente

### Backend (`.env`)

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_KEY` | Chave service_role do Supabase |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `OPENAI_CHAT_MODEL` | Modelo de chat (padrão: `gpt-4o`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Caminho do JSON (local) ou conteúdo JSON (produção) |
| `GOOGLE_DRIVE_FOLDER_ID` | ID da pasta raiz no Drive |
| `ALLOWED_ORIGINS` | Lista de origens permitidas no CORS |

### Frontend (`.env.local`)

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base do backend |

---

## Organização do Drive

O sistema suporta qualquer estrutura de subpastas — a indexação é recursiva:

```
Pasta Principal (ID no .env)
├── Agravo de Petição/
│   ├── tese1.pdf
│   └── tese2.docx
├── Agravo de Instrumento/
│   └── tese3.pdf
└── Recurso Ordinário/
    └── tese4.docx
```

Basta compartilhar a **pasta principal** com o e-mail da Service Account — as subpastas herdam o acesso automaticamente.

---

## TODO

- [x] **Filtro por categoria (subpasta):** permite filtrar a busca por subpasta do Drive (ex: "Agravo de Petição"). A migração SQL está em `docs/supabase_migration_categoria.sql` — rodar no Supabase antes de reindexar.

- [x] **Indexação assíncrona com BackgroundTasks:** o `POST /api/index` agora dispara a indexação em background via `asyncio.create_task` e retorna em < 1s com `{"status": "iniciada"}`. O endpoint `GET /api/index/status` retorna o estado atual (total, processados, indexados, atualizados, ignorados, erros, último arquivo, status). O frontend faz polling a cada 3s e mostra barra de progresso real.
