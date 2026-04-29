import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Sem usuário' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { contact_id } = await req.json();
    if (!contact_id) return new Response(JSON.stringify({ error: 'contact_id obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Fetch context
    const [{ data: contact }, { data: deals }, { data: activities }, { data: messages }, { data: tasks }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contact_id).single(),
      supabase.from('deals').select('id,title,value,status,stage_id,last_stage_change_at').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(5),
      supabase.from('activities').select('type,description,created_at').eq('contact_id', contact_id).order('created_at', { ascending: false }).limit(10),
      supabase.from('messages').select('content,sender_type,created_at,conversation_id').in('conversation_id',
        (await supabase.from('conversations').select('id').eq('contact_id', contact_id)).data?.map(c => c.id) || []
      ).order('created_at', { ascending: false }).limit(10),
      supabase.from('tasks').select('title,status,due_date').eq('contact_id', contact_id).limit(5),
    ]);

    if (!contact) return new Response(JSON.stringify({ error: 'Contato não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const lastMsg = messages?.[0];
    const lastActivity = activities?.[0];
    const daysSinceContact = lastMsg ? Math.floor((Date.now() - new Date(lastMsg.created_at).getTime()) / 86400000) : null;

    const prompt = `Você é um assistente de vendas analisando um lead. Sugira UMA próxima ação concreta e prática.

CONTATO:
- Nome: ${contact.first_name} ${contact.last_name || ''}
- Email: ${contact.email || 'sem email'}
- WhatsApp: ${contact.whatsapp || contact.phone || 'sem telefone'}
- Status: ${contact.status || 'active'}
- Lead Score: ${contact.lead_score ?? 0}/100
- Origem: ${contact.source || 'desconhecida'}
- Notas: ${contact.notes || 'nenhuma'}

DEALS (${deals?.length || 0}):
${deals?.map(d => `- ${d.title} | R$${d.value} | ${d.status}`).join('\n') || 'nenhum deal'}

ÚLTIMAS ATIVIDADES (${activities?.length || 0}):
${activities?.slice(0, 5).map(a => `- ${a.type}: ${a.description?.substring(0, 80)}`).join('\n') || 'nenhuma atividade'}

ÚLTIMA MENSAGEM: ${lastMsg ? `${lastMsg.sender_type} (${daysSinceContact}d atrás): "${lastMsg.content?.substring(0, 100)}"` : 'sem mensagens'}

TAREFAS PENDENTES: ${tasks?.filter(t => t.status !== 'done').length || 0}

Responda em JSON exatamente neste formato (sem markdown, sem texto fora do JSON):
{
  "action_type": "send_message" | "schedule_call" | "send_email" | "create_task" | "wait" | "qualify" | "nurture" | "close",
  "title": "Título curto (máx 60 chars) em português",
  "description": "Descrição detalhada do que fazer (máx 200 chars)",
  "priority": "low" | "medium" | "high" | "urgent",
  "channel": "whatsapp" | "email" | "phone" | "task" | null,
  "reasoning": "Justificativa baseada nos dados (máx 200 chars)"
}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, txt);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'Limite de IA atingido. Tente em alguns instantes.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error('Falha na IA');
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    let suggestion: any;
    try { suggestion = JSON.parse(content); } catch {
      throw new Error('IA retornou formato inválido');
    }

    // Persist
    const { data: inserted, error: insErr } = await supabase
      .from('contact_next_actions')
      .insert({
        organization_id: contact.organization_id,
        contact_id,
        action_type: suggestion.action_type || 'wait',
        title: suggestion.title || 'Próxima ação',
        description: suggestion.description || null,
        priority: ['low','medium','high','urgent'].includes(suggestion.priority) ? suggestion.priority : 'medium',
        channel: suggestion.channel || null,
        reasoning: suggestion.reasoning || null,
        ai_model: 'google/gemini-2.5-flash',
        status: 'pending',
      })
      .select()
      .single();

    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, action: inserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('crm-next-action error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
