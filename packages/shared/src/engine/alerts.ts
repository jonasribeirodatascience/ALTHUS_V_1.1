/**
 * ALTHUS by DATALIS — Motor de Alertas por Regras Matemáticas (F-08 / Seção 5.11)
 * Regras A1 a A8, A10. Sem inteligência artificial opaca; puramente determinístico e auditável.
 *
 * Conformidade:
 * - Regra integridade-e-validacao-de-dados-financeiros:
 *   Valores financeiros nas mensagens de alerta usam Intl.NumberFormat pt-BR (R$ 1.250,00).
 */

import { AlertaDTO, ProdutoDTO, RelatorioIndicadoresDTO } from '../types/index.js';

/** Formata um valor monetário no padrão pt-BR: R$ 1.250,00 */
function fmtBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

/** Formata um percentual no padrão pt-BR: 32,3% */
function fmtPct(valor: number, casas = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor) + '%';
}

export interface DadosParaAvaliacaoAlertas {
  produtos: ProdutoDTO[];
  indicadoresAtuais: RelatorioIndicadoresDTO;
  indicadoresPeriodoAnterior?: RelatorioIndicadoresDTO;
  limiteDescontoDonoPercentual?: number;
  diasDecorridosMes?: number;
  totalDiasMes?: number;
}

