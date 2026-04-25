# 🏛️ Teses Jurídicas Trabalhistas — Backend

Sistema de busca inteligente de teses jurídicas com Google Drive + pgvector + Claude.

---

## 📁 Estrutura do Projeto

```
backend/
├── app/
│   ├── api/
│   │   ├── health.py        # GET /health
│   │   ├── search.py        # POST /api/search
│   │   └── index.py         # POST /api/index
│   ├── core/
│   │   ├── config.py        # Variáveis de ambiente (pydantic-settings)
│   │   └── supabase.py      # Cliente Supabase singleton
│   ├── models/
│   │   └── schemas.py       # Modelos Pydantic (request/response)
│   ├── services/
│   │   ├── drive_service.py     # Listagem e extração de texto do Drive
│   │   ├── chunking_service.py  # Divisão inteligente de texto jurídico
│   │   ├── embedding_service.py # Geração de embeddings via OpenAI
│   │   ├── vector_service.py    # Busca vetorial no Supabase
│   │   └── claude_service.py    # Análise e resumo via Claude
│   └── main.py              # Entrypoint FastAPI
├── credentials/             # NÃO commitar — adicionar ao .gitignore
│   └── google-service-account.json
├── .env.example
├── .env                     # NÃO commitar
└── requirements.txt
```

---

## 🚀 Setup Passo a Passo

### 1. Supabase

1. Criar conta em https://supabase.com e criar um novo projeto
2. Ir em **SQL Editor** e executar todo o conteúdo de `../docs/supabase_setup.sql`
3. Ir em **Project Settings > API** e copiar:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret key → `SUPABASE_SERVICE_KEY` ⚠️ nunca expor no frontend

### 2. Google Drive API

1. Acessar https://console.cloud.google.com
2. Criar um projeto (ou usar um existente)
3. Ativar a **Google Drive API**
4. Ir em **IAM & Admin > Service Accounts** e criar uma Service Account
5. Baixar a chave JSON e salvar em `credentials/google-service-account.json`
6. No Google Drive, **compartilhar a pasta de teses** com o e-mail da Service Account (permissão de Leitor)
7. Copiar o ID da pasta da URL do Drive → `GOOGLE_DRIVE_FOLDER_ID`

### 3. OpenAI

1. Acessar https://platform.openai.com/api-keys
2. Criar uma API key → `OPENAI_API_KEY`
3. Custo estimado para indexar 500 docs: ~$0.50 com `text-embedding-3-small`

### 4. Anthropic

1. Acessar https://console.anthropic.com/settings/keys
2. Criar uma API key → `ANTHROPIC_API_KEY`

### 5. Configurar o .env

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 6. Instalar dependências e rodar

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Instalar dependências
pip install -r requirements.txt

# Rodar o servidor
uvicorn app.main:app --reload --port 8000
```

### 7. Testar

```bash
# Health check
curl http://localhost:8000/health

# Indexar os arquivos do Drive (primeira vez)
curl -X POST http://localhost:8000/api/index \
  -H "Content-Type: application/json" \
  -d '{"force_reindex": false}'

# Buscar teses
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "rescisão indireta por falta de pagamento de salário"}'
```

---

## 📖 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Status da API e conexão com Supabase |
| `POST` | `/api/index` | Indexa/re-indexa arquivos do Google Drive |
| `POST` | `/api/search` | Busca teses relevantes para uma situação |

### POST /api/search — Request
```json
{
  "query": "empregado alega assédio moral como motivo para rescisão indireta",
  "top_k": 8
}
```

### POST /api/search — Response
```json
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

---

## ⚠️ .gitignore recomendado

```
.env
credentials/
venv/
__pycache__/
*.pyc
.DS_Store
```
