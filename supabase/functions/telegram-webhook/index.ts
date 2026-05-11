import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { message, update_id } = body;

    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat?.id;
    const text = message.text || "";
    const fromUser = message.from;

    // Find bot by checking which org has this webhook configured
    // The webhook URL includes the bot ID in query params
    const url = new URL(req.url);
    const botId = url.searchParams.get("bot_id");

    if (!botId) {
      return new Response(JSON.stringify({ error: "Missing bot_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: bot } = await supabase
      .from("telegram_bots")
      .select("*")
      .eq("id", botId)
      .eq("is_active", true)
      .single();

    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get organization settings for bot token
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", bot.organization_id)
      .single();

    const botToken = org?.settings?.telegram_bot_token;
    if (!botToken) {
      console.error("No telegram bot token configured for org:", bot.organization_id);
      return new Response(JSON.stringify({ error: "Bot token not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to find or create contact
    const phone = fromUser?.phone_number || null;
    const firstName = fromUser?.first_name || "Telegram User";
    const lastName = fromUser?.last_name || null;

    let contactId: string | null = null;

    if (phone) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("organization_id", bot.organization_id)
        .eq("phone", phone)
        .limit(1)
        .single();

      contactId = existingContact?.id || null;
    }

    // Create or find conversation
    const { data: existingConv } = await supabase
      .from("conversations")
      .select("id")
      .eq("organization_id", bot.organization_id)
      .eq("channel", "telegram")
      .eq("metadata->>telegram_chat_id", String(chatId))
      .eq("status", "open")
      .limit(1)
      .single();

    let conversationId: string;

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      // Get org owner for user_id
      const { data: owner } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", bot.organization_id)
        .eq("role", "owner")
        .limit(1)
        .single();

      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          organization_id: bot.organization_id,
          user_id: owner?.user_id,
          contact_id: contactId,
          channel: "telegram",
          status: "open",
          metadata: {
            telegram_chat_id: String(chatId),
            telegram_username: fromUser?.username || null,
            telegram_first_name: firstName,
          },
        })
        .select()
        .single();

      conversationId = newConv!.id;
    }

    // Save message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      content: text,
      sender_type: "contact",
    });

    // Update conversation
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    // Trigger Flow Builder Automations
    const { data: automations } = await supabase
      .from("automations")
      .select("id, trigger_type, trigger_config")
      .eq("organization_id", bot.organization_id)
      .in("trigger_type", ["telegram_message", "telegram_keyword"])
      .eq("is_active", true);

    if (automations && automations.length > 0 && contactId) {
      for (const auto of automations) {
        const config = auto.trigger_config as Record<string, unknown> || {};
        
        // For keyword triggers, check if message matches
        if (auto.trigger_type === "telegram_keyword") {
          const kw = String(config.keyword || "").toLowerCase();
          if (!kw || !text.toLowerCase().includes(kw)) continue;
        }

        fetch(`${supabaseUrl}/functions/v1/process-automation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
            "X-Internal-Cron": "true",
          },
          body: JSON.stringify({
            automation_id: auto.id,
            contact_id: contactId,
            trigger_event: auto.trigger_type,
            trigger_data: { message: text }
          }),
        }).catch(err => console.error("Error dispatching Telegram automation:", err));
      }
    }

    // Check if AI agent should respond
    const { data: agents } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("organization_id", bot.organization_id)
      .eq("is_active", true)
      .contains("channels", ["telegram"]);

    if (agents && agents.length > 0) {
      const agent = agents[0];
      // Call AI chat for response
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: agent.system_prompt },
            { role: "user", content: text },
          ],
        }),
      });

      const aiData = await aiResponse.json();
      const replyText = aiData.message || agent.fallback_message || "Desculpe, não consegui processar sua mensagem.";

      // Send reply via Telegram API
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "Markdown",
        }),
      });

      // Save bot reply
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        content: replyText,
        sender_type: "agent",
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
