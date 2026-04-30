# TitaNet — Plataforma de Gestão para Provedores de Internet
# TitaNet (Next.js)

Pequeno guia para desenvolver e rodar este projeto localmente, usando Docker ou Codespaces, e como publicar no GitHub.

Pré-requisitos
- Node.js 20+ (opcional se usar Docker/Codespaces)
- Docker (opcional)
- Git e GitHub CLI (opcional)

Rodando localmente (sem Docker)

1. Copie o arquivo de ambiente e ajuste as variáveis (ex: DATABASE_URL, NEXTAUTH_SECRET):

```powershell
cd 'c:\Users\HP\Documents\Apps\titanet\nextjs_space'
copy .env.example .env  # se existir
# editar .env com seu editor
```

2. Instale dependências e rode em dev:

```powershell

Sistema completo para ISPs com cadastro de clientes, planos, contratos e integrações modulares para Receita Federal, OLT, MikroTik e assinatura digital.

## Arquitetura

```
nextjs_space/
├── app/

3. Acesse http://localhost:3000

Rodando com Docker

1. Build e run:

```powershell
│   ├── (panel)/        # Painel autenticado
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── plans/
│   │   ├── contracts/
│   │   └── settings/

2. Ou usando docker-compose:

```powershell
│   ├── api/            # APIs REST
│   │   ├── customers/

Codespaces / DevContainer

Abra o repositório no GitHub e clique em Code → Open with Codespaces, ou abra localmente com VS Code Remote - Containers.
O container irá rodar `npm ci` automaticamente.

CI / Publicação de Imagem

Há um workflow (`.github/workflows/docker-publish.yml`) que constrói e publica uma imagem para o GitHub Container Registry (`ghcr.io`) quando houver push na branch `main`. Ajuste secrets se necessário.

Próximos passos
- Adicione secrets no repositório GitHub (DATABASE_URL, AWS_*, NEXTAUTH_SECRET, etc.)
- Se quiser deploy automático, conecte o repositório ao Vercel ou configure um workflow de deploy para o seu provedor.
│   │   ├── plans/
│   │   ├── contracts/
│   │   ├── settings/
│   │   ├── dashboard/
│   │   └── integrations/   # Pontos de integração externos
│   │       ├── receita-federal/
│   │       ├── olt/
│   │       ├── mikrotik/
│   │       └── signature/
│   ├── login/ signup/
│   └── layout.tsx
├── components/
├── lib/              # auth, db, helpers, formatters
├── prisma/schema.prisma
└── scripts/seed.ts
```

## Como adicionar novas integrações

### Receita Federal
Arquivo: `app/api/integrations/receita-federal/route.ts`. Substitua o bloco MOCK por uma chamada real (ex: `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`) e mapeie os campos retornados para `ReceitaFederalData`.

### OLT (Sinal ONU)
Arquivo: `app/api/integrations/olt/signal/route.ts`. Use SNMP, SSH/Telnet ou API REST/SOAP do fabricante. Atualize: `signalDbm`, `txPower`, `rxPower`, `status`.

### MikroTik
Arquivo: `app/api/integrations/mikrotik/status/route.ts`. Use a API nativa do RouterOS (porta 8728) com `node-routeros` ou a REST API (RouterOS v7+).

### Assinatura Digital
Arquivo: `app/api/integrations/signature/send/route.ts`. Suporta integração futura com ClickSign, DocuSign, Autentique ou ZapSign.

## Personalização de cores
A paleta padrão é azul (`#0066CC`) e branco. Acesse **Configurações → Cores** para personalizar; as alterações são aplicadas em tempo real ao painel.

## Tabelas principais
- `User` — administradores do painel
- `Customer` — clientes do provedor (CPF/CNPJ, endereço, plano, infra)
- `Plan` — planos ofertados
- `Contract` — contratos gerados
- `Settings` — configurações únicas (singleton) com cores e chaves

## Pontos de extensão
- Cada integração externa está em pasta isolada com comentários `[MOCK]` indicando exatamente onde colocar a lógica real.
- Novos módulos podem ser adicionados criando uma rota em `app/(panel)/`, sua API em `app/api/` e os componentes em `components/panel/`.
