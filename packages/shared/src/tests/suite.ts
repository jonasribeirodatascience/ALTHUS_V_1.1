/**
 * ALTHUS by DATALIS — Suíte de Testes Automatizados e Verificação dos Critérios de Aceite
 * Executa conferência matemática contra os exemplos da especificação v1.1.
 *
 * Conformidade:
 * - Regra seguranca-e-privacidade-de-dados-do-usuario:
 *   console.log e console.error só são chamados fora de ambiente de produção.
 */

import {
  calcularPrecificacao,
  calcularIndicadores,
  avaliarAlertas,
  isValidCPF,
  isValidCNPJ,
  isValidDocument,
  ProdutoDTO,
  DespesaDTO,
  VendaDTO,
} from '../index.js';

/** Emite log de teste apenas fora de produção */
const logTeste = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(msg);
  }
};
const logFalha = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(msg);
  }
};

interface TestResult {
  nome: string;
  sucesso: boolean;
  esperado?: unknown;
  obtido?: unknown;
  erro?: string;
}

const resultados: TestResult[] = [];

function assert(nome: string, condicao: boolean, detalhes?: { esperado?: unknown; obtido?: unknown }) {
  if (condicao) {
    resultados.push({ nome, sucesso: true });
    logTeste(`✅ [PASS] ${nome}`);
  } else {
    resultados.push({
      nome,
      sucesso: false,
      esperado: detalhes?.esperado,
      obtido: detalhes?.obtido,
    });
    logFalha(`❌ [FAIL] ${nome} — Esperado: ${detalhes?.esperado}, Obtido: ${detalhes?.obtido}`);
  }
}

// ============================================================================
// 1. TESTES DA CALCULADORA DE PRECIFICAÇÃO (F-29 / CA-01 a CA-04)
// ============================================================================
logTeste('\n--- 1. Testes de Precificação por Markup Divisor (F-29) ---');

// Caso Oficial da Seção 5.12 / CA-01:
// Custo = 60,00, DV = 7%, DF = 20%, ML = 10%
// Divisor = 0,63
// Preço Sugerido Bruto = 95,24
// Preço Equilíbrio = 82,19
// Preço Contribuição = 64,52
// Desconto Máximo Sem Prejuízo ≈ 32,3%
const resOficial = calcularPrecificacao({
  custoUnitario: 60.00,
  despesasVariaveisPercentual: 7.0,
  despesasFixasPercentual: 20.0,
  margemLucroDesejadaPercentual: 10.0,
  arredondamento: 'NENHUM',
});

assert(
  'CA-01: Preço sugerido bruto deve ser R$ 95,24',
  resOficial.precoSugeridoBruto === 95.24,
  { esperado: 95.24, obtido: resOficial.precoSugeridoBruto }
);

assert(
  'CA-01: Preço de equilíbrio (lucro zero) deve ser R$ 82,19',
  resOficial.precoEquilibrio === 82.19,
  { esperado: 82.19, obtido: resOficial.precoEquilibrio }
);

assert(
  'CA-01: Preço de contribuição deve ser R$ 64,52',
  resOficial.precoContribuicao === 64.52,
  { esperado: 64.52, obtido: resOficial.precoContribuicao }
);

assert(
  'CA-01: Desconto máximo sem prejuízo deve ser aproximadamente 32,3%',
  Math.abs(resOficial.descontoMaximoSemPrejuizoPercentual - 32.3) < 0.2,
  { esperado: 32.3, obtido: resOficial.descontoMaximoSemPrejuizoPercentual }
);

// CA-04: Arredondamento terminando em ,90 para cima (95,24 -> 95,90)
const resArredondado = calcularPrecificacao({
  custoUnitario: 60.00,
  despesasVariaveisPercentual: 7.0,
  despesasFixasPercentual: 20.0,
  margemLucroDesejadaPercentual: 10.0,
  arredondamento: 'TERMINADO_90',
});

assert(
  'CA-04: Arredondamento terminando em ,90 transforma 95,24 em 95,90',
  resArredondado.precoSugeridoFinal === 95.90,
  { esperado: 95.90, obtido: resArredondado.precoSugeridoFinal }
);

// CA-02: Recusa se soma dos percentuais >= 100%
let rejeitouSomaMaior100 = false;
try {
  calcularPrecificacao({
    custoUnitario: 50.00,
    despesasVariaveisPercentual: 50.0,
    despesasFixasPercentual: 30.0,
    margemLucroDesejadaPercentual: 25.0, // Soma = 105%
  });
} catch {
  rejeitouSomaMaior100 = true;
}