export function avaliarAlertas(dados: DadosParaAvaliacaoAlertas): AlertaDTO[] {
  const {
    produtos,
    indicadoresAtuais,
    indicadoresPeriodoAnterior,
    limiteDescontoDonoPercentual = 10,
    diasDecorridosMes = new Date().getUTCDate(),
    totalDiasMes = 30,
  } = dados;

  const alertas: AlertaDTO[] = [];
  const agoraIso = new Date().toISOString();

  // -------------------------------------------------------------
  // A1: Estoque atual <= Estoque mínimo
  // -------------------------------------------------------------
  const produtosAbaixoMinimo = produtos.filter(
    (p) => p.ativo && p.estoqueMinimo > 0 && p.estoqueAtual <= p.estoqueMinimo
  );

  if (produtosAbaixoMinimo.length > 0) {
    alertas.push({
      id: 'A1',
      nivel: 'CRITICO',
      titulo: 'Produtos no Estoque Mínimo',
      mensagem: `${produtosAbaixoMinimo.length} produto(s) estão no estoque mínimo ou abaixo, sob risco de falta nas vendas.`,
      dadosMinimosPresentes: true,
      indicadorOrigem: 'F-04 Estoque',
      valoresUsados: {
        quantidadeProdutos: produtosAbaixoMinimo.length,
        exemplos: produtosAbaixoMinimo.slice(0, 3).map((p) => p.nome).join(', '),
      },
      dataHoraGeracao: agoraIso,
    });
  }

  // -------------------------------------------------------------
  // A5: Contas a vencer em 7 dias maiores que o saldo de caixa
  // -------------------------------------------------------------
  const vencimentos7Dias = indicadoresAtuais.vencimentosProximos7Dias.valor;
  const saldoCaixa = indicadoresAtuais.saldoCaixaAtual;

  if (vencimentos7Dias > saldoCaixa) {
    // Diferença calculada sem perda de precisão, arredondada para exibição
    const diferenca = Math.round((vencimentos7Dias - saldoCaixa) * 100) / 100;
    alertas.push({
      id: 'A5',
      nivel: 'CRITICO',
      titulo: 'Vencimentos Superam o Saldo de Caixa',
      mensagem: `Vencem ${fmtBRL(vencimentos7Dias)} nos próximos 7 dias e seu saldo atual de caixa é ${fmtBRL(saldoCaixa)} (déficit de ${fmtBRL(diferenca)}).`,
      dadosMinimosPresentes: true,
      indicadorOrigem: 'F-06 Despesas e Vencimentos',
      valoresUsados: {
        vencimentosProximos7Dias: vencimentos7Dias,
        saldoCaixaAtual: saldoCaixa,
        deficitProjetado: diferenca,
      },
      dataHoraGeracao: agoraIso,
    });
  }

  // -------------------------------------------------------------
  // A8: Produto com preço de venda abaixo do custo
  // -------------------------------------------------------------
  const produtosPrecoAbaixoCusto = produtos.filter(
    (p) => p.ativo && p.custoUnitario > 0 && p.precoVenda < p.custoUnitario
  );

  if (produtosPrecoAbaixoCusto.length > 0) {
    alertas.push({
      id: 'A8',
      nivel: 'CRITICO',
      titulo: 'Preço de Venda Abaixo do Custo',
      mensagem: `${produtosPrecoAbaixoCusto.length} produto(s) estão cadastrados com preço menor que o custo de reposição, gerando prejuízo direto por unidade vendida.`,
      dadosMinimosPresentes: true,
      indicadorOrigem: 'F-04 Produtos',
      valoresUsados: {
        quantidadeProdutos: produtosPrecoAbaixoCusto.length,
        produtos: produtosPrecoAbaixoCusto
          .slice(0, 3)
          .map((p) => `${p.nome} (Preço: ${fmtBRL(p.precoVenda)} < Custo: ${fmtBRL(p.custoUnitario)})`)
          .join('; '),
      },
      dataHoraGeracao: agoraIso,
    });
  }

  // -------------------------------------------------------------
  // A3: Faturamento proporcional abaixo da meta do ponto de equilíbrio
  // -------------------------------------------------------------
  if (
    indicadoresAtuais.pontoEquilibrioMensal.disponivel &&
    indicadoresAtuais.pontoEquilibrioMensal.valor > 0
  ) {
    const peMensal = indicadoresAtuais.pontoEquilibrioMensal.valor;
    const metaProporcional = (peMensal / totalDiasMes) * diasDecorridosMes;
    const faturamentoAtual = indicadoresAtuais.faturamento.valor;

    if (faturamentoAtual < metaProporcional) {
      alertas.push({
        id: 'A3',
        nivel: 'ATENCAO',
        titulo: 'Faturamento Abaixo do Ponto de Equilíbrio Proporcional',
        mensagem: `Até hoje você faturou ${fmtBRL(faturamentoAtual)}; o esperado para o dia ${diasDecorridosMes}/${totalDiasMes} era ${fmtBRL(Math.round(metaProporcional * 100) / 100)} para cobrir custos e despesas fixas.`,
        dadosMinimosPresentes: true,
        indicadorOrigem: 'F-07 Ponto de Equilíbrio',
        valoresUsados: {
          faturamentoAtual,
          metaEsperadaProporcional: Math.round(metaProporcional * 100) / 100,
          pontoEquilibrioMensal: peMensal,
        },
        dataHoraGeracao: agoraIso,
      });
    }
  }

  // -------------------------------------------------------------
  // A4: Queda de margem bruta >= 3 p.p. frente ao período anterior
  // -------------------------------------------------------------
  if (
    indicadoresPeriodoAnterior &&
    indicadoresPeriodoAnterior.margemBrutaPercentual.disponivel &&
    indicadoresAtuais.margemBrutaPercentual.disponivel
  ) {
    const margemAnterior = indicadoresPeriodoAnterior.margemBrutaPercentual.valor;
    const margemAtual = indicadoresAtuais.margemBrutaPercentual.valor;
    const quedaPontos = margemAnterior - margemAtual;

    if (quedaPontos >= 3) {
      alertas.push({
        id: 'A4',
        nivel: 'ATENCAO',
        titulo: 'Queda Relevante na Margem Bruta',
        mensagem: `Sua margem bruta caiu de ${fmtPct(margemAnterior)} para ${fmtPct(margemAtual)} (queda de ${fmtPct(Math.round(quedaPontos * 10) / 10)} p.p.).`,
        dadosMinimosPresentes: true,
        indicadorOrigem: 'F-07 Margem Bruta',
        valoresUsados: {
          margemAnterior,
          margemAtual,
          quedaPontos: Math.round(quedaPontos * 10) / 10,
        },
        dataHoraGeracao: agoraIso,
      });
    }
  }

  // -------------------------------------------------------------
  // A6: Descontos concedidos acima do teto definido pelo dono
  // -------------------------------------------------------------
  if (indicadoresAtuais.descontosConcedidos.disponivel) {
    const pctDescontos = indicadoresAtuais.descontosConcedidos.valor.percentual;
    if (pctDescontos > limiteDescontoDonoPercentual) {
      alertas.push({
        id: 'A6',
        nivel: 'ATENCAO',
        titulo: 'Descontos Acima do Limite',
        mensagem: `Você concedeu ${fmtBRL(indicadoresAtuais.descontosConcedidos.valor.valor)} em descontos (${fmtPct(pctDescontos)} do faturamento bruto), superando o teto de ${fmtPct(limiteDescontoDonoPercentual)}.`,
        dadosMinimosPresentes: true,
        indicadorOrigem: 'F-07 Descontos',
        valoresUsados: {
          descontoTotal: indicadoresAtuais.descontosConcedidos.valor.valor,
          percentualConcedido: pctDescontos,
          limiteConfigurado: limiteDescontoDonoPercentual,
        },
        dataHoraGeracao: agoraIso,
      });
    }
  }

  return alertas;
}
