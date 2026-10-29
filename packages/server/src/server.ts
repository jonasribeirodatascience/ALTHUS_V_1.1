/**
 * ALTHUS by DATALIS — Servidor API Fastify (MVP v1.1 / Ondas 1, 2 e 3 Completas)
 * Monólito Modular: Autenticação, Multi-Tenant, Catálogo, Despesas, Importação,
 * Indicadores, Precificação, PDV Nativo, Dados para Emissão, Devoluções,
 * Fechamento de Caixa, Inventário, XML de NF-e de Compra, Fiado e Sync Offline.
 */

import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import crypto from 'node:crypto';

import {
  calcularPrecificacao,
  calcularIndicadores,
  avaliarAlertas,
  calcularCurvaABC,
  isValidDocument,
  cleanDocument,
  ParametrosPrecificacao,
  ProdutoDTO,
  DespesaDTO,
  VendaDTO,
  UsuarioDTO,
  EmpresaDTO,
  UserRole,
  FechamentoCaixaDTO,
  DevolucaoDTO,
  TituloReceberDTO,
} from '@althus/shared';

import {
  hashPassword,
  verifyPassword,
  encryptSensitive,
  generateBlindIndex,
} from './security/crypto.js';

import {
  inspecionarArquivo,
  processarVendasComMapeamento,
  MapeamentoColunasVenda,
} from './modules/import/parser.js';

import { extrairDadosNfeXml } from './modules/nfe/parser.js';

dotenv.config({ path: '../../.env' });
dotenv.config();

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
  bodyLimit: 25 * 1024 * 1024, // 25 MB limite para XMLs e planilhas
});

await server.register(cors, {
  origin: true,
  credentials: true,
});

await server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'althus-super-secret-jwt-key-min-32-chars-long',
});

await server.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// -------------------------------------------------------------
// Armazenamento em Memória / Mock Estruturado Multi-Tenant
// -------------------------------------------------------------
interface DbStore {
  empresas: Map<string, EmpresaDTO & { docCriptografado: string; blindIndex: string }>;
  usuarios: Map<string, UsuarioDTO & { senhaHash: string }>;
  produtos: Map<string, ProdutoDTO>;
  despesas: Map<string, DespesaDTO>;
  vendas: Map<string, VendaDTO>;
  devolucoes: Map<string, DevolucaoDTO>;
  fechamentos: Map<string, FechamentoCaixaDTO>;
  titulosReceber: Map<string, TituloReceberDTO>;
  nfeChavesImportadas: Set<string>;
  auditoria: Array<any>;
}

const db: DbStore = {
  empresas: new Map(),
  usuarios: new Map(),
  produtos: new Map(),
  despesas: new Map(),
  vendas: new Map(),
  devolucoes: new Map(),
  fechamentos: new Map(),
  titulosReceber: new Map(),
  nfeChavesImportadas: new Set(),
  auditoria: [],
};

// Seed de demonstração
const demoEmpresaId = '11111111-1111-1111-1111-111111111111';
const demoDonoId = '22222222-2222-2222-2222-222222222222';
const demoOperadorId = '33333333-3333-3333-3333-333333333333';

db.empresas.set(demoEmpresaId, {
  id: demoEmpresaId,
  nomeFantasia: 'Mercado & Moda Althus',
  razaoSocial: 'Comércio Varejista Althus Ltda',
  documentoMasked: '12.***.789/0001-**',
  docCriptografado: encryptSensitive('12345678000195'),
  blindIndex: generateBlindIndex('12345678000195'),
  estado: 'MS',
  tipoNegocio: 'Vestuário e Minimercado',
  regimeTributario: 'Simples Nacional',
  saldoInicialCaixa: 1500.00,
  diasFuncionamentoMes: 26,
  limiteDescontoOperador: 10.0,
  retiradaMensalDono: 3500.00,
  createdAt: new Date().toISOString(),
});

db.usuarios.set(demoDonoId, {
  id: demoDonoId,
  empresaId: demoEmpresaId,
  nome: 'Carlos Dono',
  email: 'dono@althus.com.br',
  role: 'DONO',
  ativo: true,
  senhaHash: await hashPassword('123456'),
  createdAt: new Date().toISOString(),
});