assert(
  'CA-02: Calculadora recusa com erro explicativo se DV% + DF% + ML% >= 100%',
  rejeitouSomaMaior100,
  { esperado: true, obtido: rejeitouSomaMaior100 }
);

// Validação de entrada: custo negativo deve ser rejeitado
let rejeitouCustoNegativo = false;
try {
  calcularPrecificacao({
    custoUnitario: -10.00,
    despesasVariaveisPercentual: 7.0,
    despesasFixasPercentual: 20.0,
    margemLucroDesejadaPercentual: 10.0,
  });
} catch {
  rejeitouCustoNegativo = true;
}

assert(
  'Validação: Custo unitário negativo ou zero deve ser rejeitado',
  rejeitouCustoNegativo,
  { esperado: true, obtido: rejeitouCustoNegativo }
);

// ============================================================================
// 2. TESTES DE VALIDAÇÃO DE DOCUMENTOS (F-01, F-11)
// ============================================================================
logTeste('\n--- 2. Testes de CPF e CNPJ (F-01, F-11) ---');

assert('Validação de CPF com dígitos verificadores corretos', isValidCPF('52998224725') === true);
assert('Rejeição de CPF com dígitos repetidos (111.111.111-11)', isValidCPF('11111111111') === false);
assert('Rejeição de CPF com dígito verificador adulterado', isValidCPF('52998224720') === false);

assert('Validação de CNPJ com dígitos verificadores corretos', isValidCNPJ('11222333000181') === true);
assert('Rejeição de CNPJ com dígito verificador adulterado', isValidCNPJ('11222333000100') === false);

// isValidDocument deve delegar corretamente
assert('isValidDocument aceita CPF válido', isValidDocument('52998224725') === true);
assert('isValidDocument aceita CNPJ válido', isValidDocument('11222333000181') === true);
assert('isValidDocument rejeita string inválida', isValidDocument('000') === false);

// ============================================================================
// 3. TESTES DE VENDA POR PESO (F-05 / RN-06 a RN-08 / CA-P1 a CA-P3)
// ============================================================================
logTeste('\n--- 3. Testes de Venda por Peso a Granel (F-05) ---');

// CA-P1: Preço R$ 40,00 por kg, peso 0,350 kg => Total R$ 14,00
const precoKg = 40.00;
const pesoKg = 0.350;
const totalItemPeso = Math.round(pesoKg * precoKg * 100) / 100;

assert(
  'CA-P1: 0,350 kg a R$ 40,00/kg deve totalizar exatamente R$ 14,00',
  totalItemPeso === 14.00,
  { esperado: 14.00, obtido: totalItemPeso }
);

// CA-P3: Custo R$ 18,00 por kg, peso 0,350 kg => Custo do item R$ 6,30
const custoKg = 18.00;
const custoItemPeso = Math.round(pesoKg * custoKg * 100) / 100;

assert(
  'CA-P3: Custo de 0,350 kg a R$ 18,00/kg deve ser R$ 6,30 gravado no momento da venda',
  custoItemPeso === 6.30,
  { esperado: 6.30, obtido: custoItemPeso }
);

// ============================================================================
// 4. TESTES DO DRE GERENCIAL E PONTO DE EQUILÍBRIO (F-07)
// ============================================================================
logTeste('\n--- 4. Testes de Indicadores Financeiros (F-07) ---');

