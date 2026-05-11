# Checklist de Estabilidade e Resiliência de Publish

Este checklist deve ser seguido antes de cada tentativa de Publish para mitigar falhas causadas por instabilidade externa.

## 1. Verificações de Ambiente
- [ ] O banco de dados Supabase (Live) está respondendo em menos de 2s? (Verificar em `/deploy-status`).
- [ ] Todas as Variáveis de Ambiente (`VITE_SUPABASE_URL`, etc.) estão configuradas no painel da Lovable?
- [ ] Não há migrações pendentes que alterem colunas usadas pelo frontend?

## 2. Testes Pré-Publish (Local)
- [ ] `bun run build` completa sem erros de memória?
- [ ] `bun x tsc --noEmit` não aponta erros de tipos em `src/integrations/supabase/types.ts`?
- [ ] O `localStorage` de erros está vazio ou sincronizando?

## 3. Sobrevivência em Caso de Supabase Offline
- [ ] O App exibe o toast de "Conexão Lenta" em vez de travar a tela?
- [ ] Erros estão sendo salvos no `localStorage` para sincronização posterior?
- [ ] As Edge Functions críticas possuem timeout configurado (max 20s)?

## 4. Plano de Fuga (Migração DigitalOcean)
Se o publish falhar 3x seguidas por timeout de infraestrutura:
1. Ativar o repositório GitHub.
2. Configurar o **DigitalOcean App Platform** apontando para o repo.
3. Usar um **Droplet de 4GB RAM** para rodar os processos pesados de automação.
4. Mover o Banco para um **DO Managed PostgreSQL** para garantir 99.9% de uptime e evitar timeouts 544.
