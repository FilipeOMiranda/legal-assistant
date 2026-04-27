-- =============================================================================
-- MIGRATION: Busca híbrida (semântica + textual) com Reciprocal Rank Fusion
-- Execute no Supabase Dashboard > SQL Editor
--
-- Não exige reindexação dos documentos — usa o que já está no banco.
-- =============================================================================


-- 1. Coluna gerada com tsvector do conteúdo (para busca textual em português)
-- =============================================================================
alter table teses
    add column if not exists conteudo_tsv tsvector
    generated always as (to_tsvector('portuguese', conteudo)) stored;

-- Nota sobre o índice GIN:
-- Idealmente teríamos `create index ... using gin(conteudo_tsv)`, mas o plano free
-- do Supabase limita maintenance_work_mem em 32MB e isso é insuficiente para criar
-- o índice GIN com nosso volume de chunks. Sem índice, a busca textual usa varredura
-- sequencial, que ainda é rápida o bastante (milissegundos para ~5k chunks).
--
-- Quando o projeto migrar para um plano pago do Supabase, criar o índice com:
--   create index teses_conteudo_tsv_idx on teses using gin(conteudo_tsv);


-- 2. Substituir match_teses por versão híbrida
-- =============================================================================
drop function if exists match_teses(vector, int, float);
drop function if exists match_teses(vector, int, float, text);
drop function if exists match_teses(vector, text, int, float, text);

create or replace function match_teses(
    query_embedding     vector(1536),
    query_text          text    default '',
    match_count         int     default 12,
    match_threshold     float   default 0.3,
    match_categoria     text    default null
)
returns table (
    id              uuid,
    arquivo_nome    text,
    arquivo_id      text,
    arquivo_link    text,
    chunk_index     integer,
    conteudo        text,
    pagina          integer,
    categoria       text,
    similarity      float
)
language plpgsql
as $$
declare
    rrf_k       constant int := 60;     -- constante padrão de Reciprocal Rank Fusion
    pool_size   constant int := 50;     -- candidatos por canal antes da fusão
begin
    return query
    with
    -- Canal 1: busca semântica (vetorial via pgvector)
    semantic as (
        select
            t.id,
            row_number() over (order by t.embedding <=> query_embedding) as rk
        from teses t
        where
            1 - (t.embedding <=> query_embedding) > match_threshold
            and (match_categoria is null or t.categoria = match_categoria)
        order by t.embedding <=> query_embedding
        limit pool_size
    ),
    -- Canal 2: busca textual (full-text search com stemming em português)
    textual as (
        select
            t.id,
            row_number() over (
                order by ts_rank_cd(
                    t.conteudo_tsv,
                    websearch_to_tsquery('portuguese', query_text)
                ) desc
            ) as rk
        from teses t
        where
            query_text <> ''
            and t.conteudo_tsv @@ websearch_to_tsquery('portuguese', query_text)
            and (match_categoria is null or t.categoria = match_categoria)
        order by ts_rank_cd(t.conteudo_tsv, websearch_to_tsquery('portuguese', query_text)) desc
        limit pool_size
    ),
    -- Fusão dos dois rankings via Reciprocal Rank Fusion
    -- Boost de 1.5x para o match textual (privilegia o termo literal)
    fused as (
        select
            coalesce(s.id, x.id) as id,
            (
                coalesce(1.0 / (rrf_k + s.rk), 0)
                + coalesce(1.0 / (rrf_k + x.rk), 0) * 1.5
            ) as rrf_score
        from semantic s
        full outer join textual x on s.id = x.id
    )
    select
        t.id,
        t.arquivo_nome,
        t.arquivo_id,
        t.arquivo_link,
        t.chunk_index,
        t.conteudo,
        t.pagina,
        t.categoria,
        (1 - (t.embedding <=> query_embedding))::float as similarity
    from fused f
    join teses t on t.id = f.id
    order by f.rrf_score desc
    limit match_count;
end;
$$;


-- =============================================================================
-- VERIFICAÇÃO: rode após a migration para confirmar que tudo foi criado
-- =============================================================================
-- select count(*) filter (where conteudo_tsv is not null) as com_tsvector,
--        count(*) as total
-- from teses;
