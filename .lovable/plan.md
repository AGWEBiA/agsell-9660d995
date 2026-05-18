
## Objetivo

Permitir cadastrar **OpenAI API Key** e **Gemini API Key** direto no painel admin (salvas em `platform_settings`), escolher qual provedor é o **padrão**, e fazer todas as edge functions de IA lerem dinamicamente do banco — sem depender de secrets do Supabase para isso.

## Arquitetura

```text
Admin Panel (UI)
   ↓ salva
platform_settings (DB)
   ├─ ai_openai_api_key
   ├─ ai_gemini_api_key
   ├─ ai_default_provider   (openai | gemini)
   └─ ai_model_mapping      (qual modelo usar p/ cada tarefa)
   ↑ lê
_shared/ai-router.ts  (helper compartilhado)
   ↑ usa
ai-builder, ai-chat, analyze-sentiment, crm-next-action,
predict-win, lead-scoring, support-agent, etc.
```

## Etapas

### 1. Banco (migration)
- Garantir que `platform_settings` tenha as chaves:
  - `ai_openai_api_key` (texto, criptografado/masked no retorno)
  - `ai_gemini_api_key`
  - `ai_default_provider` (`openai` | `gemini`)
  - `ai_fallback_enabled` (bool — se padrão falhar, tenta o outro)
- RPC `get_ai_config()` com `SECURITY DEFINER` que retorna apenas para **admin** ou para edge functions via service role. Para usuários comuns, retorna apenas mascarado (`sk-***...***xyz`).

### 2. Shared helper: `supabase/functions/_shared/ai-router.ts`
- Função `callAI({ task, messages, jsonMode, temperature, maxTokens })`
- Lê config do banco (com cache de 60s em memória)
- Roteia para OpenAI (`api.openai.com/v1/chat/completions`) ou Gemini (`generativelanguage.googleapis.com/v1beta/models/...:generateContent`)
- Mapeia modelos por tarefa:
  - `fast` → `gpt-4o-mini` | `gemini-2.5-flash`
  - `reasoning` → `gpt-4o` | `gemini-2.5-pro`
  - `nano` → `gpt-4o-mini` | `gemini-2.5-flash-lite`
- Se `ai_fallback_enabled` e provedor padrão falhar (5xx/429/402), tenta o outro automaticamente
- Normaliza resposta para um shape único: `{ content, model, provider, usage }`

### 3. Refatorar edge functions de IA
Substituir `fetch("api.lovable.dev/...")` por `callAI(...)` em:
- `ai-builder`
- `ai-chat`
- `analyze-sentiment`
- `crm-next-action`
- `predict-win`
- `lead-scoring` (se existir)
- `support-agent` / agentes IA
- `predictive-sending`
- Qualquer outra que use `LOVABLE_API_KEY` + `api.lovable.dev`

### 4. UI Admin
Nova aba **"IA & Modelos"** em `src/pages/Admin.tsx` (ou seção existente de integrações):
- Card **OpenAI**: input pra API Key (masked após salvar), botão "Testar conexão"
- Card **Gemini**: idem
- Toggle **Provedor padrão** (OpenAI / Gemini)
- Toggle **Fallback automático**
- Tabela mostrando o mapeamento de modelos por tarefa (read-only por enquanto)
- Status: "✅ Configurado" / "⚠️ Não configurado"
- Botão "Testar IA" que chama uma edge function `test-ai-config` e mostra resposta

### 5. Fallback de secrets (compatibilidade)
O helper `callAI` segue esta ordem de prioridade ao buscar a key:
1. `platform_settings.ai_openai_api_key` (DB)
2. `Deno.env.get("OPENAI_API_KEY")` (secret do Supabase) — fallback
3. Erro claro se nenhum dos dois existir

Isso garante que a `OPENAI_API_KEY` que você já cadastrou no Supabase continua funcionando mesmo antes de configurar pelo painel.

## Detalhes Técnicos

**Segurança da key no painel:**
- RPC `get_ai_config_masked()` retorna `sk-proj-***...***a3f9` para a UI
- RPC `update_ai_config(provider, api_key)` apenas para `has_role(auth.uid(), 'admin')`
- Service role (edge functions) usa `get_ai_config_internal()` que retorna a key completa

**Cache no edge function:**
- Cada cold start busca do DB 1x e mantém em memória por 60s
- Evita 1 query por chamada de IA

**Tarefas → modelo:**
Hardcoded no `_shared/ai-router.ts` (não precisa UI configurável agora):
```ts
const MODEL_MAP = {
  openai: { fast: "gpt-4o-mini", reasoning: "gpt-4o", nano: "gpt-4o-mini" },
  gemini: { fast: "gemini-2.5-flash", reasoning: "gemini-2.5-pro", nano: "gemini-2.5-flash-lite" }
};
```

**Não vou mexer em:**
- `LOVABLE_API_KEY` (já era esperado quebrar fora da Lovable Cloud)
- Edge functions que não são de IA

## Entregáveis

1. Migration adicionando colunas + 3 RPCs em `platform_settings`
2. `supabase/functions/_shared/ai-router.ts`
3. ~7-8 edge functions de IA refatoradas
4. `supabase/functions/test-ai-config/index.ts` (novo, para o botão de teste)
5. Nova aba no Admin: `src/components/admin/AIProviderSettings.tsx`
6. Hook `src/hooks/useAIConfig.ts` para gerenciar estado

## Fora de escopo (próxima fase, se quiser)
- UI para customizar mapeamento tarefa→modelo
- Métricas de uso (tokens/custo por provedor)
- Suporte a Anthropic/outros provedores
