/**
 * ALTHUS by DATALIS — Motor de Precificação Comercial (F-29 / Seção 5.12)
 * Técnica: Markup Divisor (Preço por Dentro)
 * Regras: RN-C1 a RN-C8, Critérios de Aceite CA-01 a CA-10
 *
 * Conformidade:
 * - Regra integridade-e-validacao-de-dados-financeiros:
 *   Toda aritmética monetária usa Decimal.js para evitar erros de ponto flutuante.
 */

import Decimal from 'decimal.js';

import {
  ParametrosPrecificacao,
  ResultadoPrecificacaoDTO,
  TipoArredondamento,
} from '../types/index.js';

// Configura precisão global Decimal para operações financeiras
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/** Converte um Decimal para número com 2 casas decimais (arredondamento HALF_UP) */
function round2(val: Decimal | number): number {
  return new Decimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/**
 * Aplica regra de arredondamento comercial para cima (RN-C4)
 */
export function aplicarArredondamento(valor: number, tipo?: TipoArredondamento): number {
  const d = new Decimal(valor);

  if (!tipo || tipo === 'NENHUM') {
    return round2(d);
  }

  if (tipo === 'PROXIMO_005') {
    // Menor múltiplo de 0,05 maior ou igual ao valor: ceil(valor / 0,05) * 0,05
    const mult = new Decimal('0.05');
    return new Decimal(d.div(mult).ceil()).mul(mult).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  }

  if (tipo === 'TERMINADO_90') {
    // Menor valor terminado em ,90 que seja >= valor
    const parteInteira = d.floor();
    const centavos = d.minus(parteInteira);

    if (centavos.lte(new Decimal('0.90001'))) {
      return round2(parteInteira.plus('0.90'));
    } else {
      return round2(parteInteira.plus('1').plus('0.90'));
    }
  }

  return round2(d);
}

/**
 * Calcula a precificação completa por Markup Divisor.
 * Todos os cálculos intermediários usam Decimal.js.
 */
export function calcularPrecificacao(params: ParametrosPrecificacao): ResultadoPrecificacaoDTO {
  const {
    custoUnitario,
    despesasVariaveisPercentual: dv,
    despesasFixasPercentual: df,
    margemLucroDesejadaPercentual: ml,
    arredondamento,
    precoAtualProduto,
    precoReferenciaMercado,
  } = params;

  // Regra integridade: custo unitário é campo de entrada de custo — deve ser positivo
  if (custoUnitario <= 0) {
    throw new Error('O custo unitário deve ser maior que zero.');
  }

  const dCusto = new Decimal(custoUnitario);
  const dDv = new Decimal(dv);
  const dDf = new Decimal(df);
  const dMl = new Decimal(ml);

  const somaPercentuaisD = dDv.plus(dDf).plus(dMl);
  const somaPercentuais = round2(somaPercentuaisD);

  // RN-C2: Se DV% + DF% + ML% >= 100%, recusa e explica
  if (somaPercentuaisD.gte(100)) {
    throw new Error(
      `A soma das despesas e margem desejada (${somaPercentuais}%) atinge ou ultrapassa 100% do preço. O markup divisor exige que a soma seja estritamente inferior a 100%.`
    );
  }

  const sFracao = somaPercentuaisD.div(100);
  const markupDivisorD = new Decimal(1).minus(sFracao);
  const markupMultiplicador = round2(new Decimal(1).div(markupDivisorD));

  // Preço Sugerido = Custo ÷ Markup divisor
  const precoSugeridoBruto = round2(dCusto.div(markupDivisorD));
  const precoSugeridoFinal = aplicarArredondamento(precoSugeridoBruto, arredondamento);

  // Preço de equilíbrio (lucro zero) = Custo ÷ (1 - DV% - DF%)
  const divisorEquilibrioD = new Decimal(1).minus(dDv.plus(dDf).div(100));
  const precoEquilibrio = divisorEquilibrioD.gt(0) ? round2(dCusto.div(divisorEquilibrioD)) : 0;

  // Preço de contribuição (cobre custo e variáveis) = Custo ÷ (1 - DV%)
  const divisorContribuicaoD = new Decimal(1).minus(dDv.div(100));
  const precoContribuicao = divisorContribuicaoD.gt(0) ? round2(dCusto.div(divisorContribuicaoD)) : 0;

  // Desconto máximo sem prejuízo = (1 - Preço de contribuição ÷ Preço sugerido) × 100
  const descontoMaximoSemPrejuizoPercentual =
    precoSugeridoFinal > 0
      ? round2(new Decimal(1).minus(new Decimal(precoContribuicao).div(precoSugeridoFinal)).mul(100))
      : 0;

  // Conferência das parcelas do preço sugerido bruto
  const dPrecoSugeridoBruto = new Decimal(precoSugeridoBruto);
  const parcelaVariaveis = round2(dPrecoSugeridoBruto.mul(dDv.div(100)));
  const parcelaFixas = round2(dPrecoSugeridoBruto.mul(dDf.div(100)));
  const parcelaLucro = round2(dPrecoSugeridoBruto.mul(dMl.div(100)));
  const totalConferencia = round2(dCusto.plus(parcelaVariaveis).plus(parcelaFixas).plus(parcelaLucro));

  const resultado: ResultadoPrecificacaoDTO = {
    somaPercentuais,
    markupDivisor: new Decimal(markupDivisorD).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    markupMultiplicador,
    precoSugeridoBruto,
    precoSugeridoFinal,
    precoEquilibrio,
    precoContribuicao,
    descontoMaximoSemPrejuizoPercentual,
    conferencia: {
      parcelaVariaveis,
      parcelaFixas,
      parcelaLucro,
      custoMercadoria: round2(dCusto),
      total: totalConferencia,
    },
  };

  // Análise do Preço Atual praticado (se informado)
  if (precoAtualProduto && precoAtualProduto > 0) {
    const dPrecoAtual = new Decimal(precoAtualProduto);
    // Margem de contribuição do preço atual = 1 - (custo ÷ preço atual) - DV%
    const margemContribuicaoFracaoD = new Decimal(1)
      .minus(dCusto.div(dPrecoAtual))
      .minus(dDv.div(100));
    const margemContribuicaoPercentual = round2(margemContribuicaoFracaoD.mul(100));
    const margemLucroPercentual = round2(new Decimal(margemContribuicaoPercentual).minus(dDf));

    resultado.analisePrecoAtual = {
      margemContribuicaoPercentual,
      margemLucroPercentual,
      diferencaParaSugerido: round2(new Decimal(precoAtualProduto).minus(precoSugeridoFinal)),
    };
  }

  // Análise do Preço do Concorrente (RN-C5)
  if (precoReferenciaMercado && precoReferenciaMercado > 0) {
    const dRef = new Decimal(precoReferenciaMercado);
    const margemRefD = new Decimal(1)
      .minus(dCusto.div(dRef))
      .minus(dDv.div(100))
      .minus(dDf.div(100))
      .mul(100);
    resultado.analiseConcorrencia = {
      diferencaParaReferencia: round2(new Decimal(precoSugeridoFinal).minus(dRef)),
      margemNoPrecoReferencia: round2(margemRefD),
    };
  }

  return resultado;
}
