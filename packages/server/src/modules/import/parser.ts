/**
 * ALTHUS by DATALIS — Motor de Importação de Vendas e Planilhas (F-12 e F-15)
 * Suporte a CSV (padrão brasileiro ';' e UTF-8) e Excel (.xlsx / .xls).
 * Execução segura (sem fórmulas/macros) com prévia e relatório de rejeitadas.
 */

import { parse as parseCsv } from 'csv-parse/sync';
import * as xlsx from 'xlsx';

export interface ColunaDetectada {
  indice: number;
  nome: string;
  exemploValor: string;
}

export interface PreviaArquivo {
  nomeArquivo: string;
  totalLinhas: number;
  colunas: ColunaDetectada[];
  linhasExemplo: Record<string, string>[];
}

export interface MapeamentoColunasVenda {
  colunaDataHora: string;
  colunaItem: string;
  colunaTamanho?: string;
  colunaCor?: string;
  colunaQuantidade: string;
  colunaValorUnitario?: string;
  colunaValorTotal: string;
  colunaDesconto?: string;
  colunaFormaPagamento?: string;
  colunaSituacao?: string;
  apenasTotaisDiarios?: boolean;
}

export interface LinhaVendaProcessada {
  linhaOriginal: number;
  dataHora: string;
  identificadorItem: string;
  tamanho?: string;
  cor?: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  desconto: number;
  formaPagamento: string;
  situacao: string;
}

export interface LinhaRejeitada {
  linhaOriginal: number;
  conteudoLinha: Record<string, string>;
  motivo: string;
}

export interface ResultadoProcessamentoImportacao {
  linhasValidas: LinhaVendaProcessada[];
  linhasRejeitadas: LinhaRejeitada[];
  totalFaturamentoValido: number;
  totalDescontosValido: number;
}

/**
 * Lê o arquivo em memória e extrai estrutura de colunas e prévia sem executar scripts
 */
export function inspecionarArquivo(buffer: Buffer, nomeArquivo: string): PreviaArquivo {
  let linhas: Record<string, any>[] = [];

  if (nomeArquivo.endsWith('.csv') || nomeArquivo.endsWith('.txt')) {
    const texto = buffer.toString('utf-8');
    // Detecta separador comum (; ou ,)
    const primeiraLinha = texto.split('\n')[0] || '';
    const separador = primeiraLinha.includes(';') ? ';' : ',';

    linhas = parseCsv(texto, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: separador,
      relax_column_count: true,
    });
  } else if (nomeArquivo.endsWith('.xlsx') || nomeArquivo.endsWith('.xls')) {
    // xlsx: lê sem macros nem fórmulas
    const workbook = xlsx.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    linhas = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });
  } else {
    throw new Error('Formato de arquivo não suportado. Envie CSV ou Excel (.xlsx, .xls).');
  }

  if (linhas.length === 0) {
    throw new Error('O arquivo enviado está vazio.');
  }

  const primeira = linhas[0];
  const colunas: ColunaDetectada[] = Object.keys(primeira).map((col, idx) => ({
    indice: idx,
    nome: col,
    exemploValor: String(primeira[col] || ''),
  }));

  const linhasExemplo = linhas.slice(0, 5).map((l) => {
    const limpo: Record<string, string> = {};
    for (const k of Object.keys(l)) {
      limpo[k] = String(l[k] || '');
    }
    return limpo;
  });

  return {
    nomeArquivo,
    totalLinhas: linhas.length,
    colunas,
    linhasExemplo,
  };
}

/**
 * Converte valor numérico em string (ex: "R$ 1.250,50" ou "1250.50") em float confiável
 */
