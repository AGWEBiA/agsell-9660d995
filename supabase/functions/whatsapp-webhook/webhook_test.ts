import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Suite de Testes de Integração para Automações e Webhooks
 */
Deno.test("Conectividade das Edge Functions", async () => {
  const functions = ['whatsapp-webhook', 'process-automation', 'send-whatsapp', 'evolution-qrcode'];
  for (const name of functions) {
    const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`, {
      method: 'OPTIONS',
      headers: { 'Origin': 'http://localhost:3000' }
    });
    assertEquals(res.status, 204, `Function ${name} deve responder ao preflight CORS`);
  }
});


/**
 * Suite de Testes de Integração para Automações e Webhooks
 * 
 * Este script valida:
 * 1. Conectividade das Edge Functions críticas.
 * 2. Fluxo de recebimento de webhook simulado.
 * 3. Gatilhos de automação (keywords).
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.test("WhatsApp Webhook - Simulação de Recebimento", async () => {
  const payload = {
    "instance": "test_instance",
    "data": {
      "key": {
        "remoteJid": "5511999998888@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST_MSG_" + Date.now()
      },
      "pushName": "Lead de Teste",
      "message": {
        "conversation": "Quero saber mais sobre o sistema"
      },
      "messageType": "conversation"
    },
    "event": "messages.upsert"
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/whatsapp-webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  assertEquals(response.status, 200, "Webhook deve retornar HTTP 200");
  assertEquals(result.success, true, "Webhook deve processar com sucesso");
});

Deno.test("Process Automation - Validação de Gatilho de Keyword", async () => {
  // 1. Obter um usuário real para associar à automação (necessário para RLS/Audit)
  const { data: userData } = await supabase.from('profiles').select('user_id').limit(1).single();
  const userId = userData?.user_id;

  // 2. Criar uma organização temporária para o teste
  const { data: org } = await supabase.from('organizations').insert({
    name: "Org de Teste Automação",
    slug: "test-automation-" + Date.now()
  }).select().single();

  assertExists(org, "Deve criar organização de teste");

  // 3. Criar uma automação de teste com trigger de keyword
  const { data: automation } = await supabase.from('automations').insert({
    organization_id: org.id,
    user_id: userId,
    name: "Automação Teste Keyword",
    trigger_type: "whatsapp_keyword",
    trigger_config: { keyword: "teste_unitario" },
    actions: [
      { type: "send_whatsapp", config: { message: "Resposta automatica de teste" } }
    ],
    is_active: true
  }).select().single();

  assertExists(automation, "Deve criar automação de teste");

  // 3. Simular disparo
  const payload = {
    automation_id: automation.id,
    trigger_event: "whatsapp_keyword",
    trigger_data: { message: "Isso é um teste_unitario" }
  };

  const response = await fetch(`${SUPABASE_URL}/functions/v1/process-automation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  assertEquals(response.status, 200, "Automação deve aceitar o disparo");
  
  // Limpeza
  await supabase.from('automations').delete().eq('id', automation.id);
  await supabase.from('organizations').delete().eq('id', org.id);
});