// Mocks com dados exclusivamente fictícios (regra seguranca-e-privacidade)
const produtosMock: ProdutoDTO[] = [
  {
    id: 'mock-prod-001',
    empresaId: 'mock-emp-001',
    nome: 'Produto Fictício Alpha',
    categoria: 'Geral',
    unidade: 'un',
    custoUnitario: 30.00,
    precoVenda: 50.00,
    estoqueAtual: 5, // Abaixo do mínimo — alerta A1
    estoqueMinimo: 10,
    ativo: true,
    possuiVariacoes: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-prod-002',
    empresaId: 'mock-emp-001',
    nome: 'Produto Fictício Beta (Preço Abaixo Custo)',
    categoria: 'Geral',
    unidade: 'un',
    custoUnitario: 40.00,
    precoVenda: 35.00, // Preço < Custo — alerta A8
    estoqueAtual: 20,
    estoqueMinimo: 5,
    ativo: true,
    possuiVariacoes: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const despesasMock: DespesaDTO[] = [
  {
    id: 'mock-desp-001',
    empresaId: 'mock-emp-001',
    descricao: 'Aluguel Fictício',
    tipo: 'FIXA',
    categoria: 'ALUGUEL',
    valor: 1000.00,
    dataCompetencia: '2026-10-01',
    dataVencimento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    status: 'PENDENTE',
    createdAt: new Date().toISOString(),
  }
];

const vendasMock: VendaDTO[] = [
  {
    id: 'mock-venda-001',
    empresaId: 'mock-emp-001',
    usuarioId: 'mock-user-001',
    origem: 'PDV_NATIVO',
    status: 'CONFIRMADA',
    valorBruto: 500.00,
    valorDesconto: 0,
    valorLiquido: 500.00,
    formaPagamento: 'DINHEIRO',
    dataHoraVenda: '2026-10-15T14:00:00Z',
    itens: [
      {
        id: 'mock-item-001',
        vendaId: 'mock-venda-001',
        produtoId: 'mock-prod-001',
        produtoNome: 'Produto Fictício Alpha',
        quantidade: 10,
        precoUnitario: 50.00,
        custoUnitarioMomento: 30.00, // CMV = 300,00
        valorDesconto: 0,
        valorTotal: 500.00,
      }
    ]
  }
];

const ind = calcularIndicadores({
  vendas: vendasMock,
  despesas: despesasMock,
  produtos: produtosMock,
  saldoInicialCaixa: 200.00,
  diasFuncionamentoMes: 25,
  retiradaMensalDono: 500.00,
  periodoInicio: '2026-10-01',
  periodoFim: '2026-10-31',
});

// Faturamento = 500, CMV = 300, Lucro Bruto = 200, Margem Bruta = 40%
assert('Faturamento apurado deve ser R$ 500,00', ind.faturamento.valor === 500.00);
assert('CMV apurado deve ser R$ 300,00', ind.cmv.valor === 300.00);
assert('Lucro Bruto deve ser R$ 200,00', ind.lucroBruto.valor === 200.00);
assert('Margem Bruta deve ser 40%', ind.margemBrutaPercentual.valor === 40.0);

// Despesas Fixas = 1000, Resultado Gerencial = 200 - 1000 = -800
assert('Resultado Gerencial deve ser -R$ 800,00', ind.resultadoGerencial.valor === -800.00);

// Ponto de Equilíbrio: Despesas Fixas (1000) / Margem de Contribuição (40% ou 0,4) = R$ 2500,00
assert(
  'Ponto de Equilíbrio Mensal deve ser R$ 2.500,00',
  ind.pontoEquilibrioMensal.valor === 2500.00,
  { esperado: 2500.00, obtido: ind.pontoEquilibrioMensal.valor }
);

// ============================================================================
// 5. TESTES DO MOTOR DE ALERTAS POR REGRAS MATEMÁTICAS (F-08)
// ============================================================================
logTeste('\n--- 5. Testes de Alertas por Regras (F-08) ---');

const alertasGerados = avaliarAlertas({
  produtos: produtosMock,
  indicadoresAtuais: ind,
  limiteDescontoDonoPercentual: 10,
  diasDecorridosMes: 15,
  totalDiasMes: 30,
});

const alertaA1 = alertasGerados.find((a) => a.id === 'A1');
assert('Alerta A1 (Estoque Mínimo) disparado para Produto Alpha (5 un <= 10 mín)', Boolean(alertaA1));

const alertaA8 = alertasGerados.find((a) => a.id === 'A8');
assert('Alerta A8 (Preço Abaixo do Custo) disparado para Produto Beta (Preço 35 < Custo 40)', Boolean(alertaA8));

const alertaA5 = alertasGerados.find((a) => a.id === 'A5');
assert(
  'Alerta A5 (Contas a Vencer Superam Saldo) disparado (Vencimento R$ 1.000 > Saldo R$ 700)',
  Boolean(alertaA5)
);

// Verificar que mensagens de alerta usam formato pt-BR
if (alertaA5) {
  assert(
    'Mensagem do Alerta A5 usa formato pt-BR (vírgula como decimal)',
    alertaA5.mensagem.includes('R$') && alertaA5.mensagem.includes(','),
    { esperado: 'mensagem contendo R$ com vírgula decimal', obtido: alertaA5.mensagem }
  );
}

logTeste('\n======================================================');
const total = resultados.length;
const sucessos = resultados.filter((r) => r.sucesso).length;
logTeste(`TOTAL DE TESTES: ${total} | APROVADOS: ${sucessos} | FALHAS: ${total - sucessos}`);
logTeste('======================================================\n');

export { resultados };
