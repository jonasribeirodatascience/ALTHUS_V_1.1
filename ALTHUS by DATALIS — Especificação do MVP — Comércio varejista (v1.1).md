# ALTHUS by DATALIS — Especificação do MVP — Comércio varejista (v1.1)

DATALIS SOLUÇÕES · Versão 1.1, consolidada em 28/10/2026 · Etapa 1 (Estruturação) · Perfil comércio varejista

## 1. Status e como ler

**Fatos.** O ALTHUS existe só no papel: não há software, cliente pagante nem entrevista registrada. A evidência própria de mercado é a pesquisa rápida (25 respostas, dez/2025 a mar/2026), declarativa e de amostra pequena; só 3 respostas são de comércio.

**Esta versão.** A v1.1 consolida a v1.0 e as decisões de 24/10/2026 num único texto, sem regra de precedência entre seções. Ela substitui a v1.0 e as listas de escopo dos documentos anteriores (Especificação Funcional 1.0, Documento Técnico v3.0, Análise de Requisitos v3.0 e MVP técnico). A especificação de alimentação (v0.2) continua salva à parte, para comparação.

**Origem de cada item:** **\[D\]** decisão do fundador · **\[H\]** hipótese não testada · **\[P\]** apoiada na pesquisa (n=25) · **\[R\]** recomendação desta consolidação. “Por delegação” indica decisão tomada a pedido do fundador, com o critério de maior valor inicial e menor curva de desenvolvimento; pode ser revista.

**Pendências fora desta especificação.** (1) Quem será o revisor técnico do código; bloqueia a Etapa 3. (2) D-09, conciliação do cargo na PMMS e estrutura societária; bloqueia a constituição da empresa.

## 2. Escopo, premissas e decisões

**Recorte.** Comércio varejista de produto com código, incluindo vestuário e calçado (com variações de tamanho e cor): mercearia, minimercado, conveniência, papelaria, loja de utilidades, material de construção, autopeças e lojas de roupa e calçado. Fora: farmácia (controle regulatório) e comércio eletrônico.

| ID | Premissa | Origem |
| --- | --- | --- |
| P1 | Público inicial: MEI e pequenas empresas sem sistema de gestão ou com PDV simples. Na pesquisa, 14 de 25 não usam sistema (nenhum, planilha ou caderno) e 6 têm sistema limitado. | \[D\] \[P\] |
| P2 | As vendas entram por **importação** do PDV que o cliente já usa ou pelo **PDV nativo** do ALTHUS, contratável por quem não tem PDV. | \[D\] |
| P3 | O MVP não emite documento fiscal. O relatório “Dados para emissão” serve a quem usa o PDV nativo e emite a nota em outro sistema. | \[D\] |
| P4 | A venda por peso é aceita, com o peso digitado pelo operador e sem integração com a balança. | \[D\] |
| P5 | Sem IA no MVP. Os alertas vêm de regras matemáticas explicadas. | \[D\] |
| P6 | Monólito modular. A stack sugerida (React, Node.js, PostgreSQL) ainda não foi decidida. | \[R\] |
| P7 | O nome “lucro líquido” não é usado; o indicador é “resultado gerencial”. | \[R\] |
| P8 | Desenvolvimento com agentes de IA no Antigravity, com revisão humana obrigatória (seção 8.7). | \[D\] |

Limites do fundador usados como critério de corte: (1) não ampliar o produto sem necessidade comprovada; (2) não prometer análise que os dados não sustentem; (3) não perder a simplicidade por complexidade técnica.

**Decisões**

| ID | Decisão | Origem |
| --- | --- | --- |
| D-01 | Perfil do MVP: comércio varejista, incluindo vestuário e calçado (variações de tamanho e cor) | \[D\] |
| D-02 | Sem IA no MVP | \[D\] |
| D-03 | Sem campos fiscais opcionais no produto | \[D\] |
| D-04 | Registrar vendas sem internet e enviar quando a conexão voltar, se uma verificação técnica confirmar a viabilidade (F-27) | \[D\] |
| D-05 | Cartão entra no caixa no dia da venda, sem taxas, com limitação declarada | \[D\] |
| D-06 | Cobrança dos planos manual | \[D\] |
| D-07 | Desenvolvimento com agentes de IA no Antigravity; revisão humana&#32; | \[D\] mecanismo por delegação |
| D-08 e D-12 | Dois planos, “Análise” e “Análise + PDV”; piloto acompanhado sem cobrança no início; valores definidos no plano de negócio | Por delegação |
| D-11 | Três ondas de entrega: importação, depois PDV nativo, depois entrada avançada (seção 4) | Por delegação |
| D-13 | Entrada de estoque por XML da NF-e de compra no MVP e leitura do qr code da NF (F-16) | \[D\] |
| D-14 | Venda a prazo (fiado) e contas a receber no MVP (F-18) | \[D\] |

## 3. O que o painel responde ao comerciante

| Pergunta do comerciante | Indicador | Números de que precisa | Degrau |
| --- | --- | --- | --- |
| Quanto estou vendendo? | Faturamento do dia, semana e mês; número de vendas; ticket médio; vendas por dia da semana e por horário | Vendas com data e hora, itens, valor, desconto e forma de pagamento | 1 |
| Estou vendendo pouco? | Ponto de equilíbrio mensal e diário; % atingido no mês | Despesas fixas, custo da mercadoria, despesas variáveis, dias em que abre | 1 |
| Estou lucrando? | Lucro bruto, margem bruta e resultado gerencial | Vendas, custo da mercadoria, despesas | 1 (custo exato no 2) |
| Estou pagando para trabalhar? | Resultado depois da retirada do dono | Retirada mensal do dono | 1 |
| Meu dinheiro está parado no estoque? | Valor do estoque a custo; estoque parado; giro; cobertura em dias | Estoque atual, custo, vendas por produto | 2 |
| Quais produtos dão lucro e qual preço cobrar? | Margem e lucro por produto; curva ABC por lucro; produtos abaixo do mínimo; preço abaixo do custo; descontos; calculadora de precificação | Custo, preço, quantidade vendida, estoque mínimo, descontos | 2 |
| Como está meu fluxo de caixa? |  |  |  |
| saúde do negócio |  |  |  |

| Degrau | Dados informados | O que passa a responder | Limite declarado na tela |
| --- | --- | --- | --- |
| 1. Sem custo por produto (dia 1) | Vendas (importadas ou do PDV); compras de mercadoria (valor e data); despesas por categoria; retirada do dono; dias de funcionamento; saldo inicial de caixa | Perguntas 1 a 4 | O custo da mercadoria é aproximado pelas compras do período; se o dono comprou mais do que vendeu, o custo parece alto |
| 2. Produtos com custo e estoque | Cadastro com custo, preço, estoque e mínimo; entradas de mercadoria | Perguntas 5 e 6 | Produto sem custo fica fora de margem e de estoque e é listado à parte |

## 4. Backlog e ondas de entrega

Esforço relativo: P (pequeno), M (médio), G (grande).

