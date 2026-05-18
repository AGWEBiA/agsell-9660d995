# 🧪 Sandbox de Automações — Criar, Testar, Validar, Publicar

Sistema completo para testar automações com dados reais (mas isolados) antes de ativá-las em produção, com timeline visual em tempo real e aprovação compartilhável com o cliente.

## Fluxo do usuário

```
Rascunho → ▶ Testar → Timeline ao vivo → 📤 Compartilhar p/ Cliente → ✅ Aprovado → 🚀 Publicar
```

## Estados das Automações

Adicionar coluna `lifecycle_status` em `automations`, `whatsapp_flows`, `sequences`, `communication_campaigns`:
- `draft` — Criando
- `testing` — Em validação (executou ao menos 1 simulação)
- `pending_approval` — Aguardando OK do cliente (link compartilhado)
- `approved` — Cliente aprovou, pronto para publicar
- `published` — Ativa em produção

Botão **"Publicar"** fica desabilitado até `lifecycle_status = 'approved'` (ou `testing` se for aprovação interna apenas).

## Componentes Novos

### 1. Painel Lateral "Modo Teste" (no Flow Builder e Automations)
- **Componente**: `src/components/automation/SandboxTestPanel.tsx`
- Campos:
  - Número WhatsApp de teste (default = telefone do usuário logado)
  - Contato Mock: criar lead fictício ou escolher contato existente marcado como `is_test`
  - Variáveis customizadas (input dinâmico para `{{nome}}`, `{{empresa}}`, etc)
  - Webhook URL de teste (opcional, para receber payloads)
- Botão **"▶ Executar Simulação"**

### 2. Timeline Visual em Tempo Real
- **Componente**: `src/components/automation/SandboxTimeline.tsx`
- Lista de execução de cada nó com:
  - Ícone status (✅ sucesso / ⏳ executando / ❌ erro / ⏭ pulado)
  - Timestamp
  - Conteúdo enviado/recebido
  - Branch tomada em condicionais
- **Highlight no canvas**: nós ficam coloridos conforme execução (verde/vermelho/amarelo)
- Subscribe via Supabase Realtime na tabela `sandbox_executions`

### 3. Página de Aprovação do Cliente
- **Rota pública**: `/aprovar-automacao/:token`
- **Componente**: `src/pages/AutomationApproval.tsx`
- Mostra:
  - Nome e descrição da automação
  - Canvas visual readonly do fluxo
  - Botão "Testar no Meu WhatsApp" (executa sandbox com número do cliente)
  - Lista de comentários por nó
  - Botões: ✅ **Aprovar** / 🔄 **Solicitar Ajustes**
- Sem login necessário (token único)

## Arquitetura Técnica

### Tabelas Novas (migration)

```sql
-- Execuções de teste (logs)
CREATE TABLE sandbox_executions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  automation_id uuid,
  automation_type text, -- 'flow' | 'automation' | 'sequence' | 'campaign'
  test_phone text,
  test_contact_id uuid,
  test_variables jsonb,
  status text, -- 'running' | 'completed' | 'failed' | 'cancelled'
  started_at timestamptz,
  completed_at timestamptz,
  triggered_by uuid -- user_id
);

-- Cada step executado
CREATE TABLE sandbox_step_logs (
  id uuid PRIMARY KEY,
  execution_id uuid REFERENCES sandbox_executions,
  node_id text,
  node_type text,
  status text, -- 'pending' | 'running' | 'success' | 'error' | 'skipped'
  input jsonb,
  output jsonb,
  error_message text,
  duration_ms int,
  executed_at timestamptz
);

-- Links de aprovação
CREATE TABLE automation_approval_links (
  id uuid PRIMARY KEY,
  organization_id uuid,
  automation_id uuid,
  automation_type text,
  token text UNIQUE, -- url-safe random
  status text, -- 'pending' | 'approved' | 'changes_requested'
  client_feedback text,
  client_test_phone text,
  expires_at timestamptz,
  approved_at timestamptz,
  created_by uuid
);

-- Comentários por nó (cliente solicita ajustes)
CREATE TABLE automation_node_comments (
  id uuid PRIMARY KEY,
  approval_link_id uuid,
  node_id text,
  comment text,
  resolved boolean DEFAULT false,
  created_at timestamptz
);
```

