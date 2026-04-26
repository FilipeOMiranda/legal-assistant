-- =============================================================================
-- MIGRATION: adiciona suporte a filtro por categoria (subpasta)
-- Execute no Supabase Dashboard > SQL Editor
-- =============================================================================


-- 1. Adicionar coluna categoria na tabela teses
-- =============================================================================
alter table teses add column if not exists categoria text;

create index if not exists teses_categoria_idx on teses(categoria);


-- 2. Substituir a função match_teses para aceitar filtro opcional por categoria
-- =============================================================================
drop function if exists match_teses(vector, int, float);
drop function if exists match_teses(vector, int, float, text);

create or replace function match_teses(
    query_embedding     vector(1536),
    match_count         int     default 8,
    match_threshold     float   default 0.5,
    match_categoria     text    default null
)
returns table (
    id                  uuid,
    arquivo_nome        text,
    arquivo_id          text,
    arquivo_link        text,
    chunk_index         integer,
    conteudo            text,
    pagina              integer,
    categoria           text,
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
        t.categoria,
        1 - (t.embedding <=> query_embedding) as similarity
    from teses t
    where 1 - (t.embedding <=> query_embedding) > match_threshold
      and (match_categoria is null or t.categoria = match_categoria)
    order by t.embedding <=> query_embedding
    limit match_count;
end;
$$;


-- =============================================================================
-- IMPORTANTE: depois desta migration, é preciso reindexar para preencher
-- a coluna 'categoria' nos chunks existentes:
--
--   1. DELETE FROM teses;
--   2. Clicar em "Atualizar base" no frontend
-- =============================================================================
