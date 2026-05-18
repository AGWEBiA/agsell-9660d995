// AI Router - Roteia chamadas entre OpenAI e Gemini lendo config do DB
// Suporta fallback automático e mapeamento de modelos por tarefa

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AITask = "fast" | "reasoning" | "nano";
export type AIProvider = "openai" | "gemini";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallAIOptions {
  task?: AITask;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  preferProvider?: AIProvider;
}

export interface AIResult {
  content: string;
  provider: AIProvider;
  model: string;
}

interface AIConfig {
  openai_api_key: string;
  gemini_api_key: string;
  default_provider: AIProvider;
  fallback_enabled: boolean;
}

const MODEL_MAP: Record<AIProvider, Record<AITask, string>> = {
  openai: { fast: "gpt-4o-mini", reasoning: "gpt-4o", nano: "gpt-4o-mini" },
  gemini: { fast: "gemini-2.5-flash", reasoning: "gemini-2.5-pro", nano: "gemini-2.5-flash-lite" },
};

let cachedConfig: { value: AIConfig; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function loadConfig(): Promise<AIConfig> {
  const now = Date.now();
  if (cachedConfig && cachedConfig.expiresAt > now) return cachedConfig.value;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let cfg: AIConfig = {
    openai_api_key: Deno.env.get("OPENAI_API_KEY") ?? "",
    gemini_api_key: Deno.env.get("GEMINI_API_KEY") ?? "",
    default_provider: "openai",
    fallback_enabled: true,
  };

  try {
    const { data, error } = await supabase.rpc("get_ai_providers_config_internal");
    if (!error && data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      cfg = {
        openai_api_key: (d.openai_api_key as string) || cfg.openai_api_key,
        gemini_api_key: (d.gemini_api_key as string) || cfg.gemini_api_key,
        default_provider: (d.default_provider as AIProvider) || "openai",
        fallback_enabled: d.fallback_enabled !== false,
      };
    }
  } catch (e) {
    console.warn("[ai-router] Failed to load config from DB, using env fallback:", e);
  }

  cachedConfig = { value: cfg, expiresAt: now + CACHE_TTL_MS };
  return cfg;
}

export function clearAIConfigCache() {
  cachedConfig = null;
}

async function callOpenAI(
  cfg: AIConfig,
  opts: CallAIOptions,
  model: string,
): Promise<AIResult> {
  if (!cfg.openai_api_key) throw new Error("OPENAI_API_KEY não configurada");
  const body: Record<string, unknown> = {
    model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 1024,
  };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.openai_api_key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return { content, provider: "openai", model };
}

async function callGemini(
  cfg: AIConfig,
  opts: CallAIOptions,
  model: string,
): Promise<AIResult> {
  if (!cfg.gemini_api_key) throw new Error("GEMINI_API_KEY não configurada");

  // Converter formato OpenAI → Gemini
  const systemMsgs = opts.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 1024,
    },
  };
  if (systemMsgs) body.systemInstruction = { parts: [{ text: systemMsgs }] };
  if (opts.jsonMode) (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini_api_key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return { content, provider: "gemini", model };
}

async function callProvider(
  cfg: AIConfig,
  provider: AIProvider,
  opts: CallAIOptions,
): Promise<AIResult> {
  const task = opts.task ?? "fast";
  const model = MODEL_MAP[provider][task];
  if (provider === "openai") return callOpenAI(cfg, opts, model);
  return callGemini(cfg, opts, model);
}

/**
 * Chamada unificada de IA. Roteia para OpenAI ou Gemini com fallback automático.
 */
export async function callAI(opts: CallAIOptions): Promise<AIResult> {
  const cfg = await loadConfig();
  const primary: AIProvider = opts.preferProvider ?? cfg.default_provider ?? "openai";
  const secondary: AIProvider = primary === "openai" ? "gemini" : "openai";

  try {
    return await callProvider(cfg, primary, opts);
  } catch (primaryErr) {
    const hasSecondary = secondary === "openai" ? !!cfg.openai_api_key : !!cfg.gemini_api_key;
    if (cfg.fallback_enabled && hasSecondary) {
      console.warn(`[ai-router] Primary ${primary} failed, trying ${secondary}:`, primaryErr);
      try {
        return await callProvider(cfg, secondary, opts);
      } catch (secondaryErr) {
        throw new Error(`Ambos provedores falharam. Primário (${primary}): ${(primaryErr as Error).message}. Secundário (${secondary}): ${(secondaryErr as Error).message}`);
      }
    }
    throw primaryErr;
  }
}

/**
 * Helper para chamadas que esperam JSON estruturado.
 */
export async function callAIJson<T = unknown>(opts: CallAIOptions): Promise<{ data: T; raw: string; provider: AIProvider; model: string }> {
  const result = await callAI({ ...opts, jsonMode: true });
  const match = result.content.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : result.content;
  let parsed: T;
  try {
    parsed = JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`IA retornou JSON inválido: ${result.content.slice(0, 200)}`);
  }
  return { data: parsed, raw: result.content, provider: result.provider, model: result.model };
}