| ID | Funcionalidade | Dor associada | MoSCoW | Esforço | Onda |
| --- | --- | --- | --- | --- | --- |
| F-01 | Conta, empresa e acesso | Base de segurança | Must | M | 1 |
| F-02 | Perfis: dono e operador de caixa | Quem vende nem sempre é o dono \[D\] | Must | P | 1 |
| F-03 | Isolamento de dados entre empresas | Base de segurança (inegociável) | Must | M | 1 |
| F-10 | Registro de eventos (auditoria básica) | Segurança e LGPD | Must | P | 1 |
| F-04 | Produtos, código de barras e estoque | Dinheiro parado em estoque; produto em falta \[H\] | Must | M | 1 |
| F-26 | Variações de tamanho e cor | Lojas de roupa e calçado \[D\] | Must | G | 1 |
| F-11 | Clientes (consentimento LGPD) | Venda a prazo e dados para emissão \[D\] | Must | M | 1 |
| F-06 | Despesas, vencimentos e retirada do dono | Saber se o caixa cobre a semana; pagar para trabalhar \[H\] | Must | P | 1 |
| F-12 | Importação de vendas por CSV e Excel | Quem já tem PDV não digita de novo \[D\] | Must | M | 1 |
| F-07 | Financeiro consolidado e indicadores | “Não sei se estou lucrando” \[H\]; planilha em 12 de 25 \[P\] | Must | M | 1 |
| F-08 | Painel e alertas por regras | Ver numa tela o que merece atenção \[D\] | Must | M | 1 |
| F-29 | Calculadora de precificação | Preço sem método; desconto sem medir o impacto \[H\] | Must | M | 1 |
| F-05 | PDV nativo (módulo contratável) | Margem e descontos sem visibilidade \[H\] | Must | G | 2 |
| F-09 | Relatório “Dados para emissão” | Emitir nota em outro sistema sem redigitar \[D\] | Must | P | 2 |
| F-28 | Troca e devolução de venda | Troca é comum em roupa \[H\] | Should | M | 2 |
| F-16 | Entrada de estoque por XML da NF-e de compra | Digitação de estoque \[D\] | Must | M | 3 |
| F-18 | Venda a prazo (fiado) e contas a receber | Fiado comum em varejo pequeno \[D\] | Must | M | 3 |
| F-27 | Registro de vendas sem internet (avaliar tecnicamente) | Caixa parado sem conexão \[D\] | Must (condicionada) | G | 3 |
|  | Academy |  |  |  |  |
|  | &#32;painel administrativo do SaaS (somente o founder te acesso na sua conta adm) |  |  |  |  |
|  | cobrança automática por gateway |  |  |  |  |

**Must.** São 17 (16 se a F-27 reprovar na verificação técnica). Quatro são base de segurança (F-01, F-02, F-03, F-10). O total é muito acima do recomendado (10); por isso a entrega é em ondas com portões.

**Should:** F-13 Fechamento de caixa do dia (onda 2) · F-14 Despesas recorrentes (onda 1) · F-15 Importação de produtos por planilha, com variações (onda 1) · F-17 Inventário em lote (onda 2).

**Could:** F-19 Alerta de limite do MEI (exige validação de contador) · F-21 Cadastro de fornecedores · F-22 Índice “Saúde da Empresa” · F-23 Leitura de etiqueta de balança etiquetadora · F-24 Modelos de mapeamento para PDVs comuns.

**Won’t (agora):** emissão fiscal; campos fiscais opcionais (D-03); integração por API com PDV de terceiros; integração direta com balança; lote e validade; kits; várias lojas e transferência entre filiais; fidelidade; comércio eletrônico; vale-troca; juros e multa de fiado; simulador de regimes; IA; Academy; painel administrativo do SaaS; cobrança automática por gateway; aplicativo nativo.

| Onda | Conteúdo | Portão para passar à seguinte |
| --- | --- | --- |
| 1. Fundação e valor com dados importados (lançamento inicial) | F-01, F-02, F-03, F-10, F-04, F-26, F-11, F-06, F-12, F-07, F-08, F-29, F-14, F-15 | Teste de isolamento entre empresas aprovado; indicadores conferidos em dados de teste; importação testada com arquivos reais de pelo menos 2 PDVs \[H\] |
| 2. PDV nativo | F-05, F-09, F-28, F-13, F-17 | Critérios de aceite cumpridos; teste de usabilidade do PDV com 5 pessoas (S10) |
| 3. Entrada de dados avançada | F-16, F-18, F-27 | Verificação técnica da F-27 aprovada (ADR-003); custo de suporte do PDV coberto pela receita esperada |

Por que a Onda 1 é o lançamento inicial: o cliente não precisa trocar o caixa; os indicadores são validados com dados reais; e a construção começa pelo que é só cálculo e cadastro, sem PDV, sem venda offline e sem leitura de XML. Quem não tem PDV mas controla vendas em planilha entra pelo CSV ou Excel da F-12, inclusive com o total por dia.

**Corte se a capacidade apertar:** da última onda para trás: F-27, F-18, F-16 e, por fim, o PDV nativo (F-05) vira V1.1. A Onda 1 não é cortada.

## 5. Especificações das funcionalidades

### 5.1 F-01 Conta, empresa e acesso

**Onboarding em três etapas.** (1) Conta: nome, e-mail e senha. (2) Empresa: nome, CPF ou CNPJ (validado pelos dígitos verificadores), estado, tipo de negócio e regime tributário (opcional). (3) Configurações: saldo inicial de caixa, dias de funcionamento, limite de desconto do operador, retirada mensal do dono (opcional) e a opção de importar produtos por planilha (F-15). Sem CNAE, logo ou cores no MVP.

**Critérios de aceite**

- CA-01 Dados nome, e-mail e senha válidos, então a conta é criada e a senha é guardada com hash (bcrypt).
- CA-02 Dado CPF ou CNPJ com dígitos verificadores inválidos, então o cadastro é recusado com mensagem clara.
- CA-03 Dado o CPF ou CNPJ de uma empresa já cadastrada, então o cadastro é recusado (unicidade por índice cego, seção 8.1).
- CA-04 Dadas tentativas de login inválidas repetidas, então o acesso é limitado temporariamente (limite definido em ADR).
- CA-05 Dado logout, então o token de renovação da sessão deixa de valer.
- CA-06 Dado “esqueci a senha”, então o sistema envia ao e-mail cadastrado um link de redefinição de uso único e validade curta, sem revelar se o e-mail existe.
- CA-07 Dado o fim da etapa 2, então o dono já pode chegar ao painel; a etapa 3 pode ser pulada e editada depois.

### 5.2 F-02 Perfis

**Dono:** acesso total, cria operadores, vê custo, margem, financeiro e calculadora. **Operador de caixa:** PDV, consulta de produtos sem custo, vendas do dia, “Dados para emissão” e cadastro de cliente; não vê financeiro, custo, margem, calculadora nem saldo a receber (S25).

- CA-01 Dado um operador, quando abre uma tela financeira por endereço direto, então recebe acesso negado (testado na API, não só na interface).
- CA-02 Dado o dono, quando cria um operador, então define e-mail e senha temporária, que o operador troca no primeiro acesso.
- CA-03 Dado um operador desativado, então perde o acesso na hora e o histórico dele é preservado.

### 5.3 F-03 Isolamento de dados entre empresas

Toda tabela com dado de cliente tem o identificador da empresa; toda consulta, importação e relatório o respeita; PostgreSQL com segurança por linha, se adotado.

- CA-01 Dadas duas empresas de teste, quando um usuário da A tenta listar, ler, editar ou excluir qualquer registro da B por cada endpoint, então a resposta é negada e nenhum dado da B aparece.
- CA-02 Dado o pipeline de entrega, então esse teste roda a cada versão e a falha bloqueia a entrega.

### 5.4 F-10 Registro de eventos

Registra acessos e falhas de login; criação, edição e cancelamento de vendas; devoluções; importações; ajustes de estoque; mudança de preço ou custo; mudança de perfil; geração de relatório. Cada evento guarda usuário, empresa, data e hora em UTC, ação, registro afetado e, nas alterações, valor antes e depois. O aplicativo não edita nem apaga eventos. Prazo de retenção a definir.

### 5.5 F-04 Produtos, código de barras e estoque

**Problema \[H\].** O dinheiro fica parado em produto que não vende, e outros faltam na hora da venda.

**Produto:** nome, categoria, código de barras (opcional), unidade (un ou kg), custo, preço, estoque, estoque mínimo e ativo. Produtos com tamanho e cor seguem a seção 5.6.

**Critérios de aceite**