export function converterParaNumero(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim().replace('R$', '').replace(/\s/g, '');
  
  // Se contiver vírgula e ponto (ex: 1.250,50)
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Ex: 1250,50
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Processa as linhas do arquivo de vendas com base no mapeamento fornecido
 */
export function processarVendasComMapeamento(
  buffer: Buffer,
  nomeArquivo: string,
  mapa: MapeamentoColunasVenda
): ResultadoProcessamentoImportacao {
  const previa = inspecionarArquivo(buffer, nomeArquivo);
  let linhasRaw: Record<string, any>[] = [];

  if (nomeArquivo.endsWith('.csv') || nomeArquivo.endsWith('.txt')) {
    const texto = buffer.toString('utf-8');
    const separador = texto.split('\n')[0]?.includes(';') ? ';' : ',';
    linhasRaw = parseCsv(texto, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      delimiter: separador,
    });
  } else {
    const workbook = xlsx.read(buffer, { type: 'buffer', cellFormula: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    linhasRaw = xlsx.utils.sheet_to_json(sheet, { defval: '', raw: false });
  }

  const linhasValidas: LinhaVendaProcessada[] = [];
  const linhasRejeitadas: LinhaRejeitada[] = [];
  let totalFaturamentoValido = 0;
  let totalDescontosValido = 0;

  linhasRaw.forEach((raw, idx) => {
    const numLinha = idx + 2; // Linha 1 é cabeçalho

    const dataRaw = String(raw[mapa.colunaDataHora] || '').trim();
    if (!dataRaw) {
      linhasRejeitadas.push({
        linhaOriginal: numLinha,
        conteudoLinha: raw,
        motivo: 'Coluna de data e hora vazia ou ausente.',
      });
      return;
    }

    // Tenta interpretar data ISO ou padrão BR (DD/MM/YYYY)
    let dataIso: string;
    if (dataRaw.includes('/')) {
      const partes = dataRaw.split(' ');
      const dmy = partes[0].split('/');
      const hora = partes[1] || '12:00:00';
      if (dmy.length === 3) {
        dataIso = `${dmy[2]}-${dmy[1].padStart(2, '0')}-${dmy[0].padStart(2, '0')}T${hora}Z`;
      } else {
        dataIso = new Date().toISOString();
      }
    } else {
      const parsed = new Date(dataRaw);
      dataIso = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }

    const valorTotal = converterParaNumero(raw[mapa.colunaValorTotal]);
    if (valorTotal <= 0 && !mapa.apenasTotaisDiarios) {
      linhasRejeitadas.push({
        linhaOriginal: numLinha,
        conteudoLinha: raw,
        motivo: `Valor total inválido ou negativo: ${valorTotal}`,
      });
      return;
    }

    const quantidade = mapa.colunaQuantidade ? converterParaNumero(raw[mapa.colunaQuantidade]) : 1;
    if (quantidade <= 0 && !mapa.apenasTotaisDiarios) {
      linhasRejeitadas.push({
        linhaOriginal: numLinha,
        conteudoLinha: raw,
        motivo: `Quantidade do item inválida ou zerada: ${quantidade}`,
      });
      return;
    }

    const desconto = mapa.colunaDesconto ? converterParaNumero(raw[mapa.colunaDesconto]) : 0;
    const valorUnitario = mapa.colunaValorUnitario
      ? converterParaNumero(raw[mapa.colunaValorUnitario])
      : quantidade > 0
      ? valorTotal / quantidade
      : valorTotal;

    const situacao = (mapa.colunaSituacao ? String(raw[mapa.colunaSituacao] || '') : 'CONFIRMADA').toUpperCase();
    if (situacao.includes('CANCEL') || situacao.includes('ESTORN')) {
      // Venda cancelada no PDV de origem não entra no faturamento (CA-07)
      return;
    }

    const itemNome = mapa.colunaItem ? String(raw[mapa.colunaItem] || '').trim() : 'Venda Diária';
    const formaPagamento = (mapa.colunaFormaPagamento ? String(raw[mapa.colunaFormaPagamento] || '') : 'DINHEIRO').toUpperCase();

    linhasValidas.push({
      linhaOriginal: numLinha,
      dataHora: dataIso,
      identificadorItem: itemNome,
      tamanho: mapa.colunaTamanho ? String(raw[mapa.colunaTamanho] || '').trim() : undefined,
      cor: mapa.colunaCor ? String(raw[mapa.colunaCor] || '').trim() : undefined,
      quantidade,
      valorUnitario,
      valorTotal,
      desconto,
      formaPagamento,
      situacao: 'CONFIRMADA',
    });

    totalFaturamentoValido += valorTotal;
    totalDescontosValido += desconto;
  });

  return {
    linhasValidas,
    linhasRejeitadas,
    totalFaturamentoValido: Math.round(totalFaturamentoValido * 100) / 100,
    totalDescontosValido: Math.round(totalDescontosValido * 100) / 100,
  };
}
