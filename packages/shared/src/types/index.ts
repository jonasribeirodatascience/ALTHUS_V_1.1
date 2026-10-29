/**
 * ALTHUS by DATALIS — Tipos e Contratos Compartilhados (MVP v1.1)
 */

export type UserRole = 'DONO' | 'OPERADOR';

export interface UsuarioDTO {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  createdAt: string;
}

export interface EmpresaDTO {
  id: string;
  nomeFantasia: string;
  razaoSocial?: string;
  documentoMasked: string; // Ex: ***.456.789-** ou **.***.123/0001-**
  estado: string;
  tipoNegocio: string;
  regimeTributario?: string;
  saldoInicialCaixa: number;
  diasFuncionamentoMes: number;
  limiteDescontoOperador: number; // Ex: 10% = 10
  retiradaMensalDono?: number;
  createdAt: string;
}

export type UnidadeMedida = 'un' | 'kg';

export interface ProdutoVariacaoDTO {
  id: string;
  produtoId: string;
  empresaId: string;
  tamanho: string;
  cor: string;
  codigoBarras?: string;
  custoUnitarioProprio?: number;
  precoVendaProprio?: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
  // Valores efetivos (herdados do produto se não preenchidos)
  custoEfetivo?: number;
  precoEfetivo?: number;
}

export interface ProdutoDTO {
  id: string;
  empresaId: string;
  nome: string;
  categoria: string;
  codigoBarras?: string;
  unidade: UnidadeMedida;
  custoUnitario: number;
  precoVenda: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
  possuiVariacoes: boolean;
  variacoes?: ProdutoVariacaoDTO[];
  createdAt: string;
  updatedAt: string;
}

export type TipoDespesa = 'FIXA' | 'VARIAVEL';
export type StatusDespesa = 'PENDENTE' | 'PAGA';

export type CategoriaDespesa =
  | 'MERCADORIA'
  | 'PESSOAL'
  | 'ALUGUEL'
  | 'ENERGIA_AGUA'
  | 'TAXAS_CARTAO'
  | 'EMBALAGEM'
  | 'FRETE'
  | 'MANUTENCAO'
  | 'IMPOSTOS_TAXAS'
  | 'RETIRADA_DONO'
  | 'OUTRAS';

export interface DespesaDTO {
  id: string;
  empresaId: string;
  descricao: string;
  tipo: TipoDespesa;
  categoria: CategoriaDespesa;
  valor: number;
  dataCompetencia: string;
  dataVencimento: string;
  status: StatusDespesa;
  dataPagamento?: string;
  formaPagamento?: string;
  recorrenteId?: string;
  createdAt: string;
}

export interface DespesaRecorrenteDTO {
  id: string;
  empresaId: string;
  descricao: string;
  tipo: TipoDespesa;
  categoria: CategoriaDespesa;
  valor: number;
  diaVencimento: number;
  ativo: boolean;
}

export type FormaPagamento = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'A_PRAZO';
export type OrigemVenda = 'IMPORTACAO' | 'PDV_NATIVO';
export type StatusVenda = 'CONFIRMADA' | 'CANCELADA' | 'DEVOLVIDA';

export interface ItemVendaDTO {
  id: string;
  vendaId: string;
  produtoId: string;
  variacaoId?: string;
  produtoNome: string;
  tamanho?: string;
  cor?: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitarioMomento: number;
  valorDesconto: number;
  valorTotal: number;
}

export interface VendaDTO {
  id: string;
  empresaId: string;
  usuarioId: string;
  clienteId?: string;
  origem: OrigemVenda;
  status: StatusVenda;
  valorBruto: number;
  valorDesconto: number;
  valorLiquido: number;
  formaPagamento: FormaPagamento;
  dataHoraVenda: string;
  motivoCancelamento?: string;
  itens?: ItemVendaDTO[];
}