- CA-01 Dado nome, custo, preço, unidade e estoque inicial válidos, quando salvo, então o produto aparece no PDV; custo e preço devem ser maiores que zero.
- CA-02 Dado um código de barras digitado ou lido por leitor que emule teclado, então o produto é encontrado no PDV e no cadastro; o código é único por empresa e produto sem código é aceito (busca por nome).
- CA-03 Dada uma entrada de mercadoria com quantidade e custo, então o estoque sobe e o custo unitário passa a ser o informado (S5); se houver valor a pagar, gera conta a pagar da categoria “compra de mercadoria”.
- CA-04 Dado um ajuste manual, então exige motivo e fica no histórico com usuário e data.
- CA-05 Dado estoque menor ou igual ao mínimo, então o produto entra no alerta A1.
- CA-06 Dado preço de venda menor que o custo, então o produto é sinalizado no cadastro e entra no alerta A8.
- CA-07 Dado um produto desativado, então some do PDV e o histórico é preservado.
- CA-08 Dada a lista de produtos, então há busca por nome ou código e filtros “sem custo”, “estoque no mínimo ou abaixo” e “parado”.

**Regras.** Margem = preço − custo; margem % = margem ÷ preço. Compra de mercadoria para revenda não é despesa operacional (o custo aparece no CMV quando vendida), mas entra no fluxo de caixa.

**Fora do escopo.** Lote e validade, kits, vários depósitos, preço por quantidade ou atacado.

### 5.6 F-26 Variações de tamanho e cor

**Modelo.** O produto (nome, categoria, preço e custo base) tem variações (tamanho e cor), cada uma com código de barras, estoque e estoque mínimo próprios; preço e custo da variação são herdados do produto, salvo valor próprio.

**Critérios de aceite**

- CA-01 Dado um produto com atributos tamanho e cor, quando o dono informa os tamanhos e as cores, então o sistema gera as combinações, e cada uma tem estoque e código de barras próprios.
- CA-02 Dado um produto com 3 tamanhos e 2 cores, então são criadas 6 variações, e o dono pode desativar as combinações que não existem.
- CA-03 Dada uma variação sem preço ou custo próprios, então usa os do produto; com valor próprio, o dela vale.
- CA-04 Dado o PDV, quando o operador lê o código de barras de uma variação, então a venda registra aquela variação e baixa o estoque dela.
- CA-05 Dado o PDV, quando o operador escolhe um produto sem ler o código, então o sistema pede tamanho e cor antes de adicionar.
- CA-06 Dada a importação de vendas, então o vínculo é feito pelo código de barras da variação ou por produto, tamanho e cor; item que só traz o produto fica vinculado ao produto, sem variação, e entra na lista de pendências.
- CA-07 Dados os indicadores, então margem, giro, cobertura, estoque parado e curva ABC existem por variação e somados por produto.
- CA-08 Dado um alerta de estoque mínimo, então ele aponta a variação (por exemplo, “Camiseta M azul”), não só o produto.
- CA-09 Dada uma entrada de mercadoria (manual ou por XML), então a quantidade é lançada por variação.

**Regras.** Só tamanho e cor no MVP; outros atributos ficam fora. A lista de tamanhos (letras e numeração) vem pré-definida e é editável (S20).

**Fora do escopo.** Grade por coleção ou temporada; vale-troca.

### 5.7 F-11 Clientes

**História.** Como dono, quero cadastrar clientes para vender a prazo, gerar dados para emissão de nota e ver quem compra.

**Dados.** Nome; CPF ou CNPJ (opcional, validado); telefone; e-mail; endereço (opcional); observações; registro de ciência e concordância do titular (data, finalidade e quem registrou); limite de crédito (opcional, F-18).

**Critérios de aceite**

- CA-01 Dado nome e documento válido (dígitos verificadores), então o cliente é salvo; o documento é único por empresa (índice cego).
- CA-02 Dado um cliente sem documento, então é aceito para venda à vista; para venda a prazo exige nome e telefone.
- CA-03 Dado um cadastro com dados pessoais, então o sistema exige marcar que o titular foi informado da finalidade (venda, cobrança e emissão de nota) e guarda data e usuário.
- CA-04 Dada a busca por nome, telefone ou documento, então o cliente é encontrado no cadastro e no PDV.
- CA-05 Dada a tela do cliente, então mostra as compras (data e total), as devoluções e, para o dono, o saldo a receber.
- CA-06 Dado um pedido de exclusão do titular, então o sistema anonimiza o cliente (nome vira “Cliente removido”; documento e contatos são apagados) e mantém as vendas e os totais.
- CA-07 Dado um operador, então cria e busca cliente, mas não vê limite de crédito nem saldo (S25).
- CA-08 Dados dois usuários de empresas diferentes, então um não vê os clientes do outro.

**Regras.** Só os dados mínimos; nenhum dado sensível; finalidade restrita a venda, cobrança e emissão. Papéis da LGPD na seção 8.5.

**Fora do escopo.** Segmentação, marketing, fidelidade e aniversários.

### 5.8 F-06 Despesas, vencimentos e retirada do dono

**Campos.** Descrição, tipo (fixa ou variável), categoria, valor, data da despesa, vencimento, status (pendente ou paga), data e forma de pagamento. **Categorias padrão de varejo:** mercadoria, pessoal, aluguel, energia e água, taxas de cartão, embalagem, frete, manutenção, impostos e taxas, retirada do dono, outras.

- CA-01 Dada uma despesa pendente com vencimento nos próximos 7 dias, então ela aparece em “vencimentos da semana”.
- CA-02 Dada uma despesa marcada como paga, então entra no fluxo de caixa na data do pagamento.
- CA-03 Dado valor menor ou igual a zero, então o lançamento é recusado.
- CA-04 Dada uma categoria padrão, então o tipo vem sugerido (por exemplo, aluguel como fixa) e o dono pode mudar.
- CA-05 Dada a retirada do dono informada, então o painel mostra resultado gerencial e resultado depois da retirada lado a lado; sem ela, mostra “O resultado ainda não considera quanto você retira”.

### 5.9 F-12 Importação de vendas (CSV e Excel)

**História.** Como dono que já tem PDV, quero enviar o relatório de vendas dele para ver os indicadores sem digitar de novo.

**Critérios de aceite**

- CA-01 Dado um arquivo CSV ou Excel (.xlsx ou .xls), quando o dono o envia, então o sistema mostra as colunas encontradas e pede o mapeamento para: data e hora, item (código de barras ou nome), tamanho e cor (opcionais), quantidade, valor unitário, valor total, desconto (opcional), forma de pagamento (opcional) e situação (opcional, para vendas canceladas).
- CA-02 Dado um mapeamento salvo, quando o dono importa outro arquivo do mesmo PDV, então o mapeamento é reaproveitado.
- CA-03 Dado o arquivo lido, então o sistema mostra uma prévia (primeiras linhas e totais) e pede confirmação antes de gravar.
- CA-04 Dado um período que se sobrepõe a vendas já importadas, então o sistema avisa e oferece substituir só as vendas importadas daquele período, nunca as do PDV nativo.
- CA-05 Dadas linhas inválidas (data ilegível, valor negativo, quantidade zero), então elas vão para um relatório de rejeitadas com o motivo, o restante é importado e nada é gravado em silêncio com valor errado.
- CA-06 Dados os itens importados, então cada um é vinculado ao cadastro (seção 5.6, CA-06); itens sem vínculo ficam numa lista “sem vínculo”, entram no faturamento e ficam fora de custo e margem por produto.
- CA-07 Dada uma venda importada com situação cancelada (quando mapeada), então ela não entra no faturamento.
- CA-08 Dado um arquivo com apenas totais por dia (data, total, forma de pagamento), então ele é aceito e libera só os indicadores que não dependem de item.
- CA-09 Dado qualquer arquivo, então só grava na empresa do usuário, lê apenas valores (não executa fórmulas nem macros) e respeita um tamanho máximo definido em ADR.
- CA-10 Dada uma venda importada, então ela guarda origem, data da importação e usuário, e o log registra a importação.

**Regras.** A venda importada baixa o estoque do produto vinculado como a do PDV nativo (S17). A importação em lote atualiza os alertas na hora em que termina. A atualização “segundo a segundo” vale só para o PDV nativo.

### 5.10 F-07 Financeiro e indicadores

Todos os indicadores, com o que significam e a técnica de cálculo, estão no dicionário da seção 7.

