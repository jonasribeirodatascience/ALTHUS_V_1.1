/**
 * ALTHUS by DATALIS — Tipos Compartilhados das Ondas 2 e 3 (MVP v1.1)
 */

export interface FechamentoCaixaDTO {
  id: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  dataFechamento: string;
  fundoTrocoInformado: number;
  totalVendasDinheiro: number;
  totalVendasPix: number;
  totalVendasDebito: number;
  totalVendasCredito: number;
  totalVendasPrazo: number;
  totalSaidasDinheiro: number;
  totalCancelamentos: number;
  totalDescontos: number;
  numeroVendas: number;
  dinheiroEsperado: number;
  dinheiroContado: number;
  diferencaQuebra: number; // Positivo = sobra; Negativo = falta/quebra
  observacoes?: string;
  status: 'FECHADO' | 'REABERTO';
  createdAt: string;
}

export interface ItemInventarioLoteDTO {
  produtoId: string;
  variacaoId?: string;
  nome: string;
  tamanho?: string;
  cor?: string;
  estoqueSistema: number;
  estoqueContado: number;
  diferenca: number;
}

export interface InventarioLoteDTO {
  id: string;
  empresaId: string;
  usuarioId: string;
  data: string;
  status: 'RASCUNHO' | 'CONFIRMADO';
  itens: ItemInventarioLoteDTO[];
  createdAt: string;
}

export interface ItemDevolucaoDTO {
  itemId: string;
  produtoId: string;
  variacaoId?: string;
  produtoNome: string;
  tamanho?: string;
  cor?: string;
  quantidadeDevolvida: number;
  precoUnitario: number;
  custoUnitarioEstorno: number;
  valorTotalDevolvido: number;
}

export interface DevolucaoDTO {
  id: string;
  vendaIdOriginal: string;
  empresaId: string;
  usuarioId: string;
  motivo: string;
  valorTotalEstornado: number;
  formaEstorno: 'DINHEIRO' | 'PIX' | 'ESTORNO_CARTAO';
  dataHora: string;
  itens: ItemDevolucaoDTO[];
}

export interface DuplicataNfeDTO {
  numero: string;
  dataVencimento: string;
  valor: number;
}

export interface ItemNfeDTO {
  codigoProduto: string;
  codigoBarrasEan?: string;
  descricao: string;
  ncm?: string;
  quantidade: number;
  unidade: string;
  valorUnitarioCusto: number;
  valorTotal: number;
  produtoVinculadoId?: string;
  variacaoVinculadaId?: string;
}

export interface NfeCompraDTO {
  chaveAcesso: string;
  numeroNfe: string;
  dataEmissao: string;
  cnpjEmitente: string;
  razaoSocialEmitente: string;
  cnpjDestinatario: string;
  valorTotalNfe: number;
  itens: ItemNfeDTO[];
  duplicatas: DuplicataNfeDTO[];
}

export interface TituloReceberDTO {
  id: string;
  vendaId: string;
  empresaId: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone?: string;
  valorTotal: number;
  saldoRestante: number;
  dataVenda: string;
  dataVencimento: string;
  status: 'ABERTO' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'VENCIDO';
  historicoRecebimentos: Array<{
    data: string;
    valor: number;
    formaPagamento: string;
    usuarioId: string;
  }>;
}

export interface VendaOfflineQueueItem {
  clientId: string; // UUID v4 cliente para idempotência (CA-02 de F-27)
  empresaId: string;
  dataHoraLocal: string;
  venda: any;
  statusSincronizacao: 'PENDENTE' | 'SINCRONIZADA' | 'COM_PROBLEMA';
  motivoErro?: string;
}