db.usuarios.set(demoOperadorId, {
  id: demoOperadorId,
  empresaId: demoEmpresaId,
  nome: 'Mariana Operadora',
  email: 'caixa@althus.com.br',
  role: 'OPERADOR',
  ativo: true,
  senhaHash: await hashPassword('123456'),
  createdAt: new Date().toISOString(),
});

// Seed de Produtos e Variações
const p1Id = 'p1-camiseta-polo';
db.produtos.set(p1Id, {
  id: p1Id,
  empresaId: demoEmpresaId,
  nome: 'Camiseta Polo Básica',
  categoria: 'Vestuário',
  unidade: 'un',
  custoUnitario: 35.00,
  precoVenda: 79.90,
  estoqueAtual: 42,
  estoqueMinimo: 15,
  ativo: true,
  possuiVariacoes: true,
  variacoes: [
    { id: 'v1-m-azul', produtoId: p1Id, empresaId: demoEmpresaId, tamanho: 'M', cor: 'Azul', codigoBarras: '789100000001', estoqueAtual: 8, estoqueMinimo: 5, ativo: true, custoEfetivo: 35.00, precoEfetivo: 79.90 },
    { id: 'v2-g-preto', produtoId: p1Id, empresaId: demoEmpresaId, tamanho: 'G', cor: 'Preto', codigoBarras: '789100000002', estoqueAtual: 14, estoqueMinimo: 5, ativo: true, custoEfetivo: 35.00, precoEfetivo: 79.90 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const p2Id = 'p2-arroz-5kg';
db.produtos.set(p2Id, {
  id: p2Id,
  empresaId: demoEmpresaId,
  nome: 'Arroz Tipo 1 - 5kg',
  categoria: 'Mercearia',
  codigoBarras: '789200000001',
  unidade: 'un',
  custoUnitario: 22.50,
  precoVenda: 29.90,
  estoqueAtual: 4,
  estoqueMinimo: 10,
  ativo: true,
  possuiVariacoes: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const p3Id = 'p3-queijo-kg';
db.produtos.set(p3Id, {
  id: p3Id,
  empresaId: demoEmpresaId,
  nome: 'Queijo Muçarela Fatiado (kg)',
  categoria: 'Laticínios',
  codigoBarras: '789400000001',
  unidade: 'kg',
  custoUnitario: 32.00,
  precoVenda: 45.90,
  estoqueAtual: 15.500,
  estoqueMinimo: 5.000,
  ativo: true,
  possuiVariacoes: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Middleware de Autenticação
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
      empresaId: string;
      role: UserRole;
    };
  }
}

// -------------------------------------------------------------
// ROTAS DE AUTENTICAÇÃO (F-01, F-02)
// -------------------------------------------------------------

server.post('/api/auth/register', async (request, reply) => {
  const body = request.body as any;
  const { nome, email, senha, nomeFantasia, documento, estado, tipoNegocio } = body;

  if (!nome || !email || !senha || !nomeFantasia || !documento || !estado) {
    return reply.status(400).send({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (!isValidDocument(documento)) {
    return reply.status(400).send({ error: 'CPF ou CNPJ inválido pelos dígitos verificadores.' });
  }

  const cleanDoc = cleanDocument(documento);
  const blindIndex = generateBlindIndex(cleanDoc);

  for (const emp of db.empresas.values()) {
    if (emp.blindIndex === blindIndex) {
      return reply.status(400).send({ error: 'Já existe uma empresa cadastrada com este CPF/CNPJ.' });
    }
  }

  const empresaId = crypto.randomUUID();
  const usuarioId = crypto.randomUUID();
  const senhaHash = await hashPassword(senha);

  const novaEmpresa = {
    id: empresaId,
    nomeFantasia,
    razaoSocial: body.razaoSocial || nomeFantasia,
    documentoMasked: cleanDoc.length === 11 ? `***.${cleanDoc.slice(3, 6)}.${cleanDoc.slice(6, 9)}-**` : `**.***.${cleanDoc.slice(5, 8)}/0001-**`,
    docCriptografado: encryptSensitive(cleanDoc),
    blindIndex,
    estado,
    tipoNegocio: tipoNegocio || 'Comércio Varejista',
    regimeTributario: body.regimeTributario || 'Simples Nacional',
    saldoInicialCaixa: body.saldoInicialCaixa || 0,
    diasFuncionamentoMes: body.diasFuncionamentoMes || 26,
    limiteDescontoOperador: body.limiteDescontoOperador || 10,
    retiradaMensalDono: body.retiradaMensalDono,
    createdAt: new Date().toISOString(),
  };

  const novoUsuario: UsuarioDTO & { senhaHash: string } = {
    id: usuarioId,
    empresaId,
    nome,
    email,
    role: 'DONO',
    ativo: true,
    senhaHash,
    createdAt: new Date().toISOString(),
  };

  db.empresas.set(empresaId, novaEmpresa);
  db.usuarios.set(usuarioId, novoUsuario);

  const token = server.jwt.sign({
    userId: usuarioId,
    empresaId,
    role: 'DONO',
  });

  return reply.status(201).send({
    token,
    user: { id: usuarioId, nome, email, role: 'DONO', empresaId },
    empresa: novaEmpresa,
  });
});

server.post('/api/auth/login', async (request, reply) => {
  const { email, senha } = request.body as any;

  let usuarioEncontrado: (UsuarioDTO & { senhaHash: string }) | undefined;
  for (const u of db.usuarios.values()) {
    if (u.email.toLowerCase() === String(email).toLowerCase()) {
      usuarioEncontrado = u;
      break;
    }
  }

  if (!usuarioEncontrado || !usuarioEncontrado.ativo) {
    return reply.status(401).send({ error: 'Credenciais inválidas ou conta inativa.' });
  }

  const senhaValida = await verifyPassword(senha, usuarioEncontrado.senhaHash);
  if (!senhaValida) {
    return reply.status(401).send({ error: 'Credenciais inválidas.' });
  }

  const empresa = db.empresas.get(usuarioEncontrado.empresaId);

  const token = server.jwt.sign({
    userId: usuarioEncontrado.id,
    empresaId: usuarioEncontrado.empresaId,
    role: usuarioEncontrado.role,
  });

  return {
    token,
    user: {
      id: usuarioEncontrado.id,
      nome: usuarioEncontrado.nome,
      email: usuarioEncontrado.email,
      role: usuarioEncontrado.role,
      empresaId: usuarioEncontrado.empresaId,
    },
    empresa,
  };
});

// -------------------------------------------------------------
// ONDA 2: PDV NATIVO (F-05) & REGISTRO DE VENDAS
// -------------------------------------------------------------

server.post('/api/pdv/vender', { preHandler: [authenticate] }, async (request, reply) => {
  const empresaId = request.user.empresaId;
  const usuarioId = request.user.userId;
  const empresa = db.empresas.get(empresaId);

  const body = request.body as any;
  const { itens, formaPagamento, clienteId, clienteNome, clienteTelefone, valorDesconto = 0 } = body;

  if (!itens || itens.length === 0) {
    return reply.status(400).send({ error: 'A venda deve conter pelo menos um item.' });
  }

  if (!formaPagamento) {
    return reply.status(400).send({ error: 'Selecione uma forma de pagamento.' });
  }

  // RN-02: Se for venda a prazo (fiado / F-18), cliente é obrigatório
  if (formaPagamento === 'A_PRAZO' && !clienteNome) {
    return reply.status(400).send({ error: 'Venda a prazo (fiado) exige identificação do cliente.' });
  }

  let totalBruto = 0;
  const itensProcessados: any[] = [];
  const alertasEstoqueInconsistente: string[] = [];

  for (const item of itens) {
    const prod = db.produtos.get(item.produtoId);
    if (!prod || prod.empresaId !== empresaId) {
      return reply.status(400).send({ error: `Produto não encontrado: ${item.produtoId}` });
    }

    const qtd = Number(item.quantidade);
    if (qtd <= 0) {
      return reply.status(400).send({ error: `Quantidade inválida para o produto ${prod.nome}` });
    }

    let precoUnitario = prod.precoVenda;
    let custoUnitarioMomento = prod.custoUnitario;

    // Se for variação (F-26)
    if (item.variacaoId && prod.variacoes) {
      const varItem = prod.variacoes.find((v) => v.id === item.variacaoId);
      if (varItem) {
        if (varItem.precoEfetivo) precoUnitario = varItem.precoEfetivo;
        if (varItem.custoEfetivo) custoUnitarioMomento = varItem.custoEfetivo;

        // Baixa de estoque da variação
        if (varItem.estoqueAtual < qtd) {
          alertasEstoqueInconsistente.push(`${prod.nome} (${varItem.tamanho} - ${varItem.cor})`);
        }
        varItem.estoqueAtual -= qtd;
      }
    } else {
      // Baixa de estoque do produto pai
      if (prod.estoqueAtual < qtd) {
        alertasEstoqueInconsistente.push(prod.nome);
      }
      prod.estoqueAtual -= qtd;
    }

    // Venda por peso (RN-06 a RN-08): preço por kg arredondado ao centavo
    const totalItem = Math.round(qtd * precoUnitario * 100) / 100;
    totalBruto += totalItem;

    itensProcessados.push({
      id: crypto.randomUUID(),
      produtoId: prod.id,
      variacaoId: item.variacaoId,
      produtoNome: prod.nome,
      tamanho: item.tamanho,
      cor: item.cor,
      quantidade: qtd,
      precoUnitario,
      custoUnitarioMomento, // RN-01: custo congelado no momento da venda
      valorDesconto: item.desconto || 0,
      valorTotal: totalItem - (item.desconto || 0),
    });
  }

  // Validação de limite de desconto do operador (RN-03, CA-06)
  const descontoTotal = Number(valorDesconto);
  const limiteDescontoDono = empresa?.limiteDescontoOperador || 10;
  const pctDesconto = totalBruto > 0 ? (descontoTotal / totalBruto) * 100 : 0;

  if (request.user.role === 'OPERADOR' && pctDesconto > limiteDescontoDono) {
    return reply.status(403).send({
      error: `Desconto de ${pctDesconto.toFixed(1)}% ultrapassa o limite permitido para operadores (${limiteDescontoDono}%). Solicite autorização do Dono.`,
    });
  }

  const totalLiquido = Math.max(0, Math.round((totalBruto - descontoTotal) * 100) / 100);
  const vendaId = crypto.randomUUID();

  const novaVenda: VendaDTO = {
    id: vendaId,
    empresaId,
    usuarioId,
    clienteId,
    origem: 'PDV_NATIVO',
    status: 'CONFIRMADA',
    valorBruto: Math.round(totalBruto * 100) / 100,
    valorDesconto: descontoTotal,
    valorLiquido: totalLiquido,
    formaPagamento,
    dataHoraVenda: new Date().toISOString(),
    itens: itensProcessados,
  };

  db.vendas.set(vendaId, novaVenda);

  // Se foi venda a prazo (fiado / F-18), cria título em contas a receber
  if (formaPagamento === 'A_PRAZO') {
    const tituloId = crypto.randomUUID();
    const titulo: TituloReceberDTO = {
      id: tituloId,
      vendaId,
      empresaId,
      clienteId: clienteId || 'cliente-avulso',
      clienteNome: clienteNome || 'Cliente a Prazo',
      clienteTelefone,
      valorTotal: totalLiquido,
      saldoRestante: totalLiquido,
      dataVenda: new Date().toISOString().substring(0, 10),
      dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'ABERTO',
      historicoRecebimentos: [],
    };
    db.titulosReceber.set(tituloId, titulo);
  }

  return reply.status(201).send({
    sucesso: true,
    venda: novaVenda,
    alertasEstoqueInconsistente:
      alertasEstoqueInconsistente.length > 0
        ? `Venda confirmada, porém os seguintes itens ficaram com estoque inconsistente/negativo: ${alertasEstoqueInconsistente.join(', ')}`
        : null,
  });
});

// Cancelamento de Venda (CA-07, CA-08)
server.post('/api/pdv/cancelar', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Apenas o Dono pode cancelar vendas já confirmadas.' });
  }

  const { vendaId, motivo } = request.body as any;
  const venda = db.vendas.get(vendaId);

  if (!venda || venda.empresaId !== request.user.empresaId) {
    return reply.status(404).send({ error: 'Venda não encontrada.' });
  }

  if (venda.status === 'CANCELADA') {
    return reply.status(400).send({ error: 'Esta venda já está cancelada.' });
  }

  // Estorna estoque dos itens
  if (venda.itens) {
    for (const item of venda.itens) {
      const prod = db.produtos.get(item.produtoId);
      if (prod) {
        if (item.variacaoId && prod.variacoes) {
          const varItem = prod.variacoes.find((v) => v.id === item.variacaoId);
          if (varItem) varItem.estoqueAtual += item.quantidade;
        } else {
          prod.estoqueAtual += item.quantidade;
        }
      }
    }
  }

  venda.status = 'CANCELADA';
  venda.motivoCancelamento = motivo || 'Cancelada pelo proprietário';

  // Se havia título em contas a receber, cancela também
  for (const t of db.titulosReceber.values()) {
    if (t.vendaId === vendaId) {
      db.titulosReceber.delete(t.id);
      break;
    }
  }

  return { sucesso: true, mensagem: 'Venda cancelada e estoque devolvido com sucesso.' };
});

// -------------------------------------------------------------
// ONDA 2: RELATÓRIO "DADOS PARA EMISSÃO" (F-09)
// -------------------------------------------------------------

server.get('/api/relatorios/dados-emissao', { preHandler: [authenticate] }, async (request) => {
  const empresaId = request.user.empresaId;
  const hoje = new Date().toISOString().substring(0, 10);

  const vendasConfirmadas: VendaDTO[] = [];
  for (const v of db.vendas.values()) {
    if (v.empresaId === empresaId && v.status === 'CONFIRMADA') {
      // CA-06: Operador vê apenas as vendas do dia
      if (request.user.role === 'OPERADOR') {
        if (v.dataHoraVenda.startsWith(hoje)) {
          vendasConfirmadas.push(v);
        }
      } else {
        vendasConfirmadas.push(v);
      }
    }
  }

  return {
    avisoLegal: 'Relatório gerencial. Não é documento fiscal e não substitui a nota fiscal.',
    totalVendas: vendasConfirmadas.length,
    vendas: vendasConfirmadas,
  };
});

// -------------------------------------------------------------
// ONDA 2: TROCAS E DEVOLUÇÕES (F-28)
// -------------------------------------------------------------

server.post('/api/vendas/:id/devolver', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Apenas o Dono pode registrar devoluções.' });
  }

  const { id } = request.params as any;
  const { itensDevolvidos, motivo, formaEstorno } = request.body as any;

  const venda = db.vendas.get(id);
  if (!venda || venda.empresaId !== request.user.empresaId) {
    return reply.status(404).send({ error: 'Venda não encontrada.' });
  }

  let totalEstornado = 0;
  const itensDevolucaoProcessados: any[] = [];

  for (const devItem of itensDevolvidos) {
    const itemOriginal = venda.itens?.find((i) => i.id === devItem.itemId);
    if (!itemOriginal) continue;

    const qtdDev = Number(devItem.quantidade);
    if (qtdDev <= 0 || qtdDev > itemOriginal.quantidade) {
      return reply.status(400).send({ error: `Quantidade devolvida inválida para ${itemOriginal.produtoNome}` });
    }

    const valorEstornoItem = Math.round(qtdDev * itemOriginal.precoUnitario * 100) / 100;
    totalEstornado += valorEstornoItem;

    // Retorno ao estoque da variação ou produto (CA-01)
    const prod = db.produtos.get(itemOriginal.produtoId);
    if (prod) {
      if (itemOriginal.variacaoId && prod.variacoes) {
        const v = prod.variacoes.find((v) => v.id === itemOriginal.variacaoId);
        if (v) v.estoqueAtual += qtdDev;
      } else {
        prod.estoqueAtual += qtdDev;
      }
    }

    itensDevolucaoProcessados.push({
      itemId: itemOriginal.id,
      produtoId: itemOriginal.produtoId,
      variacaoId: itemOriginal.variacaoId,
      produtoNome: itemOriginal.produtoNome,
      tamanho: itemOriginal.tamanho,
      cor: itemOriginal.cor,
      quantidadeDevolvida: qtdDev,
      precoUnitario: itemOriginal.precoUnitario,
      custoUnitarioEstorno: itemOriginal.custoUnitarioMomento,
      valorTotalDevolvido: valorEstornoItem,
    });
  }

  const devolucaoId = crypto.randomUUID();
  const novaDevolucao: DevolucaoDTO = {
    id: devolucaoId,
    vendaIdOriginal: id,
    empresaId: request.user.empresaId,
    usuarioId: request.user.userId,
    motivo: motivo || 'Devolução no balcão',
    valorTotalEstornado: Math.round(totalEstornado * 100) / 100,
    formaEstorno: formaEstorno || 'DINHEIRO',
    dataHora: new Date().toISOString(),
    itens: itensDevolucaoProcessados,
  };

  db.devolucoes.set(devolucaoId, novaDevolucao);

  return {
    sucesso: true,
    devolucao: novaDevolucao,
    mensagem: 'Devolução registrada, mercadoria retornada ao estoque e valor estornado.',
  };
});

// -------------------------------------------------------------
// ONDA 2: FECHAMENTO DE CAIXA DO DIA (F-13)
// -------------------------------------------------------------

server.post('/api/caixa/fechamento', { preHandler: [authenticate] }, async (request) => {
  const empresaId = request.user.empresaId;
  const { fundoTrocoInformado, dinheiroContado, observacoes } = request.body as any;

  const hoje = new Date().toISOString().substring(0, 10);
  let totalDinheiro = 0;
  let totalPix = 0;
  let totalDebito = 0;
  let totalCredito = 0;
  let totalPrazo = 0;
  let totalDescontos = 0;
  let totalCancelamentos = 0;
  let numVendas = 0;

  for (const v of db.vendas.values()) {
    if (v.empresaId === empresaId && v.dataHoraVenda.startsWith(hoje)) {
      if (v.status === 'CONFIRMADA') {
        numVendas++;
        totalDescontos += v.valorDesconto;
        if (v.formaPagamento === 'DINHEIRO') totalDinheiro += v.valorLiquido;
        if (v.formaPagamento === 'PIX') totalPix += v.valorLiquido;
        if (v.formaPagamento === 'DEBITO') totalDebito += v.valorLiquido;
        if (v.formaPagamento === 'CREDITO') totalCredito += v.valorLiquido;
        if (v.formaPagamento === 'A_PRAZO') totalPrazo += v.valorLiquido;
      } else if (v.status === 'CANCELADA') {
        totalCancelamentos += v.valorLiquido;
      }
    }
  }

  const fundoTroco = Number(fundoTrocoInformado || 0);
  const contado = Number(dinheiroContado || 0);
  const dinheiroEsperado = Math.round((fundoTroco + totalDinheiro) * 100) / 100;
  const diferencaQuebra = Math.round((contado - dinheiroEsperado) * 100) / 100;

  const fechamentoId = crypto.randomUUID();
  const fechamento: FechamentoCaixaDTO = {
    id: fechamentoId,
    empresaId,
    usuarioId: request.user.userId,
    usuarioNome: request.user.role === 'DONO' ? 'Carlos Dono' : 'Mariana Operadora',
    dataFechamento: hoje,
    fundoTrocoInformado: fundoTroco,
    totalVendasDinheiro: Math.round(totalDinheiro * 100) / 100,
    totalVendasPix: Math.round(totalPix * 100) / 100,
    totalVendasDebito: Math.round(totalDebito * 100) / 100,
    totalVendasCredito: Math.round(totalCredito * 100) / 100,
    totalVendasPrazo: Math.round(totalPrazo * 100) / 100,
    totalSaidasDinheiro: 0,
    totalCancelamentos: Math.round(totalCancelamentos * 100) / 100,
    totalDescontos: Math.round(totalDescontos * 100) / 100,
    numeroVendas: numVendas,
    dinheiroEsperado,
    dinheiroContado: contado,
    diferencaQuebra,
    observacoes,
    status: 'FECHADO',
    createdAt: new Date().toISOString(),
  };

  db.fechamentos.set(fechamentoId, fechamento);
  return { sucesso: true, fechamento };
});

// -------------------------------------------------------------
// ONDA 3: ENTRADA DE ESTOQUE POR XML DE NF-E (F-16)
// -------------------------------------------------------------

server.post('/api/nfe/importar', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Apenas o Dono pode dar entrada de mercadorias por XML de NF-e.' });
  }

  const file = await request.file();
  if (!file) {
    return reply.status(400).send({ error: 'Arquivo XML da NF-e não enviado.' });
  }

  const buffer = await file.toBuffer();
  const xmlConteudo = buffer.toString('utf-8');

  try {
    const dadosNfe = extrairDadosNfeXml(xmlConteudo);

    // CA-03: Recusa duplicar mesma chave de acesso
    if (db.nfeChavesImportadas.has(dadosNfe.chaveAcesso)) {
      return reply.status(400).send({ error: `Esta NF-e (Chave ${dadosNfe.chaveAcesso}) já foi importada anteriormente.` });
    }

    db.nfeChavesImportadas.add(dadosNfe.chaveAcesso);

    // Atualiza estoque e novo custo de reposição dos produtos vinculados por EAN/Código (S5, CA-02)
    const empresaId = request.user.empresaId;
    let itensAtualizados = 0;

    for (const itemXml of dadosNfe.itens) {
      for (const p of db.produtos.values()) {
        if (p.empresaId === empresaId) {
          const matchEan = itemXml.codigoBarrasEan && p.codigoBarras === itemXml.codigoBarrasEan;
          const matchNome = p.nome.toLowerCase() === itemXml.descricao.toLowerCase();

          if (matchEan || matchNome) {
            p.estoqueAtual += itemXml.quantidade;
            p.custoUnitario = itemXml.valorUnitarioCusto; // S5: último custo de entrada
            itensAtualizados++;
            break;
          }
        }
      }
    }

    // CA-06: Gera contas a pagar para os vencimentos do XML
    for (const dup of dadosNfe.duplicatas) {
      const despesaId = crypto.randomUUID();
      db.despesas.set(despesaId, {
        id: despesaId,
        empresaId,
        descricao: `Compra Mercadoria NF ${dadosNfe.numeroNfe} - ${dadosNfe.razaoSocialEmitente}`,
        tipo: 'FIXA',
        categoria: 'MERCADORIA',
        valor: dup.valor,
        dataCompetencia: dadosNfe.dataEmissao,
        dataVencimento: dup.dataVencimento,
        status: 'PENDENTE',
        createdAt: new Date().toISOString(),
      });
    }

    return {
      sucesso: true,
      nfe: dadosNfe,
      itensAtualizadosNoCatalogo: itensAtualizados,
      contasAPagarGeradas: dadosNfe.duplicatas.length,
    };
  } catch (err: any) {
    return reply.status(400).send({ error: err.message || 'Erro ao processar XML de NF-e.' });
  }
});

// -------------------------------------------------------------
// ONDA 3: CONTAS A RECEBER / FIADO (F-18)
// -------------------------------------------------------------

server.get('/api/contas-receber', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Acesso restrito ao Dono.' });
  }

  const empresaId = request.user.empresaId;
  const titulos = Array.from(db.titulosReceber.values()).filter((t) => t.empresaId === empresaId);
  return titulos;
});

