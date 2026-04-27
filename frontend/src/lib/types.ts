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

export type IndexStartResponse = {
  status: "iniciada";
  iniciado_em: string;
};

export type IndexState = {
  status: "idle" | "running" | "completed" | "error";
  iniciado_em: string | null;
  concluido_em: string | null;
  total_arquivos: number;
  processados: number;
  indexados: number;
  atualizados: number;
  ignorados: number;
  erros: number;
  ultimo_arquivo: string | null;
  erro_geral: string | null;
  detalhes: IndexDetalhe[];
};