**Regras gerais**

- Filtro por período: dia, semana, mês e intervalo.
- Cálculo no servidor, com os mesmos resultados em qualquer tela.
- Vendas canceladas ficam fora de tudo; devoluções (F-28) são deduzidas do faturamento.
- Dado ausente aparece como “indisponível”, com o motivo, nunca como zero silencioso.
- O nome “lucro líquido” não é usado; o indicador é “resultado gerencial”.

**Critérios de aceite**

- CA-01 Dado um período com vendas e despesas, então o painel mostra os indicadores da seção 7 calculados conforme as fórmulas.
- CA-02 Dado um indicador indisponível, então a tela mostra o motivo e o que fazer para liberá-lo.
- CA-03 Dado qualquer indicador, então um ícone de ajuda mostra o significado, a técnica, os dados usados e as limitações.
- CA-04 Dado cada indicador, então há teste automático com valores de exemplo calculados à mão.

### 5.11 F-08 Painel e alertas por regras

**Nível de inteligência:** descritivo, com comparação simples entre períodos. Não há previsão nem recomendação de IA no MVP.

| ID | Regra | Mensagem de exemplo | Dados mínimos |
| --- | --- | --- | --- |
| A1 | Estoque atual ≤ mínimo | “3 produtos estão no estoque mínimo ou abaixo.” | Produtos com mínimo informado |
| A2 | Produto com estoque e sem venda há mais de 60 dias (S8) | “R$ X a custo estão parados em N produtos.” | 60 dias de histórico |
| A3 | Faturamento acumulado do mês abaixo do ponto de equilíbrio proporcional aos dias decorridos | “Até hoje você faturou R$ X; o esperado para cobrir os custos fixos era R$ Y.” | Ponto de equilíbrio disponível |
| A4 | Margem bruta caiu 3 pontos percentuais ou mais frente ao período anterior (S9) | “Sua margem bruta caiu de X% para Y%.” | Dois períodos com vendas e custos |
| A5 | Contas a vencer em 7 dias maiores que o saldo de caixa | “Vencem R$ X até DD/MM; seu saldo de caixa é R$ Y.” | Saldo inicial e vencimentos lançados |
| A6 | Descontos do período acima do limite definido pelo dono | “Você concedeu R$ X em descontos (Y% do faturamento bruto).” | Limite configurado |
| A7 | Produto com venda nos últimos 30 dias e cobertura abaixo de 7 dias (S18) | “N produtos vendem rápido e o estoque cobre menos de 7 dias.” | 30 dias de vendas |
| A8 | Produto com preço de venda abaixo do custo | “N produtos estão com preço abaixo do custo.” | Custo e preço informados |
| A9 | Título de venda a prazo vencido (S22) | “N clientes têm R$ X vencidos.” | Ao menos um título vencido (F-18) |
| A10 | Produto com preço abaixo do preço de equilíbrio calculado | “N produtos estão abaixo do preço de equilíbrio.” | DV% e DF% informados (F-29) |

**Critérios de aceite**

- CA-01 Dado que os dados mínimos de uma regra não existem, então o alerta não aparece e o painel indica “sem dados suficientes para avaliar este ponto”.
- CA-02 Dado qualquer alerta, então a mensagem mostra os números usados e não atribui causa.
- CA-03 Dado um alerta, então o texto indica o indicador de origem e abre a explicação dele.
- CA-04 Dado um alerta gerado, então o log guarda regra, janela de datas, valores e horário.
- CA-05 Dado um dono, então o painel carrega em até 3 segundos com até um ano de dados de uma empresa de teste (meta inicial, medir).

### 5.12 F-29 Calculadora de precificação

**Propósito \[H\].** Ajudar o comerciante a definir um preço que cubra o custo, as despesas e a margem desejada, em vez de somar um percentual sobre o custo no olho.

**Técnica: markup divisor (preço por dentro).** Os percentuais incidem sobre o **preço de venda**, não sobre o custo. Foi consultado em material do Sebrae e em publicações de empresas de gestão (Bling, Conta Azul, Cielo) em 24/10/2026; validar com contador ou consultor antes de qualquer promessa comercial.

- Soma dos percentuais sobre o preço: S = DV% + DF% + ML%
- Markup divisor = 1 − S
- **Preço sugerido = Custo ÷ Markup divisor**
- Markup multiplicador (informativo) = 1 ÷ Markup divisor

Onde:

- **Custo:** custo de reposição do produto (o último custo informado, S5), mais custos adicionais por unidade (frete, embalagem), se o dono os informar.
- **DV% (despesas variáveis sobre a venda):** impostos sobre a venda, taxa média de cartão, comissões e outras, informados pelo dono.
- **DF% (despesas fixas):** despesas fixas médias dos últimos 3 meses ÷ faturamento médio dos últimos 3 meses, calculado pelo sistema e editável; sem 3 meses de dados, o dono informa uma estimativa.
- **ML% (margem de lucro desejada):** informada pelo dono.

**Resultados adicionais**

- **Preço de equilíbrio** = Custo ÷ (1 − DV% − DF%): preço com lucro zero, que cobre custo, despesas variáveis e a parcela das fixas.
- **Preço de contribuição** = Custo ÷ (1 − DV%): cobre custo e despesas variáveis, mas não paga as fixas.
- **Margem de contribuição do preço atual** = 1 − (custo ÷ preço atual) − DV%.
- **Margem de lucro do preço atual** = margem de contribuição − DF%.
- **Desconto máximo sem prejuízo** = 1 − (preço de contribuição ÷ preço atual).

**Exemplo ilustrativo (percentuais de exemplo, não referência de mercado).** Custo R$ 60,00; DV 7% (impostos 4% e cartão 3%); DF 20%; ML 10%. S = 37% e o divisor é 0,63. Preço sugerido = 60 ÷ 0,63 = **R$ 95,24**; multiplicador 1,587 (markup de 58,7% sobre o custo). Preço de equilíbrio = 60 ÷ 0,73 = **R$ 82,19**. Preço de contribuição = 60 ÷ 0,93 = **R$ 64,52**. Desconto máximo sem prejuízo a partir de R$ 95,24 = **32,3%**. Conferência: R$ 6,67 de variáveis + R$ 19,05 de fixas + R$ 9,52 de lucro + R$ 60,00 de custo = R$ 95,24.

**Regras**

- RN-C1 A margem é sobre o preço, não sobre o custo. A tela explica a diferença: cobrar 50% sobre o custo dá margem bruta de 33,3% sobre o preço.
- RN-C2 Se DV% + DF% + ML% for 100% ou mais, a calculadora recusa e explica.
- RN-C3 O sistema não calcula tributos: o dono informa o percentual (D-03; a validar com contador). Para MEI, o pagamento mensal fixo entra como despesa fixa, sem percentual sobre a venda (a confirmar com contador).
- RN-C4 Arredondamento opcional: sem arredondar, para o próximo R$ 0,05 ou terminando em ,90. O arredondamento é sempre para cima, para nunca ficar abaixo do preço calculado.
- RN-C5 Preço de referência de mercado é opcional e informado pelo dono; o sistema mostra a diferença e a margem resultante, mas não busca preços de concorrentes.
- RN-C6 O sistema nunca altera preço sem confirmação. A aplicação é por produto, por variação ou em lote (categoria), com prévia.
- RN-C7 Variações herdam o preço do produto, salvo preço próprio (F-26).
- RN-C8 Sem informar DV%, o preço sugerido não cobre esses custos; a tela avisa.

**Critérios de aceite**