server.post('/api/contas-receber/:id/baixar', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Apenas o Dono pode registrar recebimento de fiado.' });
  }

  const { id } = request.params as any;
  const { valorRecebido, formaPagamento } = request.body as any;

  const titulo = db.titulosReceber.get(id);
  if (!titulo || titulo.empresaId !== request.user.empresaId) {
    return reply.status(404).send({ error: 'Título não encontrado.' });
  }

  const valor = Number(valorRecebido);
  if (valor <= 0 || valor > titulo.saldoRestante) {
    return reply.status(400).send({ error: `Valor de recebimento inválido: R$ ${valor}. Saldo devedor: R$ ${titulo.saldoRestante}` });
  }

  titulo.saldoRestante = Math.round((titulo.saldoRestante - valor) * 100) / 100;
  titulo.status = titulo.saldoRestante === 0 ? 'PAGO_TOTAL' : 'PAGO_PARCIAL';
  titulo.historicoRecebimentos.push({
    data: new Date().toISOString(),
    valor,
    formaPagamento: formaPagamento || 'DINHEIRO',
    usuarioId: request.user.userId,
  });

  return { sucesso: true, titulo, mensagem: 'Recebimento registrado com sucesso e adicionado ao fluxo de caixa de hoje.' };
});

// -------------------------------------------------------------
// ONDA 3: SINCRONIZAÇÃO OFFLINE DO PDV (F-27)
// -------------------------------------------------------------

