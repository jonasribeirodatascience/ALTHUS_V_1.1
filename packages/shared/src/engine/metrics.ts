/**
 * ALTHUS by DATALIS — Motor de Indicadores Financeiros e Operacionais (F-07 / Seção 7)
 * Fórmulas matemáticas rigorosas, DRE Gerencial, Ponto de Equilíbrio e Métricas de Estoque.
 */

import {
  DespesaDTO,
  IndicadorValor,
  RelatorioIndicadoresDTO,
  VendaDTO,
  ProdutoDTO,
} from '../types/index.js';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export interface DadosCalculoIndicadores {
  vendas: VendaDTO[];
  despesas: DespesaDTO[];
  produtos: ProdutoDTO[];
  saldoInicialCaixa: number;
  diasFuncionamentoMes: number;
  retiradaMensalDono?: number;
  periodoInicio: string; // ISO String (ex: YYYY-MM-DD)
  periodoFim: string;
}

export function calcularIndicadores(dados: DadosCalculoIndicadores): RelatorioIndicadoresDTO {
  const {
    vendas,
    despesas,
    produtos,
    saldoInicialCaixa,
    diasFuncionamentoMes,
    retiradaMensalDono,
    periodoInicio,
    periodoFim,
  } = dados;

  // Filtrar vendas confirmadas do período
  const vendasConfirmadas = vendas.filter(
    (v) => v.status === 'CONFIRMADA' && v.dataHoraVenda >= periodoInicio && v.dataHoraVenda <= periodoFim
  );

  // 1. Faturamento e Vendas
  const numeroVendas = vendasConfirmadas.length;
  let faturamentoTotal = 0;
  let descontosTotal = 0;
  let faturamentoBrutoTotal = 0;
  let cmvTotal = 0;
  let totalItensVendidosComCusto = 0;

  const vendasPorDiaSemana: Record<string, number> = {
    Dom: 0,
    Seg: 0,
    Ter: 0,
    Qua: 0,
    Qui: 0,
    Sex: 0,
    Sab: 0,
  };
  const diasChave = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const vendasPorHorario: Record<number, number> = {};

  for (let h = 0; h < 24; h++) {
    vendasPorHorario[h] = 0;
  }

  for (const v of vendasConfirmadas) {
    faturamentoTotal += v.valorLiquido;
    descontosTotal += v.valorDesconto;
    faturamentoBrutoTotal += v.valorBruto;

    const dataObj = new Date(v.dataHoraVenda);
    const diaIndex = dataObj.getUTCDay();
    vendasPorDiaSemana[diasChave[diaIndex]] += v.valorLiquido;

    const hora = dataObj.getUTCHours();
    vendasPorHorario[hora] = (vendasPorHorario[hora] || 0) + v.valorLiquido;

    // CMV a partir dos itens gravados
    if (v.itens && v.itens.length > 0) {
      for (const item of v.itens) {
        if (item.custoUnitarioMomento > 0) {
          cmvTotal += item.quantidade * item.custoUnitarioMomento;
          totalItensVendidosComCusto += item.quantidade;
        }
      }
    }
  }

  faturamentoTotal = round2(faturamentoTotal);
  descontosTotal = round2(descontosTotal);
  cmvTotal = round2(cmvTotal);

  const ticketMedio: IndicadorValor<number> =
    numeroVendas > 0
      ? { valor: round2(faturamentoTotal / numeroVendas), disponivel: true }
      : {
          valor: 0,
          disponivel: false,
          motivoIndisponibilidade: 'Sem vendas registradas no período para cálculo de ticket médio.',
        };

  const faturamentoIndicador: IndicadorValor<number> = {
    valor: faturamentoTotal,
    disponivel: true,
  };

  const descontosIndicador: IndicadorValor<{ valor: number; percentual: number }> = {
    valor: {
      valor: descontosTotal,
      percentual:
        faturamentoBrutoTotal > 0 ? round2((descontosTotal / faturamentoBrutoTotal) * 100) : 0,
    },
    disponivel: true,
  };

  // 2. Despesas Operacionais (Fixas e Variáveis) do período
  let despesasFixasTotal = 0;
  let despesasVariaveisTotal = 0;
  let comprasMercadoriaTotal = 0;

  for (const d of despesas) {
    if (d.dataCompetencia >= periodoInicio && d.dataCompetencia <= periodoFim) {
      if (d.categoria === 'MERCADORIA') {
        comprasMercadoriaTotal += d.valor;
      } else if (d.categoria === 'RETIRADA_DONO') {
        // Excluída das despesas operacionais da empresa
      } else if (d.tipo === 'FIXA') {
        despesasFixasTotal += d.valor;
      } else if (d.tipo === 'VARIAVEL') {
        despesasVariaveisTotal += d.valor;
      }
    }
  }

  despesasFixasTotal = round2(despesasFixasTotal);
  despesasVariaveisTotal = round2(despesasVariaveisTotal);

  // No degrau 1 (se não houver itens com custo individual gravados nas vendas):
  let cmvFinal = cmvTotal;
  let limiteCmvDeclarado: string | undefined;
  if (cmvTotal === 0 && comprasMercadoriaTotal > 0) {
    cmvFinal = round2(comprasMercadoriaTotal);
    limiteCmvDeclarado =
      'Custo aproximado pelas compras de mercadoria do período (Degrau 1). Se o estoque aumentou, o custo parecerá mais alto que o real.';
  }

  const cmvIndicador: IndicadorValor<number> = {
    valor: cmvFinal,
    disponivel: cmvFinal > 0 || faturamentoTotal === 0,
    motivoIndisponibilidade:
      cmvFinal === 0 && faturamentoTotal > 0
        ? 'Produtos vendidos sem custo informado no cadastro ou compras não lançadas.'
        : undefined,
    limiteDeclarado: limiteCmvDeclarado,
  };

  // 3. Lucro Bruto e Margem Bruta
  const lucroBrutoValor = round2(faturamentoTotal - cmvFinal);
  const lucroBrutoIndicador: IndicadorValor<number> = {
    valor: lucroBrutoValor,
    disponivel: faturamentoTotal > 0,
    motivoIndisponibilidade: faturamentoTotal === 0 ? 'Faturamento zerado no período.' : undefined,
  };

  const margemBrutaPct =
    faturamentoTotal > 0 ? round2((lucroBrutoValor / faturamentoTotal) * 100) : 0;
  const margemBrutaIndicador: IndicadorValor<number> = {
    valor: margemBrutaPct,
    disponivel: faturamentoTotal > 0,
    motivoIndisponibilidade: faturamentoTotal === 0 ? 'Faturamento zerado no período.' : undefined,
  };

  // 4. Resultado Gerencial e Resultado após Retirada
  const despesasOperacionaisTotal = round2(despesasFixasTotal + despesasVariaveisTotal);
  const resultadoGerencialValor = round2(lucroBrutoValor - despesasOperacionaisTotal);

  const resultadoGerencialIndicador: IndicadorValor<number> = {
    valor: resultadoGerencialValor,
    disponivel: true,
    limiteDeclarado:
      'Resultado operacional simplificado do negócio. Não equivale ao lucro contábil nem deduz depreciações ou tributos não lançados.',
  };

  const retiradaDonoEfetiva = retiradaMensalDono ?? 0;
  const resultadoAposRetiradaValor = round2(resultadoGerencialValor - retiradaDonoEfetiva);
  const resultadoAposRetiradaIndicador: IndicadorValor<number> = {
    valor: resultadoAposRetiradaValor,
    disponivel: retiradaMensalDono !== undefined && retiradaMensalDono > 0,
    motivoIndisponibilidade:
      retiradaMensalDono === undefined || retiradaMensalDono <= 0
        ? 'O resultado ainda não considera quanto você retira. Configure a retirada mensal do dono.'
        : undefined,
  };

  // 5. Análise Custo-Volume-Lucro (Margem de Contribuição e Ponto de Equilíbrio)
  // Margem de Contribuição = (Faturamento - CMV - Despesas Variáveis) ÷ Faturamento
  const margemContribuicaoMonetaria = faturamentoTotal - cmvFinal - despesasVariaveisTotal;
  const margemContribuicaoFracao =
    faturamentoTotal > 0 ? margemContribuicaoMonetaria / faturamentoTotal : 0;
  const margemContribuicaoPercentual = round2(margemContribuicaoFracao * 100);

  const margemContribuicaoIndicador: IndicadorValor<number> = {
    valor: margemContribuicaoPercentual,
    disponivel: faturamentoTotal > 0,
    motivoIndisponibilidade: faturamentoTotal === 0 ? 'Faturamento zerado no período.' : undefined,
  };

  // Ponto de Equilíbrio Mensal = Despesas Fixas ÷ Margem de Contribuição (fração)
  let pontoEquilibrioMensal = 0;
  let pontoEquilibrioDisponivel = false;
  let motivoPontoEquilibrio: string | undefined;

  if (faturamentoTotal === 0) {
    motivoPontoEquilibrio = 'Faturamento zerado no período selecionado.';
  } else if (despesasFixasTotal <= 0) {
    motivoPontoEquilibrio = 'Nenhuma despesa fixa lançada no período.';
  } else if (margemContribuicaoFracao <= 0) {
    motivoPontoEquilibrio =
      'Margem de contribuição nula ou negativa. O faturamento não cobre os custos variáveis e a mercadoria.';
  } else {
    pontoEquilibrioMensal = round2(despesasFixasTotal / margemContribuicaoFracao);
    pontoEquilibrioDisponivel = true;
  }

  const pontoEquilibrioMensalIndicador: IndicadorValor<number> = {
    valor: pontoEquilibrioMensal,
    disponivel: pontoEquilibrioDisponivel,
    motivoIndisponibilidade: motivoPontoEquilibrio,
  };

  const diasUteis = diasFuncionamentoMes > 0 ? diasFuncionamentoMes : 26;
  const pontoEquilibrioDiario =
    pontoEquilibrioDisponivel && diasUteis > 0 ? round2(pontoEquilibrioMensal / diasUteis) : 0;

  const pontoEquilibrioDiarioIndicador: IndicadorValor<number> = {
    valor: pontoEquilibrioDiario,
    disponivel: pontoEquilibrioDisponivel,
    motivoIndisponibilidade: motivoPontoEquilibrio,
  };

  const pctPontoEquilibrioAtingido =
    pontoEquilibrioDisponivel && pontoEquilibrioMensal > 0
      ? round2((faturamentoTotal / pontoEquilibrioMensal) * 100)
      : 0;

  const pctPontoEquilibrioIndicador: IndicadorValor<number> = {
    valor: pctPontoEquilibrioAtingido,
    disponivel: pontoEquilibrioDisponivel,
    motivoIndisponibilidade: motivoPontoEquilibrio,
  };

  // 6. Fluxo de Caixa Real e Vencimentos da Semana
  let fluxoEntradas = 0;
  for (const v of vendasConfirmadas) {
    // Venda entra no caixa no dia da venda (D-05)
    fluxoEntradas += v.valorLiquido;
  }

  let fluxoSaidas = 0;
  let vencimentos7Dias = 0;
  const hoje = new Date().toISOString().substring(0, 10);
  const dataLimite7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .substring(0, 10);

  for (const d of despesas) {
    if (d.status === 'PAGA' && d.dataPagamento) {
      if (d.dataPagamento >= periodoInicio && d.dataPagamento <= periodoFim) {
        fluxoSaidas += d.valor;
      }
    } else if (d.status === 'PENDENTE') {
      if (d.dataVencimento >= hoje && d.dataVencimento <= dataLimite7Dias) {
        vencimentos7Dias += d.valor;
      }
    }
  }

  fluxoEntradas = round2(fluxoEntradas);
  fluxoSaidas = round2(fluxoSaidas);
  vencimentos7Dias = round2(vencimentos7Dias);

  const saldoCaixaAtual = round2(saldoInicialCaixa + fluxoEntradas - fluxoSaidas);

  // 7. Métricas de Estoque
  let valorEstoqueCusto = 0;
  let produtosSemCustoCount = 0;

  for (const p of produtos) {
    if (p.ativo) {
      if (p.custoUnitario > 0) {
        valorEstoqueCusto += p.estoqueAtual * p.custoUnitario;
      } else {
        produtosSemCustoCount++;
      }
    }
  }
  valorEstoqueCusto = round2(valorEstoqueCusto);

  const valorEstoqueIndicador: IndicadorValor<number> = {
    valor: valorEstoqueCusto,
    disponivel: true,
    limiteDeclarado:
      produtosSemCustoCount > 0
        ? `${produtosSemCustoCount} produto(s) sem custo informado ficaram fora da valorização do estoque.`
        : undefined,
  };

  // Giro de Estoque = CMV do período ÷ Estoque médio a custo
  const giroEstoqueValor =
    valorEstoqueCusto > 0 && cmvFinal > 0 ? round2(cmvFinal / valorEstoqueCusto) : 0;
  const giroEstoqueIndicador: IndicadorValor<number> = {
    valor: giroEstoqueValor,
    disponivel: valorEstoqueCusto > 0 && cmvFinal > 0,
    motivoIndisponibilidade:
      valorEstoqueCusto === 0
        ? 'Estoque com custo não informado.'
        : cmvFinal === 0
        ? 'Sem CMV registrado no período.'
        : undefined,
  };

  // Cobertura de Estoque (Dias) = Estoque atual ÷ Venda média diária dos últimos 30 dias
  const vendaMediaDiaria = numeroVendas > 0 ? totalItensVendidosComCusto / 30 : 0;
  let totalItensEstoque = 0;
  for (const p of produtos) {
    if (p.ativo) totalItensEstoque += p.estoqueAtual;
  }
  const coberturaDias =
    vendaMediaDiaria > 0 ? Math.round(totalItensEstoque / vendaMediaDiaria) : 0;

  const coberturaIndicador: IndicadorValor<number> = {
    valor: coberturaDias,
    disponivel: vendaMediaDiaria > 0,
    motivoIndisponibilidade:
      vendaMediaDiaria === 0
        ? 'Histórico insuficiente de vendas nos últimos 30 dias.'
        : undefined,
  };

  return {
    periodo: { inicio: periodoInicio, fim: periodoFim },
    faturamento: faturamentoIndicador,
    numeroVendas: { valor: numeroVendas, disponivel: true },
    ticketMedio,
    vendasPorDiaSemana,
    vendasPorHorario,
    descontosConcedidos: descontosIndicador,
    cmv: cmvIndicador,
    lucroBruto: lucroBrutoIndicador,
    margemBrutaPercentual: margemBrutaIndicador,
    despesasFixas: { valor: despesasFixasTotal, disponivel: true },
    despesasVariaveis: { valor: despesasVariaveisTotal, disponivel: true },
    resultadoGerencial: resultadoGerencialIndicador,
    resultadoAposRetirada: resultadoAposRetiradaIndicador,
    margemContribuicaoPercentual: margemContribuicaoIndicador,
    pontoEquilibrioMensal: pontoEquilibrioMensalIndicador,
    pontoEquilibrioDiario: pontoEquilibrioDiarioIndicador,
    percentualPontoEquilibrioAtingido: pctPontoEquilibrioIndicador,
    fluxoCaixaEntradas: fluxoEntradas,
    fluxoCaixaSaidas: fluxoSaidas,
    saldoCaixaAtual,
    vencimentosProximos7Dias: { valor: vencimentos7Dias, disponivel: true },
    valorEstoqueCusto: valorEstoqueIndicador,
    giroEstoque: giroEstoqueIndicador,
    coberturaEstoqueDias: coberturaIndicador,
    estoqueParado: {
      valor: { valorTotalCusto: 0, quantidadeProdutos: 0 },
      disponivel: true,
    },
  };
}

