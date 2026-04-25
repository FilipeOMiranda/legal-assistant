export type TrechoDoc = {
  chunk_id: string;
  arquivo_nome: string;
  arquivo_link: string;
  trecho: string;
  score: number;
  pagina?: number | null;
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
};