server.post('/api/pdv/sync-offline', { preHandler: [authenticate] }, async (request) => {
  const { vendasOffline } = request.body as any;
  const empresaId = request.user.empresaId;
  const usuarioId = request.user.userId;

  let sincronizadas = 0;
  for (const item of (vendasOffline || [])) {
    const vendaId = item.clientId || crypto.randomUUID();
    // Idempotência: não duplica venda já inserida
    if (db.vendas.has(vendaId)) continue;

    const novaVenda: VendaDTO = {
      id: vendaId,
      empresaId,
      usuarioId,
      origem: 'PDV_NATIVO',
      status: 'CONFIRMADA',
      valorBruto: item.venda.valorBruto,
      valorDesconto: item.venda.valorDesconto || 0,
      valorLiquido: item.venda.valorLiquido,
      formaPagamento: item.venda.formaPagamento,
      dataHoraVenda: item.dataHoraLocal,
      itens: item.venda.itens,
    };

    db.vendas.set(vendaId, novaVenda);
    sincronizadas++;
  }

  return { sucesso: true, sincronizadas };
});

// -------------------------------------------------------------
// DEMAIS ROTAS DA ONDA 1 MANTIDAS (Produtos, Despesas, Indicadores, Precificação, Alertas)
// -------------------------------------------------------------
server.get('/api/produtos', { preHandler: [authenticate] }, async (request) => {
  const empresaId = request.user.empresaId;
  const produtosDaEmpresa: ProdutoDTO[] = [];

  for (const p of db.produtos.values()) {
    if (p.empresaId === empresaId && p.ativo) {
      if (request.user.role === 'OPERADOR') {
        produtosDaEmpresa.push({
          ...p,
          custoUnitario: 0,
          variacoes: p.variacoes?.map((v) => ({ ...v, custoUnitarioProprio: 0, custoEfetivo: 0 })),
        });
      } else {
        produtosDaEmpresa.push(p);
      }
    }
  }

  return produtosDaEmpresa;
});

