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
    // Aceita 200 ou 204 como sucesso de preflight
    const isOk = res.status === 200 || res.status === 204;
    assertEquals(isOk, true, `Function ${name} deve responder ao preflight CORS (recebido: ${res.status})`);
  }
});


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
