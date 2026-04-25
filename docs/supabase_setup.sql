-- =============================================================================
-- SETUP SUPABASE - Sistema de Teses Jurídicas Trabalhistas
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =============================================================================


-- 1. Habilitar a extensão pgvector
-- =============================================================================
create extension if not exists vector;


-- 2. Criar a tabela principal de chunks
-- =============================================================================
create table if not exists teses (
    id                      uuid primary key default gen_random_uuid(),
    arquivo_nome            text not null,
    arquivo_id              text not null,       -- ID único no Google Drive
    arquivo_link            text,                -- URL para abrir no Drive
    arquivo_modified_time   text,                -- ISO 8601, ex: "2024-01-15T10:30:00Z"
    chunk_index             integer not null,    -- posição do chunk no arquivo (0, 1, 2...)
    conteudo                text not null,       -- texto do chunk
    embedding               vector(1536),        -- text-embedding-3-small = 1536 dims
    pagina                  integer,             -- página do PDF (quando aplicável)
    created_at              timestamptz default now()
);


-- 3. Índice vetorial para busca por similaridade (IVFFlat)
-- =============================================================================
-- IVFFlat é mais rápido que o índice exato para coleções grandes.
-- O parâmetro 'lists' deve ser ~sqrt(número de rows esperado).
-- Para 10.000 chunks (500 docs * 20 chunks): lists = 100
-- Para 50.000 chunks: lists = 200
create index if not exists teses_embedding_idx
    on teses using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);


-- 4. Índices auxiliares para queries de manutenção
-- =============================================================================
create index if not exists teses_arquivo_id_idx on teses(arquivo_id);
create index if not exists teses_created_at_idx on teses(created_at desc);


-- 5. Função RPC para busca por similaridade
-- =============================================================================
-- Esta é a função chamada pelo vector_service.py
create or replace function match_teses(
    query_embedding     vector(1536),
    match_count         int     default 8,
    match_threshold     float   default 0.5
)
returns table (
    id                  uuid,
    arquivo_nome        text,
    arquivo_id          text,
    arquivo_link        text,
    chunk_index         integer,
    conteudo            text,
    pagina              integer,
    similarity          float
)
language plpgsql
as $$
begin
    return query
    select
        t.id,
        t.arquivo_nome,
        t.arquivo_id,
        t.arquivo_link,
        t.chunk_index,
        t.conteudo,
        t.pagina,
        1 - (t.embedding <=> query_embedding) as similarity
    from teses t
    where 1 - (t.embedding <=> query_embedding) > match_threshold
    order by t.embedding <=> query_embedding  -- ordem crescente de distância = decrescente de similaridade
    limit match_count;
end;
$$;


-- 6. Função auxiliar para estatísticas da base
-- =============================================================================
create or replace function stats_teses()
returns json
language plpgsql
as $$
declare
    resultado json;
begin
    select json_build_object(
        'total_chunks',     count(*),
        'total_arquivos',   count(distinct arquivo_id),
        'ultimo_update',    max(created_at)
    )
    into resultado
    from teses;

    return resultado;
end;
$$;


-- 7. Row Level Security (RLS) - habilitar e configurar acesso
-- =============================================================================
-- A service_role key bypassa RLS automaticamente.
-- Se quiser expor via anon key (não recomendado para este caso), configure policies.
alter table teses enable row level security;

-- Permitir leitura para usuários autenticados (se usar Supabase Auth no futuro)
-- create policy "Leitura autenticada" on teses
--     for select using (auth.role() = 'authenticated');


-- =============================================================================
-- VERIFICAÇÃO: rode após o setup para confirmar que tudo foi criado
-- =============================================================================
-- select stats_teses();
-- select count(*) from teses;