- CA-01 Dado custo R$ 60,00, DV 7%, DF 20% e ML 10%, então o preço sugerido é R$ 95,24, o de equilíbrio R$ 82,19 e o de contribuição R$ 64,52.
- CA-02 Dado DV% + DF% + ML% de 100% ou mais, então a calculadora recusa e explica que a soma precisa ficar abaixo de 100%.
- CA-03 Dado histórico de 3 meses, então o DF% vem preenchido e editável; sem histórico, exige informar.
- CA-04 Dado o arredondamento “terminando em ,90”, então o preço final é o menor valor terminado em ,90 que seja igual ou maior que o sugerido (95,24 vira 95,90).
- CA-05 Dado o preço atual do produto, então a tela mostra a margem de contribuição, a margem de lucro e o desconto máximo sem prejuízo.
- CA-06 Dada uma aplicação em lote, então a prévia mostra preço atual, novo, variação e margem resultante, e só altera após confirmação, com log de antes e depois.
- CA-07 Dado um preço de referência do concorrente, então a tela mostra a diferença para o sugerido e a margem nesse preço.
- CA-08 Dado um produto com variações, então o cálculo vale para as variações que herdam o preço; variação com preço próprio é calculada à parte.
- CA-09 Dado um operador, então não acessa a calculadora (custo e margem são do dono).
- CA-10 Dado cada resultado, então um ícone de ajuda explica o que significa e como foi calculado (seção 7).

**Fora do escopo.** Preço de serviço por hora, preço dinâmico, comparação automática com o mercado, cálculo de tributos e preço por faixa de quantidade.

### 5.13 F-05 PDV nativo (módulo contratável)

**Problema \[H\]\[D\].** O comerciante registra vendas num lugar, controla estoque em outro e só vê a margem depois; descontos são dados sem medir o impacto no lucro. **Resultado esperado:** cada venda registrada no caixa atualiza estoque, caixa, indicadores e alertas sem nova digitação.

**Critérios de aceite**

- CA-01 Dado um produto com estoque, quando o operador o adiciona e confirma a venda, então a venda fica “confirmada”, o estoque diminui na quantidade vendida, a entrada entra no caixa e o faturamento do período inclui o total.
- CA-02 Dado um leitor de código de barras, quando lê um código cadastrado, então o produto ou a variação entra na venda com quantidade 1; nova leitura do mesmo código soma 1.
- CA-03 Dado um código não cadastrado, então o sistema avisa e permite buscar por nome, sem travar a venda.
- CA-04 Dado um operador sem treinamento, quando registra uma venda de 3 itens em teste com 5 pessoas, então pelo menos 4 concluem em até 3 telas e 60 segundos (meta inicial, a calibrar — S10).
- CA-05 Dado um item de R$ 100,00, quando se aplica desconto de 10%, então o total do item é R$ 90,00 e o desconto é gravado em campo próprio.
- CA-06 Dado um desconto acima do limite do operador, então o sistema exige confirmação do dono.
- CA-07 Dada uma venda confirmada, quando o dono a cancela informando o motivo, então o estoque é devolvido, a entrada de caixa é estornada, a venda sai do faturamento e o log registra usuário, hora e motivo.
- CA-08 Dado um operador, quando tenta cancelar uma venda já confirmada, então o sistema nega; ele só descarta vendas em andamento.
- CA-09 Dado um item com estoque menor que a quantidade, quando se confirma a venda, então ela é permitida, o produto é marcado “estoque inconsistente” e o dono recebe alerta (S3).
- CA-10 Dado duplo clique em “Confirmar”, então só uma venda é criada.
- CA-11 Dada falha de conexão ao confirmar, então o sistema informa que a venda não foi salva e não a exibe como concluída (com a F-27 aprovada, a venda vai para a fila local).
- CA-12 Dados dois usuários de empresas diferentes, então nenhum acessa vendas da outra.

**Regras de negócio**

- RN-01 O custo unitário de cada item é gravado no momento da venda, para o CMV não mudar depois.
- RN-02 Uma forma de pagamento por venda: dinheiro, PIX, débito, crédito ou a prazo (esta com a F-18) (S4).
- RN-03 O operador não altera o preço de tabela; aplica desconto até o limite definido pelo dono (S2).
- RN-04 O cliente é opcional na venda; é necessário para venda a prazo (F-18) e para gerar “Dados para emissão” de pessoa jurídica (F-09).
- RN-05 Valores em DECIMAL(15,2); datas em UTC; exclusão lógica.

**Venda por peso (granel).** O peso é **digitado pelo operador** a partir da balança do comerciante, que não faz parte do sistema.

- RN-06 O produto tem unidade de venda “un” ou “kg”. Em produtos por kg, o preço é por kg.
- RN-07 O peso aceita até 3 casas decimais e vírgula como separador, e deve ser maior que zero.
- RN-08 Total do item = peso × preço por kg, arredondado ao centavo mais próximo (S15). Estoque e custo são controlados em kg.
- CA-P1 Dado um produto a R$ 40,00 por kg, quando o operador informa 0,350 kg, então o total do item é R$ 14,00.
- CA-P2 Dado peso zero, negativo ou com mais de 3 casas decimais, então é recusado com mensagem clara.
- CA-P3 Dado um custo de R$ 18,00 por kg e peso de 0,350 kg, então o custo do item na venda é R$ 6,30, gravado no momento da venda.
- CA-P4 Dada a tela de confirmação, então peso, preço por kg e total aparecem em destaque antes de confirmar.
- **Risco \[H\].** Digitar o peso à mão numa fila é lento e sujeito a erro; a meta de 60 segundos (S10) não vale para itens por kg.

**Dados.** Venda (empresa, operador, cliente opcional, origem, status, total bruto, desconto, total, forma de pagamento, datas, motivo de cancelamento) · ItemVenda (venda, produto ou variação, quantidade, preço, desconto, custo unitário na venda) · MovimentoEstoque (tipo, produto ou variação, quantidade, origem).

**Segurança.** Dono e operador registram; só o dono cancela. O operador não vê custo nem margem. Log de criação, cancelamento e desconto acima do limite.

**Fora do escopo.** Emissão fiscal, integração com maquininha (TEF), pagamento dividido e vale-troca.

### 5.14 F-09 Relatório “Dados para emissão”

**Problema \[D\].** O PDV nativo não emite nota; o empresário precisa levar os dados da venda a outro emissor sem redigitar de memória. **Quem usa:** o dono ou o operador do PDV nativo; quem importa vendas já emite a nota no PDV de origem.

- CA-01 Dada uma venda confirmada, quando abro “Dados para emissão”, então vejo data, cliente (se houver), itens (código, descrição, tamanho e cor, quantidade, unidade, valor unitário, desconto, total), total e forma de pagamento.
- CA-02 Dada a tela de uma venda, quando clico em “Copiar”, então os dados vão para a área de transferência em texto organizado.
- CA-03 Dado um período, quando exporto, então recebo CSV com uma linha por item, só de vendas confirmadas, em UTF-8, separador “;” e decimais com vírgula (S6).
- CA-04 Dada qualquer tela ou arquivo do relatório, então aparece o aviso fixo: “Relatório gerencial. Não é documento fiscal e não substitui a nota fiscal.”
- CA-05 Dado cliente pessoa jurídica sem CNPJ válido, então a tela destaca “CNPJ do cliente ausente”.
- CA-06 Dado um operador, então vê só as vendas do dia (S7); o dono vê todas.

**Regras.** O relatório é só leitura e gera log. Campos fiscais (NCM, CFOP, CST/CSOSN) não existem no MVP (D-03). **Fora do escopo:** emissão, integração com emissores, certificado digital, cálculo de imposto.

**Hipótese \[H\].** Falta verificar se os emissores usados pelo público aceitam importar arquivo; se não aceitarem, a cópia pela tela é o caminho principal.

### 5.15 F-28 Troca e devolução de venda

Versão simples para vestuário: devolução total ou parcial de uma venda confirmada, com retorno ao estoque da variação. A troca é uma devolução mais uma nova venda. O vale-troca (crédito ao cliente) fica fora.

- CA-01 Dada uma venda confirmada, quando o dono registra a devolução de itens (variação e quantidade), então o estoque da variação sobe e o log registra usuário, hora e motivo.
- CA-02 Dada a devolução, então o valor sai do faturamento do dia da devolução (S23) e do caixa na forma escolhida (dinheiro, PIX ou estorno de cartão).
- CA-03 Dada uma quantidade devolvida maior que a vendida menos o já devolvido, então é recusada.
- CA-04 Dada a devolução, então o CMV estorna o custo gravado na venda original, na proporção devolvida.
- CA-05 Dado um operador, então não registra devolução; só o dono (S24).
- CA-06 Dada uma troca, então o sistema registra a devolução e abre uma nova venda com a diferença a pagar ou a devolver.

