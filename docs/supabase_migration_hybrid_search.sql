-- =============================================================================
-- MIGRATION: Busca híbrida (semântica + textual) com Reciprocal Rank Fusion
-- Execute no Supabase Dashboard > SQL Editor
--
-- Não exige reindexação dos documentos — usa o que já está no banco.
-- =============================================================================


-- 1. Coluna tsvector + trigger (mais eficiente em memória que GENERATED STORED)
-- =============================================================================
-- Não usamos `GENERATED ALWAYS AS (...) STORED` porque o Postgres calcula o valor
-- para todas as linhas existentes em uma única operação que requer
-- maintenance_work_mem alto (>= 65MB no nosso volume), e o plano free do Supabase
-- limita esse parâmetro em 32MB. A solução abaixo evita esse pico de memória.

-- 1a. Adiciona coluna vazia (não dispara backfill, não usa memória)
alter table teses add column if not exists conteudo_tsv tsvector;

-- 1b. Trigger para popular automaticamente em insert/update do conteúdo
create or replace function _update_conteudo_tsv()
returns trigger as $tsv$
begin
    new.conteudo_tsv := to_tsvector('portuguese', coalesce(new.conteudo, ''));
    return new;
end;
$tsv$ language plpgsql;

drop trigger if exists trg_update_conteudo_tsv on teses;
create trigger trg_update_conteudo_tsv
    before insert or update of conteudo on teses
    for each row execute function _update_conteudo_tsv();

-- 1c. Popula as linhas existentes em batches de 500 (usa work_mem, não maintenance)
do $backfill$
declare
    affected int;
begin
    loop
        with batch as (
            select id from teses where conteudo_tsv is null limit 500
        )
        update teses
        set conteudo_tsv = to_tsvector('portuguese', conteudo)
        from batch
        where teses.id = batch.id;

        get diagnostics affected = row_count;
        exit when affected = 0;
    end loop;
end
$backfill$;


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