export interface ClienteDTO {
  id: string;
  empresaId: string;
  nome: string;
  documentoMasked?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  limiteCredito?: number;
  saldoDevedor?: number;
  consentimentoLgpd: {
    aceito: boolean;
    dataHora: string;
    finalidade: string;
    registradoPor: string;
  };
  anonimizado: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// Indicadores Financeiros (F-07 / Seção 7)
// -------------------------------------------------------------

export interface IndicadorValor<T = number> {
  valor: T;
  disponivel: boolean;
  motivoIndisponibilidade?: string;
  limiteDeclarado?: string;
}

export interface RelatorioIndicadoresDTO {
  periodo: {
    inicio: string;
    fim: string;
  };
  // Vendas
  faturamento: IndicadorValor<number>;
  numeroVendas: IndicadorValor<number>;
  ticketMedio: IndicadorValor<number>;
  vendasPorDiaSemana: Record<string, number>;
  vendasPorHorario: Record<number, number>;
  descontosConcedidos: IndicadorValor<{ valor: number; percentual: number }>;

  // Resultado & Margens
  cmv: IndicadorValor<number>;
  lucroBruto: IndicadorValor<number>;
  margemBrutaPercentual: IndicadorValor<number>;
  despesasFixas: IndicadorValor<number>;
  despesasVariaveis: IndicadorValor<number>;
  resultadoGerencial: IndicadorValor<number>;
  resultadoAposRetirada: IndicadorValor<number>;

  // Análise Custo-Volume-Lucro
  margemContribuicaoPercentual: IndicadorValor<number>;
  pontoEquilibrioMensal: IndicadorValor<number>;
  pontoEquilibrioDiario: IndicadorValor<number>;
  percentualPontoEquilibrioAtingido: IndicadorValor<number>;

  // Fluxo de Caixa & Vencimentos
  fluxoCaixaEntradas: number;
  fluxoCaixaSaidas: number;
  saldoCaixaAtual: number;
  vencimentosProximos7Dias: IndicadorValor<number>;

  // Estoque
  valorEstoqueCusto: IndicadorValor<number>;
  giroEstoque: IndicadorValor<number>;
  coberturaEstoqueDias: IndicadorValor<number>;
  estoqueParado: IndicadorValor<{ valorTotalCusto: number; quantidadeProdutos: number }>;
}

// -------------------------------------------------------------
// Calculadora de Precificação (F-29 / Seção 5.12)
// -------------------------------------------------------------

export type TipoArredondamento = 'NENHUM' | 'PROXIMO_005' | 'TERMINADO_90';

export interface ParametrosPrecificacao {
  custoUnitario: number;
  despesasVariaveisPercentual: number; // DV%
  despesasFixasPercentual: number;    // DF%
  margemLucroDesejadaPercentual: number; // ML%
  arredondamento?: TipoArredondamento;
  precoReferenciaMercado?: number;
  precoAtualProduto?: number;
}

export interface ResultadoPrecificacaoDTO {
  somaPercentuais: number;
  markupDivisor: number;
  markupMultiplicador: number;
  precoSugeridoBruto: number;
  precoSugeridoFinal: number;
  precoEquilibrio: number;
  precoContribuicao: number;
  descontoMaximoSemPrejuizoPercentual: number;
  conferencia: {
    parcelaVariaveis: number;
    parcelaFixas: number;
    parcelaLucro: number;
    custoMercadoria: number;
    total: number;
  };
  analisePrecoAtual?: {
    margemContribuicaoPercentual: number;
    margemLucroPercentual: number;
    diferencaParaSugerido: number;
  };
  analiseConcorrencia?: {
    diferencaParaReferencia: number;
    margemNoPrecoReferencia: number;
  };
}

// -------------------------------------------------------------
// Alertas por Regras (F-08 / Seção 5.11)
// -------------------------------------------------------------

export type AlertaId =
  | 'A1' // Estoque mínimo
  | 'A2' // Estoque parado > 60 dias
  | 'A3' // Faturamento abaixo do ponto de equilíbrio proporcional
  | 'A4' // Queda de margem bruta >= 3 p.p.
  | 'A5' // Contas a vencer > saldo de caixa
  | 'A6' // Descontos acima do teto
  | 'A7' // Cobertura < 7 dias
  | 'A8' // Preço de venda abaixo do custo
  | 'A9' // Fiado vencido (Onda 3)
  | 'A10'; // Preço abaixo do equilíbrio

export type NivelAlerta = 'CRITICO' | 'ATENCAO' | 'INFORMATIVO';

export interface AlertaDTO {
  id: AlertaId;
  nivel: NivelAlerta;
  titulo: string;
  mensagem: string;
  dadosMinimosPresentes: boolean;
  indicadorOrigem?: string;
  valoresUsados: Record<string, number | string>;
  dataHoraGeracao: string;
}