### 5.16 F-16 Entrada de estoque por XML da NF-e de compra

**Escopo.** O dono envia o arquivo XML da NF-e de compra; o sistema extrai fornecedor, itens, quantidades, custo, total e vencimentos (duplicatas, se houver), vincula os itens a produtos e variações, mostra uma prévia e, confirmada, dá entrada no estoque, atualiza o custo (S5) e cria as contas a pagar.

- CA-01 Dado um XML de NF-e válido, quando o dono o envia, então o sistema mostra fornecedor, data, itens com quantidade e custo e o total, e pede confirmação antes de gravar.
- CA-02 Dado um item cujo código de barras bate com um produto ou variação, então é vinculado automaticamente; sem correspondência, o dono vincula ou cria o produto na prévia.
- CA-03 Dado o mesmo XML (mesma chave de acesso) já importado, então o sistema recusa duplicar e informa a data da importação anterior.
- CA-04 Dado um XML inválido ou de outro tipo de documento, então é recusado com mensagem clara, sem gravar nada.
- CA-05 Dado um XML cujo destinatário tem CNPJ diferente do da empresa, então o sistema avisa e exige confirmação.
- CA-06 Dados os vencimentos do XML, então geram contas a pagar da categoria “compra de mercadoria”.
- CA-07 Dado qualquer XML, então o sistema lê só dados, não executa conteúdo e respeita um tamanho máximo definido em ADR.

**Fora do escopo.** Consulta à SEFAZ, download automático de notas, manifestação do destinatário, conciliação fiscal e créditos de imposto. Os tributos do XML não entram nos indicadores.

### 5.17 F-18 Venda a prazo (fiado) e contas a receber

- CA-01 Dada uma venda com forma de pagamento “a prazo”, então o cliente é obrigatório; o valor entra em contas a receber e não entra no caixa até o recebimento.
- CA-02 Dado um cliente com saldo a receber, então a tela do cliente mostra o saldo, as vendas em aberto e os vencimentos.
- CA-03 Dado um recebimento (total ou parcial), então o dono registra valor, data e forma, e o valor entra no fluxo de caixa na data do recebimento.
- CA-04 Dado um limite de crédito por cliente (opcional, S21), quando a venda o ultrapassa, então o sistema avisa e exige confirmação do dono.
- CA-05 Dado um vencimento passado sem recebimento, então o título aparece como “vencido” e entra no alerta A9.
- CA-06 Dada uma venda a prazo, então ela conta no faturamento na data da venda e no fluxo de caixa só na data do recebimento (S11).

**Fora do escopo.** Juros, multa, boleto, cobrança por mensagem e negativação. O sistema mostra a dívida, não cobra o cliente.

### 5.18 F-27 Registro de vendas sem internet

**Princípio \[D\].** Verificar se o PDV consegue registrar vendas sem internet e, quando a conexão voltar, enviar o que foi feito.

**Verificação técnica antes de construir (ADR-003).** Responder: (1) quais navegadores e aparelhos guardam dados locais de forma confiável, já que alguns podem apagá-los; (2) como identificar cada venda de forma única para o reenvio não duplicar; (3) como tratar estoque e preço que mudaram enquanto o aparelho estava sem conexão; (4) por quanto tempo e quantas vendas isso se sustenta. Sem essa verificação aprovada, a F-27 não entra em construção.

**Escopo se for viável.** Só o registro de venda confirmada no PDV nativo, usando o catálogo já carregado. Ficam fora offline: cancelamento, devolução, relatórios, importação e cadastro de produtos.

- CA-01 Dado que a conexão cai, então a tela mostra “sem conexão” de forma visível e permite continuar vendendo com o catálogo já carregado.
- CA-02 Dada uma venda confirmada sem conexão, então ela fica numa fila local com identificador único e aparece como “pendente de envio”.
- CA-03 Dado que a conexão volta, então as vendas pendentes são enviadas em ordem, cada uma uma única vez (reenvio não duplica), e o status muda para “enviada”.
- CA-04 Dada uma venda pendente que o servidor recusa (por exemplo, produto desativado), então ela fica marcada “com problema”, com o motivo, para o dono resolver; nada é descartado em silêncio.
- CA-05 Dado estoque insuficiente na sincronização, então a venda é aceita e o produto fica marcado “estoque inconsistente” (S3).
- CA-06 Dado um operador com vendas pendentes, quando tenta sair da conta, então o sistema avisa e bloqueia a saída até o envio.
- CA-07 Dada uma venda feita sem conexão, então a data e a hora são as do aparelho e o servidor guarda também a hora do recebimento.

**Riscos \[H\].** Navegadores podem apagar dados locais; o relógio do aparelho pode estar errado; vendas pendentes se perdem se o aparelho for perdido; dois caixas sem conexão podem vender o mesmo último item; esforço grande. **Se a verificação reprovar:** o PDV mostra aviso claro (CA-11 do PDV nativo), a contingência é anotar e lançar depois, e a F-27 volta para Should.

### 5.19 Funcionalidades Should

**F-13 Fechamento de caixa do dia (onda 2)**

- CA-01 Dado um dia com vendas, quando o operador abre o fechamento, então vê o total por forma de pagamento, o número de vendas, os descontos e os cancelamentos do dia.
- CA-02 Dado o fundo de troco e o valor de dinheiro contado (S26), então o sistema mostra a diferença em relação ao esperado (fundo de troco mais vendas em dinheiro, menos saídas em dinheiro do dia).
- CA-03 Dado um fechamento confirmado, então fica registrado com usuário e hora, e só o dono pode reabri-lo, com log.

**F-14 Despesas recorrentes (onda 1)**

- CA-01 Dada uma despesa marcada para repetir todo mês (valor, dia e categoria), então o sistema cria a despesa pendente do mês seguinte.
- CA-02 Dada a alteração do valor, então vale daí em diante, sem mudar as despesas já lançadas.
- CA-03 Dado o encerramento da recorrência, então as despesas passadas permanecem e nenhuma nova é criada.

**F-15 Importação de produtos por planilha (onda 1)**

- CA-01 Dado o botão de importar, então o sistema oferece um modelo de planilha com as colunas: nome, categoria, código de barras, unidade, custo, preço, estoque, estoque mínimo, tamanho e cor.
- CA-02 Dado um arquivo CSV ou Excel, então o sistema mostra uma prévia e pede confirmação antes de gravar.
- CA-03 Dadas linhas com tamanho e cor, então o sistema agrupa em um produto com variações (F-26).
- CA-04 Dadas linhas inválidas ou com código de barras repetido, então vão para um relatório de rejeitadas com o motivo, e o restante é importado.
- CA-05 Dado qualquer arquivo, então valem as regras de leitura segura e de tamanho máximo da F-12 (CA-09).

**F-17 Inventário em lote (onda 2)**

- CA-01 Dada uma contagem, quando o dono informa a quantidade contada por produto ou variação, então o sistema mostra a diferença para o estoque registrado.
- CA-02 Dada a confirmação, então gera os ajustes com o motivo “inventário” e guarda o histórico com usuário e data.
- CA-03 Dado um inventário em andamento, então pode ser salvo e retomado sem alterar o estoque até a confirmação.

## 6. Telas e fluxos principais

