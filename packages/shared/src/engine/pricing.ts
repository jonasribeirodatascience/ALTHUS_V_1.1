/**
 * ALTHUS by DATALIS — Motor de Precificação Comercial (F-29 / Seção 5.12)
 * Técnica: Markup Divisor (Preço por Dentro)
 * Regras: RN-C1 a RN-C8, Critérios de Aceite CA-01 a CA-10
 */

import {
  ParametrosPrecificacao,
  ResultadoPrecificacaoDTO,
  TipoArredondamento,
} from '../types/index.js';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Aplica regra de arredondamento comercial para cima (RN-C4)
 */
export function aplicarArredondamento(valor: number, tipo?: TipoArredondamento): number {
  if (!tipo || tipo === 'NENHUM') {
    return round2(valor);
  }

  if (tipo === 'PROXIMO_005') {
    // Menor múltiplo de 0,05 maior ou igual ao valor
    return Math.ceil(valor * 20) / 20;
  }

  if (tipo === 'TERMINADO_90') {
    // Menor valor terminado em ,90 que seja >= valor
    const parteInteira = Math.floor(valor);
    const centavos = valor - parteInteira;

    if (centavos <= 0.90001) {
      return round2(parteInteira + 0.90);
    } else {
      return round2(parteInteira + 1 + 0.90);
    }
  }

  return round2(valor);
}

/**
 * Calcula a precificação completa por Markup Divisor
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

  if (custoUnitario <= 0) {
    throw new Error('O custo unitário deve ser maior que zero.');
  }

  const somaPercentuais = round2(dv + df + ml);

  // RN-C2: Se DV% + DF% + ML% >= 100%, recusa e explica
  if (somaPercentuais >= 100) {
    throw new Error(
      `A soma das despesas e margem desejada (${somaPercentuais}%) atinge ou ultrapassa 100% do preço. O markup divisor exige que a soma seja estritamente inferior a 100%.`
    );
  }

  const sFracao = somaPercentuais / 100;
  const markupDivisor = 1 - sFracao;
  const markupMultiplicador = round2(1 / markupDivisor);

  // Preço Sugerido = Custo ÷ Markup divisor
  const precoSugeridoBruto = round2(custoUnitario / markupDivisor);
  const precoSugeridoFinal = aplicarArredondamento(precoSugeridoBruto, arredondamento);

  // Preço de equilíbrio (lucro zero) = Custo ÷ (1 - DV% - DF%)
  const divisorEquilibrio = 1 - (dv + df) / 100;
  const precoEquilibrio = divisorEquilibrio > 0 ? round2(custoUnitario / divisorEquilibrio) : 0;

  // Preço de contribuição (cobre custo e variáveis) = Custo ÷ (1 - DV%)
  const divisorContribuicao = 1 - dv / 100;
  const precoContribuicao = divisorContribuicao > 0 ? round2(custoUnitario / divisorContribuicao) : 0;

  // Desconto máximo sem prejuízo a partir do preço sugerido = 1 - (Preço de contribuição ÷ Preço sugerido)
  const descontoMaximoSemPrejuizoPercentual =
    precoSugeridoFinal > 0
      ? round2((1 - precoContribuicao / precoSugeridoFinal) * 100)
      : 0;

  // Conferência das parcelas do preço sugerido bruto
  const parcelaVariaveis = round2(precoSugeridoBruto * (dv / 100));
  const parcelaFixas = round2(precoSugeridoBruto * (df / 100));
  const parcelaLucro = round2(precoSugeridoBruto * (ml / 100));
  const totalConferencia = round2(custoUnitario + parcelaVariaveis + parcelaFixas + parcelaLucro);

  const resultado: ResultadoPrecificacaoDTO = {
    somaPercentuais,
    markupDivisor: Math.round(markupDivisor * 10000) / 10000,
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
      custoMercadoria: round2(custoUnitario),
      total: totalConferencia,
    },
  };

  // Análise do Preço Atual praticado (se informado)
  if (precoAtualProduto && precoAtualProduto > 0) {
    // Margem de contribuição do preço atual = 1 - (custo ÷ preço atual) - DV%
    const margemContribuicaoFracao = 1 - custoUnitario / precoAtualProduto - dv / 100;
    const margemContribuicaoPercentual = round2(margemContribuicaoFracao * 100);

    // Margem de lucro do preço atual = margem de contribuição - DF%
    const margemLucroPercentual = round2(margemContribuicaoPercentual - df);

    resultado.analisePrecoAtual = {
      margemContribuicaoPercentual,
      margemLucroPercentual,
      diferencaParaSugerido: round2(precoAtualProduto - precoSugeridoFinal),
    };
  }

  // Análise do Preço do Concorrente (RN-C5)
  if (precoReferenciaMercado && precoReferenciaMercado > 0) {
    const margemRef = round2(
      (1 - custoUnitario / precoReferenciaMercado - dv / 100 - df / 100) * 100
    );
    resultado.analiseConcorrencia = {
      diferencaParaReferencia: round2(precoSugeridoFinal - precoReferenciaMercado),
      margemNoPrecoReferencia: margemRef,
    };
  }

  return resultado;
}