server.get('/api/despesas', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Acesso negado.' });
  }
  return Array.from(db.despesas.values()).filter((d) => d.empresaId === request.user.empresaId);
});

server.get('/api/indicadores', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Acesso restrito ao Dono.' });
  }

  const empresaId = request.user.empresaId;
  const empresa = db.empresas.get(empresaId);

  const hoje = new Date();
  const inicioMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1).toISOString();
  const fimMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0, 23, 59, 59).toISOString();

  const vendasEmpresa = Array.from(db.vendas.values()).filter((v) => v.empresaId === empresaId);
  const despesasEmpresa = Array.from(db.despesas.values()).filter((d) => d.empresaId === empresaId);
  const produtosEmpresa = Array.from(db.produtos.values()).filter((p) => p.empresaId === empresaId);

  return calcularIndicadores({
    vendas: vendasEmpresa,
    despesas: despesasEmpresa,
    produtos: produtosEmpresa,
    saldoInicialCaixa: empresa?.saldoInicialCaixa || 0,
    diasFuncionamentoMes: empresa?.diasFuncionamentoMes || 26,
    retiradaMensalDono: empresa?.retiradaMensalDono,
    periodoInicio: inicioMes,
    periodoFim: fimMes,
  });
});

server.post('/api/precificacao/calcular', { preHandler: [authenticate] }, async (request, reply) => {
  if (request.user.role !== 'DONO') {
    return reply.status(403).send({ error: 'Acesso restrito ao Dono.' });
  }
  try {
    return calcularPrecificacao(request.body as ParametrosPrecificacao);
  } catch (err: any) {
    return reply.status(400).send({ error: err.message });
  }
});

