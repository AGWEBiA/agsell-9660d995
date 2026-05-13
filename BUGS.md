# Registro de Memória de Bugs e Soluções (Bug Log)

Este documento registra falhas identificadas, soluções aplicadas e lições aprendidas para evitar regressões e garantir a estabilidade do sistema em ambos os ambientes (Lovable Cloud e Produção Externa).

## [13/05/2026] Estabilidade de Automações e Webhooks

### 1. Bug: "Bucket Not Found" no Servidor Externo
- **Problema:** O script de provisionamento de infraestrutura (`setup_target_buckets.ts`) estava incompleto. Buckets como `avatars`, `contacts` e `automation-assets` não existiam no servidor de produção, causando erros 404 ao tentar salvar ou ler mídias em automações e perfis.
- **Solução:** Atualização do script de provisionamento para incluir a lista completa de buckets e aplicação de migração SQL para garantir políticas de acesso público/privado corretas.
- **Prevenção:** Sempre consultar a lista de buckets usados em `rg "storage.from"` antes de novos deploys.

### 2. Gargalo: Timeout no WhatsApp Webhook (Performance)
- **Problema:** A função `whatsapp-webhook` carregava até 2.000 contatos para a memória a cada mensagem recebida para fazer busca local (JavaScript `.filter`). Em organizações grandes, isso estourava o limite de execução/timeout.
- **Solução:** Refatoração para busca via SQL direto no banco de dados (`.or("whatsapp.in.(...),phone.in.(...)")`) e adição de índices nas colunas `phone` e `whatsapp`.
- **Prevenção:** Proibido carregar listas de contatos para memória em Edge Functions. Use sempre consultas filtradas.

### 3. Falha: "Invalid Claim" em Automações Internas
- **Problema:** Chamadas de sistema (ex: Webhook disparando Automação) falhavam por erro de JWT. A lógica de bypass de `SUPABASE_ANON_KEY` não era resiliente a variações no envio de headers ou ausência da variável.
- **Solução:** Unificação da lógica de `isInternalCron` nas funções `process-automation` e `evolution-qrcode`, garantindo que o token de serviço ou o anon_key (com header correto) sejam validados com prioridade sobre a sessão do usuário.
- **Tentativa Falha:** Tentar usar apenas `Authorization` sem o header `X-Internal-Cron` em ambientes onde o RLS bloqueia o Service Role em algumas tabelas específicas (necessário manter ambos para compatibilidade).

### 4. Regressão: Vinculação de Instagram em Fluxo de Sistema
- **Problema:** Ao vincular contas via processos automáticos (sem interação manual do usuário), o campo `connected_by` ficava nulo, o que era rejeitado por restrições de integridade da tabela.
- **Solução:** Adicionado fallback para um UUID de sistema ("00000000-0000-0000-0000-000000000000") quando a operação é disparada internamente.

---
*Este log deve ser consultado antes de qualquer alteração estrutural nas Edge Functions ou no Schema do Banco de Dados.*
