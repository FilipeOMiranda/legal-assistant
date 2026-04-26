export type TrechoDoc = {
  chunk_id: string;
  arquivo_nome: string;
  arquivo_link: string;
  trecho: string;
  score: number;
  pagina?: number | null;
  categoria?: string | null;
};

export type SearchResponse = {
  query: string;
  resumo_ia: string;
  resultados: TrechoDoc[];
  total_encontrado: number;
};

export type SearchRequest = {
  query: string;
  top_k?: number;
  categoria?: string;
};

export type CategoriasResponse = {
  categorias: string[];
};

export type IndexDetalhe = {
  arquivo_nome: string;
  arquivo_id: string;
  status: "indexado" | "atualizado" | "ignorado" | "erro";
  chunks_gerados: number;
  erro?: string | null;
};

export type IndexResponse = {
  total_arquivos: number;
  indexados: number;
  atualizados: number;
  ignorados: number;
  erros: number;
  detalhes: IndexDetalhe[];
  iniciado_em: string;
  concluido_em: string;
};