/**
 * Cálculo da Curva ABC de Produtos por Lucro Acumulado (Princípio de Pareto S19)
 * Classe A: até 80% do lucro total
 * Classe B: 80% a 95% do lucro total
 * Classe C: restante (95% a 100%)
 */
export interface ItemCurvaABC {
  produtoId: string;
  nome: string;
  lucroTotal: number;
  participacaoLucroPct: number;
  acumuladoPct: number;
  classe: 'A' | 'B' | 'C';
}

export function calcularCurvaABC(
  itensLucro: Array<{ produtoId: string; nome: string; lucroTotal: number }>
): ItemCurvaABC[] {
  // Ordena decrescente por lucro
  const ordenados = [...itensLucro].filter((i) => i.lucroTotal > 0);
  ordenados.sort((a, b) => b.lucroTotal - a.lucroTotal);

  const lucroTotalGeral = ordenados.reduce((acc, curr) => acc + curr.lucroTotal, 0);
  if (lucroTotalGeral <= 0) return [];

  let acumulado = 0;
  return ordenados.map((item) => {
    const participacao = (item.lucroTotal / lucroTotalGeral) * 100;
    acumulado += participacao;

    let classe: 'A' | 'B' | 'C' = 'C';
    if (acumulado <= 80.001) {
      classe = 'A';
    } else if (acumulado <= 95.001) {
      classe = 'B';
    } else {
      classe = 'C';
    }

    return {
      produtoId: item.produtoId,
      nome: item.nome,
      lucroTotal: round2(item.lucroTotal),
      participacaoLucroPct: round2(participacao),
      acumuladoPct: round2(acumulado),
      classe,
    };
  });
}
