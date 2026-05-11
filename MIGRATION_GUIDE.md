# Guia de Migração para Cloud Externo - AG Sell

Este documento detalha o processo para migrar o backend/frontend do AG Sell para um provedor externo (ex: AWS, Google Cloud, DigitalOcean) mantendo a compatibilidade com o desenvolvimento na Lovable.

## 1. Requisitos de Infraestrutura
- **Node.js 20+** (para o Frontend)
- **Deno 1.37+** (para as Edge Functions)
- **PostgreSQL 15+** (ou manter o Supabase como DB)
- **Docker & Docker Compose** (recomendado para orquestração)

## 2. Preparação do Banco de Dados
Se optar por sair totalmente do Supabase:
1. Faça o dump do banco atual: `pg_dump -h db.rcxrkvwxlzwzrllwdwgz.supabase.co -U postgres -d postgres > backup.sql`
2. Restaure no novo host.
3. Atualize as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 3. Implantação do Frontend (Vite/React)
```bash
# Build
npm install
npm run build

# O conteúdo da pasta /dist pode ser servido via Nginx, Apache ou S3/CloudFront.
```

## 4. Implantação do Backend (Edge Functions)
As funções foram escritas para Deno. No cloud externo, você pode usar o `supabase/edge-runtime` via Docker:
```yaml
services:
  edge-runtime:
    image: supabase/edge-runtime:latest
    ports:
      - "8000:8000"
    volumes:
      - ./supabase/functions:/home/deno/functions
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
```

## 5. Estratégia de Rollback
1. **Blue/Green Deployment**: Mantenha a versão antiga rodando em um bucket/servidor separado.
2. **DNS Switch**: Aponte o CNAME para o novo endereço. Se houver falha, retorne o CNAME para a Lovable Cloud (`site.agsell.com.br`).
3. **Monitoramento**: Use o `GlobalErrorBoundary` e o `logSystemError` implementados para detectar erros pós-migração.

## 6. Sincronização de Desenvolvimento
Para continuar usando a Lovable após a migração:
1. Use o GitHub Integration da Lovable.
2. Configure um pipeline de CI/CD (GitHub Actions) que faz o deploy automático para sua cloud externa sempre que houver um push da Lovable para o branch `main`.
