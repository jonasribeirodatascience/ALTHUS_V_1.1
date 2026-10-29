/**
 * ALTHUS by DATALIS — Motor de Extração de XML de NF-e de Compra (F-16)
 * Processamento seguro (anti-XXE) de notas fiscais eletrônicas de fornecedores.
 */

import { NfeCompraDTO, ItemNfeDTO, DuplicataNfeDTO } from '@althus/shared';

function extrairTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extrairTodasTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Faz o parsing seguro do XML de NF-e (Modelo 55)
 */
export function extrairDadosNfeXml(xmlConteudo: string): NfeCompraDTO {
  // Prevenção contra XML External Entity (XXE)
  if (xmlConteudo.includes('<!ENTITY') || xmlConteudo.includes('<!DOCTYPE')) {
    throw new Error('Arquivo XML inválido ou não seguro.');
  }

  // Chave de acesso (44 dígitos no atributo Id de infNFe)
  const idMatch = xmlConteudo.match(/<infNFe[^>]*Id=["']NFe(\d{44})["']/i);
  const chaveAcesso = idMatch ? idMatch[1] : '';

  if (!chaveAcesso || chaveAcesso.length !== 44) {
    throw new Error('Não foi possível identificar a Chave de Acesso de 44 dígitos no XML da NF-e.');
  }

  // Dados de Identificação da Nota
  const ideXml = extrairTag(xmlConteudo, 'ide');
  const numeroNfe = extrairTag(ideXml, 'nNF') || 'S/N';
  const dataEmissaoRaw = extrairTag(ideXml, 'dhEmi') || extrairTag(ideXml, 'dEmi');
  const dataEmissao = dataEmissaoRaw ? dataEmissaoRaw.substring(0, 10) : new Date().toISOString().substring(0, 10);

  // Emitente (Fornecedor)
  const emitXml = extrairTag(xmlConteudo, 'emit');
  const cnpjEmitente = extrairTag(emitXml, 'CNPJ');
  const razaoSocialEmitente = extrairTag(emitXml, 'xNome') || 'Fornecedor sem razão social';

  // Destinatário (Verificação de CNPJ da Empresa CA-05)
  const destXml = extrairTag(xmlConteudo, 'dest');
  const cnpjDestinatario = extrairTag(destXml, 'CNPJ');

  // Total da Nota
  const totalXml = extrairTag(xmlConteudo, 'ICMSTot');
  const valorTotalNfe = parseFloat(extrairTag(totalXml, 'vNF')) || 0;

  // Itens da Nota (<det>)
  const blocosDet = extrairTodasTags(xmlConteudo, 'det');
  const itens: ItemNfeDTO[] = [];

  for (const det of blocosDet) {
    const prodXml = extrairTag(det, 'prod');
    const codigoProduto = extrairTag(prodXml, 'cProd');
    const cEan = extrairTag(prodXml, 'cEAN');
    const codigoBarrasEan = cEan && cEan !== 'SEM GTIN' ? cEan : undefined;
    const descricao = extrairTag(prodXml, 'xProd');
    const ncm = extrairTag(prodXml, 'NCM');
    const unidade = extrairTag(prodXml, 'uCom') || 'un';
    const quantidade = parseFloat(extrairTag(prodXml, 'qCom')) || 0;
    const valorUnitarioCusto = parseFloat(extrairTag(prodXml, 'vUnCom')) || 0;
    const valorTotal = parseFloat(extrairTag(prodXml, 'vProd')) || 0;

    itens.push({
      codigoProduto,
      codigoBarrasEan,
      descricao,
      ncm,
      unidade,
      quantidade,
      valorUnitarioCusto: Math.round(valorUnitarioCusto * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
    });
  }

  // Duplicatas e Vencimentos (<cobr> -> <dup>)
  const cobrXml = extrairTag(xmlConteudo, 'cobr');
  const blocosDup = extrairTodasTags(cobrXml, 'dup');
  const duplicatas: DuplicataNfeDTO[] = [];

  for (const dup of blocosDup) {
    const numero = extrairTag(dup, 'nDup');
    const dataVencimento = extrairTag(dup, 'dVenc');
    const valor = parseFloat(extrairTag(dup, 'vDup')) || 0;

    if (dataVencimento && valor > 0) {
      duplicatas.push({
        numero,
        dataVencimento,
        valor: Math.round(valor * 100) / 100,
      });
    }
  }

  return {
    chaveAcesso,
    numeroNfe,
    dataEmissao,
    cnpjEmitente,
    razaoSocialEmitente,
    cnpjDestinatario,
    valorTotalNfe: Math.round(valorTotalNfe * 100) / 100,
    itens,
    duplicatas,
  };
}