| Tela | Quem usa | Conteúdo mínimo | Onda |
| --- | --- | --- | --- |
| Cadastro e onboarding | Dono | Três etapas: conta, empresa e configurações | 1 |
| Painel | Dono | Indicadores principais, alertas, vencimentos da semana e ícones de ajuda | 1 |
| Produtos | Dono (operador consulta sem custo) | Lista com busca e filtros; cadastro com variações; entrada de mercadoria; ajuste de estoque | 1 |
| Importar produtos | Dono | Modelo de planilha, arquivo, prévia e rejeitadas | 1 |
| Importar vendas | Dono | Arquivo, mapeamento, prévia, resultado e lista “sem vínculo” | 1 |
| Despesas e vencimentos | Dono | Lançar, recorrentes, vencimentos da semana e retirada do dono | 1 |
| Clientes | Dono; operador (sem saldo) | Lista, busca e ficha com compras e saldo | 1 |
| Indicadores | Dono | Valor, período e ajuda de cada indicador | 1 |
| Calculadora de precificação | Dono | Produto, custo, DV%, DF%, ML%, resultado e aplicar preço | 1 |
| Configurações | Dono | Usuários, limite de desconto, dias de funcionamento, categorias e mapeamentos | 1 |
| PDV | Operador e dono | Leitura ou busca, itens, desconto, pagamento, confirmação e comprovante gerencial | 2 |
| Dados para emissão | Dono e operador | Dados da venda, copiar e exportar período | 2 |
| Devolução e troca | Dono | Escolher a venda, os itens e o motivo | 2 |
| Fechamento de caixa e inventário | Operador e dono | Totais do dia, contagem e diferença | 2 |
| Entrada por XML | Dono | Arquivo, prévia, vínculo e confirmação | 3 |
| Contas a receber | Dono | Títulos, vencidos e recebimentos | 3 |
| Fila de vendas sem conexão | Operador e dono | Pendentes, enviadas e com problema | 3 |

**Fluxo da primeira vez (Onda 1).** (1) Cria a conta e a empresa. (2) Importa os produtos por planilha ou cadastra. (3) Importa o relatório de vendas do PDV ou da planilha. (4) Lança as despesas e a retirada. (5) Vê o painel e a calculadora. Meta \[H\], a calibrar em teste: chegar ao primeiro painel com dados numa única sessão.

## 7. Dicionário de indicadores (significado e técnica de cálculo)

Cada indicador do painel tem um ícone de ajuda com o significado, a técnica, os dados usados e as limitações.

| Indicador | O que significa (para o dono) | Técnica de cálculo | Dados usados e limitações |
| --- | --- | --- | --- |
| Faturamento | Quanto o negócio vendeu no período, antes de descontar custos e despesas | Soma do total das vendas confirmadas, pela data da venda (visão gerencial por competência); devoluções (F-28) deduzidas | Vendas. Sem vendas: R$ 0,00. Cancelamentos excluídos |
| Número de vendas e ticket médio | Quantas vendas houve e quanto cada cliente gasta, em média, por compra | Ticket médio = faturamento ÷ número de vendas confirmadas (média aritmética simples) | Indisponível sem vendas |
| Perfil de vendas por dia da semana e horário | Em quais dias e horários o negócio vende mais | Soma do faturamento agrupada por dia da semana e faixa de hora | Exige data e hora; arquivo só com total diário não tem horário |
| CMV (custo da mercadoria vendida) | Quanto custou, para o dono, a mercadoria que foi vendida | Soma de quantidade × custo unitário gravado na venda (custo histórico do momento). No degrau 1 (sem custo por produto): compras de mercadoria do período, como aproximação | Produto sem custo fica fora e o CMV pode ficar subestimado; no degrau 1, comprar mais do que vender faz o custo parecer alto |
| Lucro bruto e margem bruta | O que sobra das vendas depois de pagar a mercadoria, em R$ e em % | Lucro bruto = faturamento − CMV; margem bruta (%) = lucro bruto ÷ faturamento | Indisponível se faturamento = 0 |
| Despesas operacionais (fixas e variáveis) | Gastos para manter o negócio funcionando, sem a mercadoria e sem a retirada do dono. Fixas não mudam com as vendas (aluguel); variáveis mudam (comissão, taxa de cartão) | Soma das despesas pela data de competência, classificadas pelo dono em fixa ou variável; exclui compra de mercadoria para revenda e a retirada do dono | Depende da classificação correta |
| Resultado gerencial | O que sobrou do negócio no período, antes da retirada do dono. Não é o lucro contábil nem a base de imposto | Demonstração de resultado gerencial simplificada: lucro bruto − despesas operacionais | Não inclui impostos nem depreciação que o dono não tenha lançado como despesa |
| Resultado depois da retirada | Se o negócio consegue pagar o próprio dono, ou seja, se ele está pagando para trabalhar | Resultado gerencial − retirada mensal informada pelo dono | Sem retirada informada, o painel avisa. Trabalho de familiar sem salário só entra se o dono lançar |
| Margem de contribuição (%) | De cada R$ 100 vendidos, quanto sobra para pagar as despesas fixas e gerar lucro, depois da mercadoria e das despesas variáveis | Análise custo-volume-lucro: (faturamento − CMV − despesas variáveis) ÷ faturamento | Indisponível se faturamento = 0 |
| Ponto de equilíbrio mensal (R$) | Quanto o negócio precisa vender no mês para cobrir todos os custos e despesas, sem lucro nem prejuízo | Ponto de equilíbrio contábil: despesas fixas ÷ margem de contribuição (%) | Indisponível se a margem for ≤ 0, se não houver despesas fixas lançadas ou se faturamento = 0; informa o motivo |
| Ponto de equilíbrio diário e % atingido | Quanto vender por dia aberto e que parte da meta do mês já foi vendida | Diário = equilíbrio mensal ÷ dias de funcionamento; atingido (%) = faturamento acumulado do mês ÷ equilíbrio mensal, mostrado junto da proporção de dias decorridos | Exige dias de funcionamento informados |
| Fluxo de caixa | Quanto dinheiro entrou, quanto saiu e quanto há disponível | Regime de caixa: saldo inicial + entradas (vendas, na data da venda; recebimentos de fiado, na data do recebimento) − saídas (despesas e compras pagas, na data do pagamento) | Cartão entra no dia da venda, sem taxa nem prazo da operadora (D-05) |
| Vencimentos da semana e saldo projetado | O que vence em 7 dias e se o caixa cobre | Soma das contas a pagar com vencimento nos próximos 7 dias, comparada ao saldo atual de caixa (alerta A5) | Exige vencimentos lançados |
| Crescimento mensal | Quanto as vendas subiram ou caíram frente ao mês anterior | Variação percentual: (faturamento do mês − do mês anterior) ÷ do mês anterior | Indisponível se o mês anterior for zero ou incompleto |
| Valor do estoque a custo | Dinheiro investido em mercadoria parada nas prateleiras | Soma de estoque × custo unitário (valorização a custo, não a preço de venda) | Produto sem custo fica fora |
| Giro de estoque | Quantas vezes o estoque se renova no período; giro alto significa que a mercadoria vende rápido | CMV do período ÷ estoque médio a custo (média simples entre início e fim do período) | Indisponível sem dois pontos de estoque; período curto distorce |
| Cobertura de estoque (dias) | Por quantos dias o estoque atual dura no ritmo de vendas recente | Estoque atual ÷ venda média diária dos últimos 30 dias (média móvel de 30 dias) | Indisponível sem 30 dias de vendas |
| Estoque parado | Mercadoria que não vende e prende dinheiro | Regra de inatividade: produto com estoque e sem venda há mais de 60 dias, em quantidade e em R$ a custo (limite configurável) | Exige 60 dias de histórico |
| Margem e lucro por produto e variação | Quanto cada produto deixa por unidade e no total | Margem unitária = preço − custo; margem % = margem ÷ preço; lucro = quantidade vendida × margem unitária | Produto sem custo fica fora |
| Curva ABC por lucro | Quais poucos produtos geram a maior parte do lucro | Princípio de Pareto: produtos ordenados por lucro e acumulados; A até 80% do lucro, B até 95%, C o restante (limites configuráveis) | Indisponível sem custo; mostra onde olhar, não a causa |
| Descontos concedidos | Quanto foi dado de desconto e quanto pesou nas vendas | Soma dos descontos; % = descontos ÷ faturamento bruto (antes dos descontos) | Vendas com desconto registrado |
| Devoluções (F-28) | Quanto voltou das vendas; muito relevante em roupa | Soma do valor devolvido no período; % = devoluções ÷ faturamento bruto | Existe só com a F-28 |
| Saldo a receber e vencido (F-18) | Quanto os clientes devem e quanto já venceu | Saldo = soma dos títulos em aberto; vencido = títulos com vencimento anterior a hoje; % vencido = vencido ÷ saldo | Existe só com a F-18 |
| Preço sugerido, de equilíbrio e de contribuição; desconto máximo; margens do preço atual | Quanto cobrar e até onde dá para dar desconto | Markup divisor, descrito na seção 5.12 | Exige custo, DV% e DF% |

