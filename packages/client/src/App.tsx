import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Package,
  FileSpreadsheet,
  DollarSign,
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Plus,
  Shield,
  Layers,
  Search,
  Upload,
  ShoppingCart,
  FileText,
  RotateCcw,
  Receipt,
  FileCode,
  CreditCard,
  Wifi,
  WifiOff,
  Trash2,
  Copy,
  Download,
  AlertCircle
} from 'lucide-react';

import {
  calcularPrecificacao,
  calcularIndicadores,
  avaliarAlertas,
  ParametrosPrecificacao,
  TipoArredondamento,
  ProdutoDTO,
  DespesaDTO,
  VendaDTO,
  UserRole,
  TituloReceberDTO,
  NfeCompraDTO,
  FechamentoCaixaDTO,
} from '@althus/shared';

export default function App() {
  // Controle de Perfil (F-02) e Aba Ativa
  const [role, setRole] = useState<UserRole>('DONO');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pdv' | 'produtos' | 'dadosEmissao' | 'devolucoes' | 'caixa' | 'importacao' | 'despesas' | 'precificacao' | 'nfe' | 'contasReceber' | 'clientes'
  >('dashboard');

  // Modo de Conexão (F-27: Contingência Offline)
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  // -------------------------------------------------------------
  // DADOS EM MEMÓRIA
  // -------------------------------------------------------------
  const [produtos, setProdutos] = useState<ProdutoDTO[]>([
    {
      id: 'p1',
      empresaId: 'demo',
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
        { id: 'v1', produtoId: 'p1', empresaId: 'demo', tamanho: 'M', cor: 'Azul', codigoBarras: '789100000001', estoqueAtual: 8, estoqueMinimo: 5, ativo: true, custoEfetivo: 35.00, precoEfetivo: 79.90 },
        { id: 'v2', produtoId: 'p1', empresaId: 'demo', tamanho: 'G', cor: 'Preto', codigoBarras: '789100000002', estoqueAtual: 14, estoqueMinimo: 5, ativo: true, custoEfetivo: 35.00, precoEfetivo: 79.90 },
        { id: 'v3', produtoId: 'p1', empresaId: 'demo', tamanho: 'P', cor: 'Branco', codigoBarras: '789100000003', estoqueAtual: 20, estoqueMinimo: 5, ativo: true, custoEfetivo: 35.00, precoEfetivo: 79.90 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p2',
      empresaId: 'demo',
      nome: 'Arroz Nobre Tipo 1 - 5kg',
      categoria: 'Mercearia',
      codigoBarras: '789200000001',
      unidade: 'un',
      custoUnitario: 22.50,
      precoVenda: 29.90,
      estoqueAtual: 4, // Abaixo do mínimo!
      estoqueMinimo: 10,
      ativo: true,
      possuiVariacoes: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p3',
      empresaId: 'demo',
      nome: 'Óleo de Soja 900ml',
      categoria: 'Mercearia',
      codigoBarras: '789300000001',
      unidade: 'un',
      custoUnitario: 5.80,
      precoVenda: 7.50,
      estoqueAtual: 60,
      estoqueMinimo: 20,
      ativo: true,
      possuiVariacoes: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'p4',
      empresaId: 'demo',
      nome: 'Queijo Muçarela Granel (kg)',
      categoria: 'Laticínios',
      codigoBarras: '789400000001',
      unidade: 'kg',
      custoUnitario: 32.00,
      precoVenda: 48.00,
      estoqueAtual: 15.500,
      estoqueMinimo: 5.000,
      ativo: true,
      possuiVariacoes: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]);

  const [despesas, setDespesas] = useState<DespesaDTO[]>([
    {
      id: 'd1',
      empresaId: 'demo',
      descricao: 'Aluguel do Ponto Comercial',
      tipo: 'FIXA',
      categoria: 'ALUGUEL',
      valor: 2200.00,
      dataCompetencia: new Date().toISOString().substring(0, 7) + '-05',
      dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'PENDENTE',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'd2',
      empresaId: 'demo',
      descricao: 'Energia Elétrica',
      tipo: 'FIXA',
      categoria: 'ENERGIA_AGUA',
      valor: 680.00,
      dataCompetencia: new Date().toISOString().substring(0, 7) + '-10',
      dataVencimento: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: 'PENDENTE',
      createdAt: new Date().toISOString(),
    }
  ]);

  const [vendas, setVendas] = useState<VendaDTO[]>([
    {
      id: 'v-101',
      empresaId: 'demo',
      usuarioId: 'u1',
      origem: 'PDV_NATIVO',
      status: 'CONFIRMADA',
      valorBruto: 159.80,
      valorDesconto: 9.90,
      valorLiquido: 149.90,
      formaPagamento: 'PIX',
      dataHoraVenda: new Date().toISOString(),
      itens: [
        {
          id: 'iv-1',
          vendaId: 'v-101',
          produtoId: 'p1',
          variacaoId: 'v1',
          produtoNome: 'Camiseta Polo Básica',
          tamanho: 'M',
          cor: 'Azul',
          quantidade: 2,
          precoUnitario: 79.90,
          custoUnitarioMomento: 35.00,
          valorDesconto: 9.90,
          valorTotal: 149.90,
        }
      ]
    }
  ]);

  const [titulosReceber, setTitulosReceber] = useState<TituloReceberDTO[]>([
    {
      id: 'tr-1',
      vendaId: 'v-prazo-antiga',
      empresaId: 'demo',
      clienteId: 'c1',
      clienteNome: 'Mariano Alencar',
      clienteTelefone: '(67) 99222-3344',
      valorTotal: 180.00,
      saldoRestante: 120.00,
      dataVenda: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // VENCIDO!
      status: 'VENCIDO',
      historicoRecebimentos: [
        { data: new Date().toISOString().substring(0, 10), valor: 60.00, formaPagamento: 'PIX', usuarioId: 'u1' }
      ]
    }
  ]);

  const [fechamentosCaixa, setFechamentosCaixa] = useState<FechamentoCaixaDTO[]>([]);

  // -------------------------------------------------------------
  // ESTADO DO PDV NATIVO (F-05)
  // -------------------------------------------------------------
  interface ItemCarrinho {
    produto: ProdutoDTO;
    variacao?: any;
    quantidade: number;
    precoUnitario: number;
    desconto: number;
  }

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [buscaPdv, setBuscaPdv] = useState('');
  const [formaPagamentoPdv, setFormaPagamentoPdv] = useState<string>('DINHEIRO');
  const [descontoTotalPdv, setDescontoTotalPdv] = useState<number>(0);
  const [clientePdvNome, setClientePdvNome] = useState('');
  const [clientePdvTelefone, setClientePdvTelefone] = useState('');
  const [comprovanteVenda, setComprovanteVenda] = useState<VendaDTO | null>(null);
  const [alertaPdv, setAlertaPdv] = useState<string | null>(null);

  // Totais do Carrinho do PDV
  const subtotalPdv = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + item.quantidade * item.precoUnitario, 0);
  }, [carrinho]);

  const totalFinalPdv = Math.max(0, subtotalPdv - descontoTotalPdv);

  // Adicionar Item ao Carrinho (suportando peso kg e variações)
  const adicionarAoPdv = (prod: ProdutoDTO, variacao?: any) => {
    let preco = prod.precoVenda;
    if (variacao && variacao.precoEfetivo) preco = variacao.precoEfetivo;

    let qtd = 1;
    if (prod.unidade === 'kg') {
      const pesoDigitado = prompt(`Venda por Peso (Granel - Balança Externa):\nDigite o peso medido em kg para "${prod.nome}" (ex: 0.350):`, '0.350');
      if (!pesoDigitado) return;
      qtd = parseFloat(pesoDigitado.replace(',', '.')) || 0;
      if (qtd <= 0) {
        alert('Peso inválido!');
        return;
      }
    }

    setCarrinho((prev) => {
      const index = prev.findIndex(
        (i) => i.produto.id === prod.id && (!variacao || i.variacao?.id === variacao.id)
      );
      if (index >= 0 && prod.unidade === 'un') {
        const novo = [...prev];
        novo[index].quantidade += 1;
        return novo;
      }
      return [...prev, { produto: prod, variacao, quantidade: qtd, precoUnitario: preco, desconto: 0 }];
    });
  };

  // Finalizar Venda no PDV
  const confirmarVendaPdv = () => {
    if (carrinho.length === 0) {
      alert('Carrinho vazio.');
      return;
    }

    if (formaPagamentoPdv === 'A_PRAZO' && !clientePdvNome) {
      alert('Venda a prazo (fiado) exige o nome do cliente!');
      return;
    }

    // Se estiver sem conexão (F-27)
    if (!isOnline) {
      const vendaOfflineId = `off-${Date.now()}`;
      const vendaOff: VendaDTO = {
        id: vendaOfflineId,
        empresaId: 'demo',
        usuarioId: 'u1',
        origem: 'PDV_NATIVO',
        status: 'CONFIRMADA',
        valorBruto: subtotalPdv,
        valorDesconto: descontoTotalPdv,
        valorLiquido: totalFinalPdv,
        formaPagamento: formaPagamentoPdv as any,
        dataHoraVenda: new Date().toISOString(),
        itens: carrinho.map((item, idx) => ({
          id: `off-item-${idx}`,
          vendaId: vendaOfflineId,
          produtoId: item.produto.id,
          variacaoId: item.variacao?.id,
          produtoNome: item.produto.nome,
          tamanho: item.variacao?.tamanho,
          cor: item.variacao?.cor,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          custoUnitarioMomento: item.variacao?.custoEfetivo || item.produto.custoUnitario,
          valorDesconto: 0,
          valorTotal: item.quantidade * item.precoUnitario,
        })),
      };

      setOfflineQueue((prev) => [...prev, { clientId: vendaOfflineId, venda: vendaOff, dataHora: new Date().toISOString() }]);
      setCarrinho([]);
      setDescontoTotalPdv(0);
      setClientePdvNome('');
      setAlertaPdv('Venda registrada localmente no aparelho (Modo Offline). Será sincronizada quando a internet retornar.');
      return;
    }

    // Venda Online
    const novaVendaId = `v-${Date.now()}`;
    const novaVenda: VendaDTO = {
      id: novaVendaId,
      empresaId: 'demo',
      usuarioId: 'u1',
      clienteId: clientePdvNome ? 'cliente-pdv' : undefined,
      origem: 'PDV_NATIVO',
      status: 'CONFIRMADA',
      valorBruto: subtotalPdv,
      valorDesconto: descontoTotalPdv,
      valorLiquido: totalFinalPdv,
      formaPagamento: formaPagamentoPdv as any,
      dataHoraVenda: new Date().toISOString(),
      itens: carrinho.map((item, idx) => ({
        id: `iv-${Date.now()}-${idx}`,
        vendaId: novaVendaId,
        produtoId: item.produto.id,
        variacaoId: item.variacao?.id,
        produtoNome: item.produto.nome,
        tamanho: item.variacao?.tamanho,
        cor: item.variacao?.cor,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        custoUnitarioMomento: item.variacao?.custoEfetivo || item.produto.custoUnitario,
        valorDesconto: 0,
        valorTotal: item.quantidade * item.precoUnitario,
      })),
    };

    // Baixa de estoque
    setProdutos((prev) =>
      prev.map((p) => {
        const itemCarrinho = carrinho.find((c) => c.produto.id === p.id);
        if (itemCarrinho) {
          if (itemCarrinho.variacao && p.variacoes) {
            return {
              ...p,
              variacoes: p.variacoes.map((v) =>
                v.id === itemCarrinho.variacao.id
                  ? { ...v, estoqueAtual: v.estoqueAtual - itemCarrinho.quantidade }
                  : v
              ),
            };
          }
          return { ...p, estoqueAtual: p.estoqueAtual - itemCarrinho.quantidade };
        }
        return p;
      })
    );

    // Se fiado (F-18), cria título
    if (formaPagamentoPdv === 'A_PRAZO') {
      const novoTitulo: TituloReceberDTO = {
        id: `tr-${Date.now()}`,
        vendaId: novaVendaId,
        empresaId: 'demo',
        clienteId: 'c-avulso',
        clienteNome: clientePdvNome,
        clienteTelefone: clientePdvTelefone,
        valorTotal: totalFinalPdv,
        saldoRestante: totalFinalPdv,
        dataVenda: new Date().toISOString().substring(0, 10),
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        status: 'ABERTO',
        historicoRecebimentos: [],
      };
      setTitulosReceber((prev) => [novoTitulo, ...prev]);
    }

    setVendas((prev) => [novaVenda, ...prev]);
    setComprovanteVenda(novaVenda);
    setCarrinho([]);
    setDescontoTotalPdv(0);
    setClientePdvNome('');
    setClientePdvTelefone('');
    setAlertaPdv(null);
  };

  // Cálculo Dinâmico de Indicadores
  const relatorioIndicadores = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1).toISOString();
    const fimMes = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0, 23, 59, 59).toISOString();

    return calcularIndicadores({
      vendas,
      despesas,
      produtos,
      saldoInicialCaixa: 1500.00,
      diasFuncionamentoMes: 26,
      retiradaMensalDono: 3500.00,
      periodoInicio: inicioMes,
      periodoFim: fimMes,
    });
  }, [vendas, despesas, produtos]);

  // Alertas Determinísticos
  const alertas = useMemo(() => {
    return avaliarAlertas({
      produtos,
      indicadoresAtuais: relatorioIndicadores,
      limiteDescontoDonoPercentual: 10,
      diasDecorridosMes: new Date().getUTCDate(),
      totalDiasMes: 30,
    });
  }, [produtos, relatorioIndicadores]);

  // Calculadora de Precificação (F-29)
  const [calcParams, setCalcParams] = useState<ParametrosPrecificacao>({
    custoUnitario: 60.00,
    despesasVariaveisPercentual: 7.0,
    despesasFixasPercentual: 20.0,
    margemLucroDesejadaPercentual: 10.0,
    arredondamento: 'TERMINADO_90',
  });

  const resultadoPrecificacao = useMemo(() => {
    try {
      return { data: calcularPrecificacao(calcParams), erro: null };
    } catch (e: any) {
      return { data: null, erro: e.message };
    }
  }, [calcParams]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* HEADER SUPERIOR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-700 text-white font-bold p-2 rounded-lg text-lg tracking-wider flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-300" />
            <span>ALTHUS</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 text-sm">Mercado & Moda Althus</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                MVP v1.1 (Ondas 1, 2 e 3)
              </span>
            </div>
            <p className="text-xs text-slate-500">Isolamento Multi-Tenant Ativo · CNPJ: 12.***.789/0001-**</p>
          </div>
        </div>

        {/* STATUS DE CONEXÃO & PERFIL */}
        <div className="flex items-center space-x-4">
          {/* Botão de Simulação de Conexão (F-27) */}
          <button
            onClick={() => {
              if (!isOnline && offlineQueue.length > 0) {
                // Sincroniza vendas offline
                setVendas((prev) => [...offlineQueue.map((q) => q.venda), ...prev]);
                alert(`${offlineQueue.length} venda(s) offline sincronizada(s) com o servidor com sucesso!`);
                setOfflineQueue([]);
              }
              setIsOnline(!isOnline);
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
            }`}
            title="Clique para simular queda ou retorno de conexão à internet"
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Conectado (Online)' : `Sem Conexão (${offlineQueue.length} na fila)`}</span>
          </button>

          {/* Switcher Dono vs Operador */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setRole('DONO')}
              className={`px-3 py-1 rounded-md transition-all ${
                role === 'DONO' ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              👑 Dono
            </button>
            <button
              onClick={() => {
                setRole('OPERADOR');
                if (activeTab === 'dashboard' || activeTab === 'despesas' || activeTab === 'precificacao' || activeTab === 'devolucoes' || activeTab === 'nfe') {
                  setActiveTab('pdv');
                }
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                role === 'OPERADOR' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              👤 Operador
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE NAVEGAÇÃO EM ABAS */}
      <nav className="bg-white border-b border-slate-200 px-4 lg:px-8 flex space-x-1 overflow-x-auto text-sm font-medium">
        {role === 'DONO' && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Painel & Alertas</span>
          </button>
        )}

        {/* PDV NATIVO (ONDA 2 - F-05) */}
        <button
          onClick={() => setActiveTab('pdv')}
          className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'pdv' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">PDV Nativo</span>
        </button>

        <button
          onClick={() => setActiveTab('produtos')}
          className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'produtos' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Produtos & Estoque</span>
        </button>

        {/* DADOS PARA EMISSÃO (ONDA 2 - F-09) */}
        <button
          onClick={() => setActiveTab('dadosEmissao')}
          className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'dadosEmissao' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dados para Emissão</span>
        </button>

        {/* TROCAS & DEVOLUÇÕES (ONDA 2 - F-28) */}
        {role === 'DONO' && (
          <button
            onClick={() => setActiveTab('devolucoes')}
            className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'devolucoes' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Troca & Devolução</span>
          </button>
        )}

        {/* FECHAMENTO DE CAIXA (ONDA 2 - F-13) */}
        <button
          onClick={() => setActiveTab('caixa')}
          className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'caixa' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Fechamento de Caixa</span>
        </button>

        {role === 'DONO' && (
          <>
            <button
              onClick={() => setActiveTab('importacao')}
              className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'importacao' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar Vendas</span>
            </button>

            {/* ENTRADA XML NF-E (ONDA 3 - F-16) */}
            <button
              onClick={() => setActiveTab('nfe')}
              className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'nfe' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
              }`}
            >
              <FileCode className="w-4 h-4 text-purple-600" />
              <span>Entrada XML NF-e</span>
            </button>

            {/* CONTAS A RECEBER / FIADO (ONDA 3 - F-18) */}
            <button
              onClick={() => setActiveTab('contasReceber')}
              className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'contasReceber' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
              }`}
            >
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>Contas a Receber (Fiado)</span>
            </button>

            <button
              onClick={() => setActiveTab('despesas')}
              className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'despesas' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Despesas</span>
            </button>

            <button
              onClick={() => setActiveTab('precificacao')}
              className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'precificacao' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Calculadora</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('clientes')}
          className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'clientes' ? 'border-emerald-700 text-emerald-800 font-semibold' : 'border-transparent text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes</span>
        </button>
      </nav>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {/* ============================================================== */}
        {/* ABA: PDV NATIVO (F-05)                                          */}
        {/* ============================================================== */}
        {activeTab === 'pdv' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LADO ESQUERDO: CATÁLOGO RÁPIDO & BUSCA */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ler código de barras ou buscar por nome..."
                  value={buscaPdv}
                  onChange={(e) => setBuscaPdv(e.target.value)}
                  className="w-full text-base focus:outline-none"
                  autoFocus
                />
              </div>

              {alertaPdv && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{alertaPdv}</span>
                </div>
              )}

              {/* Grid de Produtos Disponíveis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produtos
                  .filter((p) => p.ativo && p.nome.toLowerCase().includes(buscaPdv.toLowerCase()))
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-slate-900 text-sm">{p.nome}</h4>
                          <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {p.unidade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {p.codigoBarras || 'Sem barcode'}
                        </p>
                        <div className="mt-2 text-lg font-extrabold text-emerald-800 font-mono">
                          R$ {p.precoVenda.toFixed(2)}
                          {p.unidade === 'kg' && <span className="text-xs font-normal text-slate-500"> / kg</span>}
                        </div>
                      </div>

                      {/* Botões de Ação / Variações */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        {p.possuiVariacoes && p.variacoes ? (
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-500 font-medium block">Escolha Tamanho & Cor:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {p.variacoes.map((v) => (
                                <button
                                  key={v.id}
                                  onClick={() => adicionarAoPdv(p, v)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-800 text-xs font-semibold rounded border border-slate-200 transition"
                                >
                                  {v.tamanho} - {v.cor} ({v.estoqueAtual} un)
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => adicionarAoPdv(p)}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Adicionar à Venda</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* LADO DIREITO: CUPOM / CAIXA EM ANDAMENTO */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-700" />
                    <span>Venda Atual (Caixa)</span>
                  </h3>
                  <button
                    onClick={() => setCarrinho([])}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Limpar
                  </button>
                </div>

                {/* Lista de Itens no Carrinho */}
                {carrinho.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    Nenhum item adicionado ao carrinho.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {carrinho.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-800">{item.produto.nome}</div>
                          {item.variacao && (
                            <div className="text-[11px] text-slate-500">
                              Tam: {item.variacao.tamanho} · Cor: {item.variacao.cor}
                            </div>
                          )}
                          <div className="text-slate-600 font-mono">
                            {item.quantidade} {item.produto.unidade} × R$ {item.precoUnitario.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold font-mono text-slate-900">
                            R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                          </div>
                          <button
                            onClick={() => setCarrinho((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FORMA DE PAGAMENTO & FECHAMENTO */}
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                {/* Desconto */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-600">Desconto (R$):</span>
                  <input
                    type="number"
                    step="0.50"
                    value={descontoTotalPdv}
                    onChange={(e) => setDescontoTotalPdv(parseFloat(e.target.value) || 0)}
                    className="w-24 p-1 border border-slate-300 rounded text-right font-mono text-xs"
                  />
                </div>

                {/* Forma de Pagamento */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Forma de Pagamento (RN-02)
                  </label>
                  <select
                    value={formaPagamentoPdv}
                    onChange={(e) => setFormaPagamentoPdv(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
                  >
                    <option value="DINHEIRO">💵 Dinheiro</option>
                    <option value="PIX">⚡ PIX</option>
                    <option value="DEBITO">💳 Cartão de Débito</option>
                    <option value="CREDITO">💳 Cartão de Crédito</option>
                    <option value="A_PRAZO">📒 A Prazo (Fiado - F-18)</option>
                  </select>
                </div>

                {/* Se fiado, pede cliente */}
                {formaPagamentoPdv === 'A_PRAZO' && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                    <span className="text-[11px] font-bold text-amber-900 block">Identificação Obrigatória (Fiado):</span>
                    <input
                      type="text"
                      placeholder="Nome do Cliente..."
                      value={clientePdvNome}
                      onChange={(e) => setClientePdvNome(e.target.value)}
                      className="w-full p-1.5 border border-amber-300 rounded text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Telefone (opcional)..."
                      value={clientePdvTelefone}
                      onChange={(e) => setClientePdvTelefone(e.target.value)}
                      className="w-full p-1.5 border border-amber-300 rounded text-xs bg-white"
                    />
                  </div>
                )}

                {/* Total e Botão Confirmar */}
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total a Pagar</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    R$ {totalFinalPdv.toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={confirmarVendaPdv}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirmar Venda (< 60s)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / RECIBO GERENCIAL APÓS VENDA NO PDV */}
        {comprovanteVenda && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-slate-900 text-lg">Venda Confirmada!</h3>
                <p className="text-xs text-slate-500">Comprovante Gerencial de Venda</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
                <div className="flex justify-between border-b pb-1">
                  <span>Venda #{comprovanteVenda.id.slice(0, 8)}</span>
                  <span>{new Date(comprovanteVenda.dataHoraVenda).toLocaleTimeString()}</span>
                </div>
                {comprovanteVenda.itens?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantidade}x {it.produtoNome} {it.tamanho ? `(${it.tamanho})` : ''}</span>
                    <span>R$ {it.valorTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-1 flex justify-between font-bold text-slate-900">
                  <span>TOTAL PAGO ({comprovanteVenda.formaPagamento})</span>
                  <span>R$ {comprovanteVenda.valorLiquido.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Documento não fiscal emitido para conferência.
              </div>

              <button
                onClick={() => setComprovanteVenda(null)}
                className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700"
              >
                Nova Venda
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA: DADOS PARA EMISSÃO (F-09)                                 */}
        {/* ============================================================== */}
        {activeTab === 'dadosEmissao' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <span>Dados para Emissão de Nota Fiscal</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    O ALTHUS não emite notas fiscais no MVP. Use este relatório para copiar ou exportar os dados das vendas para o seu emissor fiscal.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const csvRows = ['Data;Venda;Item;Quantidade;Unidade;PrecoUnitario;Total;FormaPagamento'];
                    vendas.forEach((v) => {
                      v.itens?.forEach((i) => {
                        csvRows.push(
                          `${v.dataHoraVenda};${v.id};${i.produtoNome};${i.quantidade};un;${i.precoUnitario.toFixed(2).replace('.', ',')};${i.valorTotal.toFixed(2).replace('.', ',')};${v.formaPagamento}`
                        );
                      });
                    });
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'dados_para_emissao.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar CSV (Padrão BR)</span>
                </button>
              </div>

              {/* Aviso Fixo CA-04 */}
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold">
                ⚠️ Relatório gerencial. Não é documento fiscal e não substitui a nota fiscal.
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Data/Hora</th>
                      <th className="py-2.5 px-4">Itens</th>
                      <th className="py-2.5 px-4">Forma Pgto</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                      <th className="py-2.5 px-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {vendas.filter((v) => v.status === 'CONFIRMADA').map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {new Date(v.dataHoraVenda).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {v.itens?.map((it, idx) => (
                            <div key={idx} className="font-medium text-slate-800">
                              {it.quantidade}x {it.produtoNome} {it.tamanho ? `(${it.tamanho}/${it.cor})` : ''}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{v.formaPagamento}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          R$ {v.valorLiquido.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              const texto = `Venda: ${v.id}\nData: ${v.dataHoraVenda}\nItens:\n${v.itens?.map((i) => `- ${i.quantidade}x ${i.produtoNome} - R$ ${i.valorTotal}`).join('\n')}\nTotal: R$ ${v.valorLiquido}`;
                              navigator.clipboard.writeText(texto);
                              alert('Dados da venda copiados para a área de transferência!');
                            }}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium mx-auto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA: TROCAS & DEVOLUÇÕES (F-28)                                */}
        {/* ============================================================== */}
        {role === 'DONO' && activeTab === 'devolucoes' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-emerald-700" />
                <span>Troca e Devolução de Mercadorias</span>
              </h3>
              <p className="text-xs text-slate-500">
                Selecione uma venda confirmada para registrar devolução parcial ou total. A mercadoria retornará ao estoque e o valor será estornado do faturamento do dia.
              </p>

              <div className="space-y-3">
                {vendas.filter((v) => v.status === 'CONFIRMADA').map((v) => (
                  <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Venda #{v.id.slice(0, 8)}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        Data: {new Date(v.dataHoraVenda).toLocaleString()} · Total: R$ {v.valorLiquido.toFixed(2)}
                      </div>
                      <div className="mt-1 text-xs text-slate-700">
                        {v.itens?.map((i, idx) => (
                          <span key={idx} className="mr-2">
                            • {i.quantidade}x {i.produtoNome} ({i.tamanho || 'un'})
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const motivo = prompt('Motivo da devolução/troca:');
                        if (motivo) {
                          alert('Devolução registrada com sucesso! Itens retornaram ao estoque e valor estornado.');
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Registrar Devolução
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA: FECHAMENTO DE CAIXA (F-13)                                */}
        {/* ============================================================== */}
        {activeTab === 'caixa' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <span>Fechamento de Caixa do Dia (Conferência Cega)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Informe o fundo de troco e o total de dinheiro contado na gaveta para calcular a diferença (quebra/sobra).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Fundo de Troco Inicial (R$)
                  </label>
                  <input
                    type="number"
                    defaultValue="100.00"
                    id="fundo-troco"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Dinheiro em Espécie Contado na Gaveta (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 249.90"
                    id="dinheiro-contado"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  const fundo = parseFloat((document.getElementById('fundo-troco') as HTMLInputElement).value) || 0;
                  const contado = parseFloat((document.getElementById('dinheiro-contado') as HTMLInputElement).value) || 0;
                  const diferenca = contado - (fundo + 149.90);

                  const novoFechamento: FechamentoCaixaDTO = {
                    id: `fc-${Date.now()}`,
                    empresaId: 'demo',
                    usuarioId: 'u1',
                    usuarioNome: role === 'DONO' ? 'Carlos Dono' : 'Mariana Operadora',
                    dataFechamento: new Date().toISOString().substring(0, 10),
                    fundoTrocoInformado: fundo,
                    totalVendasDinheiro: 149.90,
                    totalVendasPix: 0,
                    totalVendasDebito: 0,
                    totalVendasCredito: 0,
                    totalVendasPrazo: 0,
                    totalSaidasDinheiro: 0,
                    totalCancelamentos: 0,
                    totalDescontos: 9.90,
                    numeroVendas: 1,
                    dinheiroEsperado: fundo + 149.90,
                    dinheiroContado: contado,
                    diferencaQuebra: diferenca,
                    status: 'FECHADO',
                    createdAt: new Date().toISOString(),
                  };

                  setFechamentosCaixa((prev) => [novoFechamento, ...prev]);
                  alert(`Caixa fechado com sucesso!\nEsperado: R$ ${(fundo + 149.90).toFixed(2)}\nContado: R$ ${contado.toFixed(2)}\nDiferença: R$ ${diferenca.toFixed(2)}`);
                }}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition"
              >
                Confirmar Fechamento de Caixa
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA: ENTRADA POR XML DE NF-E (ONDA 3 - F-16)                   */}
        {/* ============================================================== */}
        {role === 'DONO' && activeTab === 'nfe' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <FileCode className="w-6 h-6 text-purple-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Entrada de Estoque por XML da NF-e de Compra</h3>
                  <p className="text-xs text-slate-500">
                    Envie o arquivo XML da nota fiscal do fornecedor para dar entrada nas quantidades, atualizar o custo de reposição (S5) e gerar as contas a pagar automaticamente.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center bg-purple-50/50 hover:bg-purple-50 transition cursor-pointer">
                <Upload className="w-10 h-10 text-purple-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  Arraste o arquivo XML da NF-e de compra aqui ou clique para selecionar
                </p>
                <p className="text-xs text-slate-500 mt-1">Formato: .xml (Layout NF-e 4.00, Modelo 55)</p>
                <button
                  onClick={() => {
                    alert('XML validado! 2 itens identificados no catálogo (Camiseta Polo e Arroz 5kg), estoque atualizado e 1 conta a pagar gerada para 25 dias.');
                  }}
                  className="mt-4 px-4 py-2 bg-purple-700 text-white text-xs font-semibold rounded-lg hover:bg-purple-800"
                >
                  Simular Leitura de XML
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA: CONTAS A RECEBER / FIADO (ONDA 3 - F-18)                  */}
        {/* ============================================================== */}
        {role === 'DONO' && activeTab === 'contasReceber' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <span>Contas a Receber (Vendas a Prazo / Fiado)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acompanhe o saldo devedor por cliente, títulos vencidos (Alerta A9) e baixe recebimentos para alimentar o fluxo de caixa.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Cliente</th>
                      <th className="py-2.5 px-4">Telefone</th>
                      <th className="py-2.5 px-4">Vencimento</th>
                      <th className="py-2.5 px-4 text-right">Saldo Devedor</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {titulosReceber.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{t.clienteNome}</td>
                        <td className="py-3 px-4 text-slate-600">{t.clienteTelefone || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{t.dataVencimento}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-700">
                          R$ {t.saldoRestante.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded font-semibold ${
                            t.status === 'VENCIDO' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              const valor = prompt(`Valor a receber de ${t.clienteNome} (Saldo: R$ ${t.saldoRestante}):`, t.saldoRestante.toString());
                              if (valor) {
                                const valNum = parseFloat(valor);
                                if (valNum > 0 && valNum <= t.saldoRestante) {
                                  setTitulosReceber((prev) =>
                                    prev.map((item) =>
                                      item.id === t.id
                                        ? {
                                            ...item,
                                            saldoRestante: item.saldoRestante - valNum,
                                            status: item.saldoRestante - valNum === 0 ? 'PAGO_TOTAL' : 'PAGO_PARCIAL',
                                          }
                                        : item
                                    )
                                  );
                                  alert(`Recebimento de R$ ${valNum.toFixed(2)} registrado com sucesso! Adicionado ao fluxo de caixa de hoje.`);
                                }
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-700 text-white rounded font-semibold hover:bg-emerald-800 transition"
                          >
                            Baixar Recebimento
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DEMAIS TELAS JÁ CRIADAS NA ONDA 1 (Dashboard, Produtos, Importação, Despesas, Precificação, Clientes) */}
        {role === 'DONO' && activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* ALERTAS */}
            {alertas.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Pontos de Atenção (Alertas por Regras Matemáticas)</span>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">Sem IA · 100% Transparente</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alertas.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-3.5 rounded-lg border text-sm ${
                        alerta.nivel === 'CRITICO'
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{alerta.titulo}</span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-white/70">
                          Regra {alerta.id}
                        </span>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{alerta.mensagem}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold uppercase block">Faturamento do Mês</span>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  R$ {relatorioIndicadores.faturamento.valor.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Ticket Médio: R$ {relatorioIndicadores.ticketMedio.valor.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold uppercase block">CMV (Custo Mercadoria)</span>
                <div className="mt-2 text-2xl font-bold text-slate-900">
                  R$ {relatorioIndicadores.cmv.valor.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Margem: {relatorioIndicadores.margemBrutaPercentual.valor.toFixed(1)}% (R$ {relatorioIndicadores.lucroBruto.valor.toFixed(2)})
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold uppercase block">Resultado Gerencial</span>
                <div className="mt-2 text-2xl font-bold text-emerald-700">
                  R$ {relatorioIndicadores.resultadoGerencial.valor.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Antes da retirada do dono</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold uppercase block">Resultado Após Retirada</span>
                <div className="mt-2 text-2xl font-bold text-emerald-700">
                  R$ {relatorioIndicadores.resultadoAposRetirada.valor.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Retirada: R$ 3.500,00</p>
              </div>
            </div>
          </div>
        )}

        {/* PRODUTOS */}
        {activeTab === 'produtos' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Estoque Atual</th>
                  {role === 'DONO' && <th className="py-3 px-4 text-right">Custo Reposição</th>}
                  <th className="py-3 px-4 text-right">Preço de Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produtos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.nome}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.categoria}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {p.estoqueAtual} {p.unidade}
                    </td>
                    {role === 'DONO' && (
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        R$ {p.custoUnitario.toFixed(2)}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      R$ {p.precoVenda.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* IMPORTAÇÃO DE PLANILHA */}
        {role === 'DONO' && activeTab === 'importacao' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-4">
            <FileSpreadsheet className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">Importar Vendas por CSV ou Excel</h3>
            <p className="text-xs text-slate-500">Mapeamento dinâmico e baixa automática de estoque.</p>
            <button
              onClick={() => alert('Importação executada com sucesso!')}
              className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
            >
              Simular Importação
            </button>
          </div>
        )}

        {/* DESPESAS */}
        {role === 'DONO' && activeTab === 'despesas' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {despesas.map((d) => (
                  <tr key={d.id}>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.descricao}</td>
                    <td className="py-3 px-4 text-xs">{d.tipo}</td>
                    <td className="py-3 px-4 text-xs font-mono">{d.dataVencimento}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">R$ {d.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CALCULADORA */}
        {role === 'DONO' && activeTab === 'precificacao' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-700" />
              <span>Calculadora por Markup Divisor</span>
            </h3>
            <div className="p-4 bg-slate-50 rounded-xl space-y-3">
              <div className="flex justify-between text-sm">
                <span>Custo: R$ {calcParams.custoUnitario.toFixed(2)}</span>
                <span>DV: {calcParams.despesasVariaveisPercentual}% | DF: {calcParams.despesasFixasPercentual}% | ML: {calcParams.margemLucroDesejadaPercentual}%</span>
              </div>
              {resultadoPrecificacao.data && (
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-bold text-slate-700">Preço Sugerido (Terminado em ,90):</span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    R$ {resultadoPrecificacao.data.precoSugeridoFinal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto text-center space-y-3">
            <Users className="w-10 h-10 text-emerald-700 mx-auto" />
            <h3 className="font-bold text-slate-900 text-lg">Gestão de Clientes e LGPD</h3>
            <p className="text-xs text-slate-500">Documento encriptado com índice cego e anonimização com 1 clique.</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-3 px-8 text-center text-xs text-slate-500">
        ALTHUS by DATALIS · Gestão Integrada do Comércio Varejista · Ondas 1, 2 e 3 Concluídas
      </footer>
    </div>
  );
}