server.get('/api/alertas', { preHandler: [authenticate] }, async (request) => {
  const empresaId = request.user.empresaId;
  const empresa = db.empresas.get(empresaId);

  const produtosEmpresa = Array.from(db.produtos.values()).filter((p) => p.empresaId === empresaId);
  const vendasEmpresa = Array.from(db.vendas.values()).filter((v) => v.empresaId === empresaId);
  const despesasEmpresa = Array.from(db.despesas.values()).filter((d) => d.empresaId === empresaId);

  const hoje = new Date();
  const inicioMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1).toISOString();
  const fimMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0, 23, 59, 59).toISOString();

  const indicadores = calcularIndicadores({
    vendas: vendasEmpresa,
    despesas: despesasEmpresa,
    produtos: produtosEmpresa,
    saldoInicialCaixa: empresa?.saldoInicialCaixa || 0,
    diasFuncionamentoMes: empresa?.diasFuncionamentoMes || 26,
    retiradaMensalDono: empresa?.retiradaMensalDono,
    periodoInicio: inicioMes,
    periodoFim: fimMes,
  });

  return avaliarAlertas({
    produtos: produtosEmpresa,
    indicadoresAtuais: indicadores,
    limiteDescontoDonoPercentual: empresa?.limiteDescontoOperador || 10,
    diasDecorridosMes: hoje.getUTCDate(),
    totalDiasMes: 30,
  });
});

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.API_HOST || '0.0.0.0';

try {
  await server.listen({ port: PORT, host: HOST });
  console.log(`[ALTHUS SERVER] Rodando na porta http://localhost:${PORT}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