## 8. Requisitos transversais

### 8.1 Segurança

- Autenticação com token de acesso curto e renovação; senha com bcrypt; limite de tentativas.
- Autorização por perfil, validada no servidor.
- CPF e CNPJ criptografados (AES-256). Como a regra exige unicidade por empresa, usa-se índice cego (hash com chave) para busca e duplicidade; decisão a registrar em ADR-002.
- Tráfego protegido (TLS). Segredos fora do repositório. Dependências revisadas.
- Arquivos enviados (CSV, Excel, XML) lidos como dados, sem executar conteúdo, com tamanho máximo.
- Backup diário com retenção mínima de 30 dias e teste periódico de restauração.
- Monitoramento de erros e alertas de falha crítica.

### 8.2 Dados

Todo registro operacional com UUID, identificador da empresa, datas de criação e alteração e exclusão lógica; valores em DECIMAL(15,2); datas em UTC; auditoria com antes e depois.

### 8.3 Desempenho e disponibilidade

Metas iniciais, a medir antes de prometer em contrato: painel em até 3 s; API em até 500 ms em 95% das chamadas; disponibilidade mínima de 99%. A disponibilidade pesa mais no PDV nativo, porque o caixa depende dele.

### 8.4 Usabilidade

Web responsivo para celular, tablet e computador; o PDV precisa ser usável em celular. Linguagem sem jargão. Teste com 5 pessoas nos fluxos críticos: registrar venda, cadastrar produto, importar vendas e ler o painel.

### 8.5 LGPD

A DATALIS tende a atuar como operadora e a empresa cliente como controladora \[a confirmar com assessoria jurídica\]. Consentimento ou ciência do cliente final registrado (F-11). Política de privacidade, termos de uso e contrato de operador entram no pacote jurídico. Exclusão por solicitação: anonimização que preserva os totais.

### 8.6 Arquitetura

Monólito modular com eventos internos; módulos: acesso, empresa, produtos e estoque, vendas, importação, financeiro, alertas, precificação e relatórios. Registrar em ADR-001 após revisão técnica humana. ADR-002: criptografia de CPF/CNPJ com índice cego. ADR-003: verificação da F-27.

### 8.7 Desenvolvimento e revisão (D-07)

Desenvolvimento com agentes de IA no Antigravity, com **revisão humana obrigatória** por um desenvolvedor externo, contratado por tarefa, sobre um pacote mínimo: (1) isolamento entre empresas; (2) autenticação e permissões; (3) leitura segura de arquivos (F-12, F-15, F-16); (4) cálculos dos indicadores contra a seção 7 e da calculadora contra a seção 5.12; (5) dependências e segredos. O fundador valida as regras de negócio e os critérios de aceite. **Quem será o revisor continua em aberto** e bloqueia a Etapa 3.

**Definição de pronto de cada funcionalidade:** código revisado, testes automáticos passando (incluindo isolamento entre empresas), critérios de aceite verificados e documentação atualizada. Código gerado não é entrega concluída.

## 9. Suposições a revisar

A numeração é compartilhada com a especificação de alimentação (S12 a S14 só existem lá).

- S1 Em parte dos negócios, quem vende não é o dono.
- S2 O dono define um limite de desconto para o operador; sem valor padrão.
- S3 Venda com estoque insuficiente é permitida, com sinalização.
- S4 Uma forma de pagamento por venda.
- S5 Custo unitário = último custo informado na entrada (não custo médio).
- S6 CSV no padrão brasileiro (“;”, UTF-8, vírgula decimal).
- S7 O operador vê só as vendas do dia.
- S8 Estoque parado = 60 dias sem venda, configurável.
- S9 Queda de margem relevante = 3 pontos percentuais, configurável.
- S10 Metas de tempo e telas do PDV (60 s, 3 telas) a calibrar em teste.
- S11 Faturamento pela data da venda; fluxo de caixa pela data de pagamento ou recebimento.
- S15 Arredondamento ao centavo mais próximo.
- S17 Venda importada baixa estoque como a nativa.
- S18 Cobertura calculada com a venda média dos últimos 30 dias; alerta A7 abaixo de 7 dias.
- S19 Curva ABC: A até 80% do lucro acumulado, B até 95%, C o restante.
- S20 A lista de tamanhos vem pré-definida e é editável.
- S21 O limite de crédito por cliente é opcional.
- S22 O alerta A9 considera vencido a partir do dia seguinte ao vencimento.
- S23 A devolução reduz o faturamento do dia em que ocorre, sem reescrever o mês da venda.
- S24 Só o dono registra devolução.
- S25 O operador não vê saldo a receber nem limite de crédito.
- S26 O fechamento de caixa usa um fundo de troco informado.

## 10. O que mudou em relação aos documentos anteriores

| Item anterior | Destino |
| --- | --- |
| Importação de XML de NF-e (RF-23 a RF-26) | Entrou no MVP como F-16, sem tributos (D-13) |
| Simulador de regimes (RF-40) | Won’t (agora) |
| Consulta em linguagem natural e regressão (RF-42, RF-44) | Won’t; sem IA no MVP (D-02) |
| Gateway de pagamento e suspensão por inadimplência (RF-45 a RF-47) | Won’t; cobrança manual (D-06) |
| Exportação para o contador (RF-41) | Parcialmente em F-09 |
| Indicadores das camadas 3 e 4 (churn, LTV, CAC, ROI) | Pós-MVP |
| Integração com maquininhas, bancos e PIX | Won’t; roadmap posterior |
| Academy e painel administrativo do SaaS | Won’t (agora) |
| “Registro manual de venda” do MVP técnico | Substituído por F-12 (importação) e F-05 (PDV nativo) |
| Módulo fiscal e alertas do Simples (MVP técnico) | Só o alerta de limite do MEI como Could (F-19), com validação de contador |
| Onboarding com CNAE, porte e cores (Documento Técnico) | Fora; onboarding enxuto (F-01) |
| Funcionários, comissões e agenda (perfis da Especificação Funcional) | Fora do MVP |
| Índice “Saúde da Empresa” | Could (F-22), depende de método documentado |
| “Lucro líquido” (Receita − Despesas) | Renomeado para “resultado gerencial” |
| Roadmap de seis fases | Mantido como visão; o MVP cobre a fase de organização e parte da de indicadores |

## 11. Relação com a especificação de alimentação

A especificação de alimentação (v0.2) continua salva e não foi descartada. As duas compartilham a entrada de vendas (importação e PDV nativo), o catálogo de indicadores essenciais, o relatório “Dados para emissão” e os requisitos de segurança. O comércio varejista troca a ficha técnica e o mix por prato por código de barras, variações de tamanho e cor, giro e cobertura de estoque, e calculadora de precificação. A escolha do perfil é a D-01 acima.

## 12. Próximos passos

1. O fundador revisa esta v1.1.
2. Definir o revisor técnico do código, pendência que bloqueia a Etapa 3 (seção 8.7).
3. Modelo de dados e registros de decisão: ADR-001 (arquitetura), ADR-002 (CPF/CNPJ com índice cego) e ADR-003 (verificação da venda sem internet).
4. Plano de negócio: receita, custos, orçamento até a Onda 1 e valores dos dois planos, com base no piloto.
5. Pacote de constituição da empresa e documentos jurídicos, em rascunho para revisão jurídica, depois da D-09.
