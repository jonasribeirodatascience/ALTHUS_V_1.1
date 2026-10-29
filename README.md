# ALTHUS by DATALIS (v1.1)

> Sistema de Gestão e Inteligência para Comércio Varejista — MVP v1.1

---

## 📌 Visão Geral

O **ALTHUS** é uma plataforma focada no varejo com gestão de produtos, precificação inteligente, controle de estoque, faturamento, conciliação e geração de alertas operacionais e gerenciais.

O projeto é estruturado em formato **monorepo**:
- **`packages/client`**: Frontend SPA desenvolvido em React, TypeScript, Vite e Tailwind CSS.
- **`packages/server`**: Backend RESTful construído em Node.js com Fastify, TypeScript e integração PostgreSQL/Supabase.
- **`packages/shared`**: Biblioteca compartilhada de tipos TypeScript, motor de precificação, métricas e utilitários.

---

## 🛠️ Tecnologias

- **Linguagens**: TypeScript, SQL, HTML, CSS
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Fastify, JWT, bcrypt, AES-256 / Blind Index (LGPD)
- **Banco de Dados**: PostgreSQL (Supabase / local)
- **Documentação**: Especificação funcional e técnica detalhada incluída no repositório

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js**: v18+ ou v20+ recomendado
- **npm** ou gerenciador de pacotes equivalente

### 1. Clonar o repositório
```bash
git clone https://github.com/jonasribeirodatascience/ALTHUS_V_1.1.git
cd ALTHUS_V_1.1
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e preencha as variáveis de acordo com seu ambiente:
```bash
cp .env.example .env
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Executar em modo de desenvolvimento
```bash
# Executa servidor e cliente concorrentemente:
npm run dev

# Ou execute individualmente:
npm run dev:server
npm run dev:client
```

---

## 🧪 Scripts Disponíveis

Na raiz do monorepo:
- `npm run dev`: Inicializa simultaneamente os pacotes `server` e `client`.
- `npm run build`: Compila todos os pacotes do monorepo.
- `npm run test`: Executa os testes disponíveis nos workspaces.

---

## 🔒 Segurança e Privacidade

- **Criptografia em Repouso**: Dados sensíveis e identificadores pessoais são protegidos utilizando AES-256 e Blind Indexing para aderência à LGPD (ADR-002).
- **Proteção de Credenciais**: Arquivos `.env` e chaves privadas nunca são versionados no Git (protegidos via `.gitignore`).

---

## 📄 Licença

Propriedade de DATALIS SOLUÇÕES. Todos os direitos reservados.