Adicionar coluna `lifecycle_status` e `is_test` (em contacts).

### Edge Functions Novas

1. **`execute-sandbox`** — Engine de teste. Reusa lógica de `process-automation` / `execute-flow-step` mas com flag `mode='test'`:
   - Mensagens WhatsApp só vão para `test_phone` cadastrado
   - Webhooks externos: envia para URL de teste OU pula
   - NÃO cria contatos/deals reais
   - NÃO consome créditos SMS/VoIP (apenas registra)
   - Respeita delays reais (decisão do usuário)
   - Grava cada step em `sandbox_step_logs` para timeline realtime

2. **`create-approval-link`** — Gera token único e URL compartilhável

3. **`approve-automation`** — Endpoint público que valida token e atualiza status

### Hooks

- `useSandboxExecution(automationId)` — Subscribe realtime nos logs
- `useApprovalLinks(automationId)` — CRUD de links de aprovação
- `useAutomationLifecycle(id, type)` — Transições de estado

## Integrações por Módulo

| Módulo | Onde aparece o botão Testar |
|---|---|
| **Flow Builder** (WhatsApp Chatbot) | Toolbar topo, ao lado de "Salvar" |
| **Automations V2** | Header da automação |
| **Sequences** | Header da sequência |
| **Communication Campaigns** | Antes do botão "Agendar/Enviar" |

Cada um chama `execute-sandbox` com `automation_type` apropriado.

## Validações Automáticas (Pré-Publicação)

Antes de publicar, validar:
- ✅ Ao menos 1 sandbox_execution com status `completed`
- ✅ Sem nós órfãos (sem conexão de saída exceto end-nodes)
- ✅ Todas mensagens preenchidas
- ✅ Webhooks com URL válida (http/https)
- ✅ Variáveis usadas existem no contexto disponível

Componente `ValidationChecklist.tsx` mostra checklist visual.

## Plano de Entrega (3 fases)

### Fase 1 — Infraestrutura + Flow Builder (MVP funcional)
1. Migration: tabelas + colunas
2. Edge function `execute-sandbox` (suporte inicial: WhatsApp Flow)
3. `SandboxTestPanel` + `SandboxTimeline` no Flow Builder
4. Highlight de nós no canvas durante execução
5. Estados de lifecycle no flow

### Fase 2 — Aprovação do Cliente
6. Migration: `automation_approval_links` + `automation_node_comments`
7. Edge functions `create-approval-link` + `approve-automation`
8. Página pública `/aprovar-automacao/:token`
9. Dialog "Compartilhar para Aprovação" no Flow Builder
10. Validações pré-publicação

### Fase 3 — Cobertura Total
11. Estender `execute-sandbox` para Automations V2
12. Estender para Sequences
13. Estender para Communication Campaigns
14. Dashboard global de "Automações em Teste/Aprovação" no admin

## Considerações Importantes

- **Custo**: Mensagens WhatsApp de teste **são reais** (consomem instância), apenas roteadas para número de teste. Avisar isso ao usuário.
- **Performance**: Subscribe realtime apenas durante execução ativa (cleanup ao desmontar).
- **Segurança**: Token de aprovação expira em 7 dias (configurável), 1 link ativo por automação.
- **Reaproveitamento**: O engine de teste reusa 90% do código de produção (apenas adapta saídas e flags `mode='test'`).

## Estimativa
Fase 1: ~6-8 arquivos novos + 2 migrations
Fase 2: ~5 arquivos novos + 1 migration  
Fase 3: ~3 arquivos modificados

Após sua aprovação, começo pela **Fase 1** (modo teste funcionando ponta a ponta no Flow Builder do chatbot WhatsApp da imagem).
