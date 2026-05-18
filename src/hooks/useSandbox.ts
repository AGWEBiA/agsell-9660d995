import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface SandboxExecution {
  id: string;
  organization_id: string;
  automation_id: string;
  automation_type: string;
  test_phone: string;
  test_variables: Record<string, any>;
  status: "running" | "completed" | "failed" | "cancelled";
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface SandboxStepLog {
  id: string;
  execution_id: string;
  node_id: string;
  node_type: string;
  node_label: string | null;
  status: "pending" | "running" | "success" | "error" | "skipped";
  input: any;
  output: any;
  error_message: string | null;
  duration_ms: number | null;
  step_order: number;
  executed_at: string;
}

const getSandboxFunctionUrl = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const baseUrl = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}/functions/v1/execute-sandbox` : null;
};

const invokeSandboxBridge = async (method: "GET" | "POST", body?: unknown, query?: Record<string, string>) => {
  const baseUrl = getSandboxFunctionUrl();
  const env = import.meta.env as Record<string, string | undefined>;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY;

  if (!baseUrl || !publishableKey) {
    const { data, error } = await supabase.functions.invoke("execute-sandbox", { method, body });
    if (error) throw new Error(error.message || "Falha na conexão com o servidor.");
    return data;
  }

  const url = new URL(baseUrl);
  Object.entries(query ?? {}).forEach(([key, value]) => url.searchParams.set(key, value));

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? publishableKey;
  const response = await fetch(url.toString(), {
    method,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Servidor retornou HTTP ${response.status}.`);
  }
  return data;
};

export function useStartSandbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      automation_id: string;
      automation_type: "flow" | "automation" | "sequence" | "campaign" | "chatbot";
      test_phone: string;
      test_variables?: Record<string, any>;
      organization_id: string;
      instance_id?: string;
    }) => {
      console.log("Iniciando sandbox com parâmetros:", params);
      
      const data = await invokeSandboxBridge("POST", params);
      
      if (!data?.success) {
        throw new Error(data?.error || "O servidor não conseguiu processar o início da simulação.");
      }
      
      return data.execution_id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sandbox-executions"] });
      toast({ title: "Simulação iniciada", description: "Acompanhe a execução na timeline." });
    },
    onError: (err: any) => {
      const isMissingTable = err?.message?.includes("sandbox_executions");
      toast({
        title: isMissingTable ? "Banco de dados desatualizado" : "Erro ao iniciar simulação",
        description: isMissingTable 
          ? "A tabela de execução não foi encontrada no seu projeto Supabase. Verifique as migrações."
          : err?.message ?? String(err),
        variant: "destructive",
      });
    },
  });
}

export function useSandboxExecution(executionId: string | null) {
  const [execution, setExecution] = useState<SandboxExecution | null>(null);
  const [steps, setSteps] = useState<SandboxStepLog[]>([]);

  useEffect(() => {
    if (!executionId) {
      setExecution(null);
      setSteps([]);
      return;
    }

    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const loadExecution = async () => {
      try {
        const data = await invokeSandboxBridge("GET", undefined, { action: "execution", execution_id: executionId });
        if (!mounted) return;
        setExecution((data?.execution ?? null) as SandboxExecution | null);
        setSteps((data?.steps ?? []) as SandboxStepLog[]);
      } catch (err) {
        console.error("Falha ao carregar execução sandbox:", err);
      }
    };

    loadExecution();
    interval = setInterval(loadExecution, 1500);

    // Realtime subscriptions
    const channel = supabase
      .channel(`sandbox-${executionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sandbox_executions", filter: `id=eq.${executionId}` },
        (payload) => {
          if (payload.new) setExecution(payload.new as any);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sandbox_step_logs", filter: `execution_id=eq.${executionId}` },
        (payload) => {
          setSteps((prev) => [...prev, payload.new as any].sort((a, b) => a.step_order - b.step_order));
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [executionId]);

  return { execution, steps };
}

export function useRecentSandboxExecutions(automationId: string | null) {
  return useQuery({
    queryKey: ["sandbox-executions", automationId],
    enabled: !!automationId,
    queryFn: async () => {
      const data = await invokeSandboxBridge("GET", undefined, { action: "history", automation_id: automationId! });
      return (data?.executions ?? []) as SandboxExecution[];
    },
  });
}

export function useSandboxHealth() {
  return useQuery({
    queryKey: ["sandbox-health"],
    queryFn: async () => {
      try {
        const data = await invokeSandboxBridge("GET");
        return data?.status === "ok";
      } catch (err) {
        console.error("Sandbox health check failed:", err);
        return false;
      }
    },
    refetchInterval: 30000, // Check every 30s
  });
}