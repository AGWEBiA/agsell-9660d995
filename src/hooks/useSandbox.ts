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

export function useStartSandbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      automation_id: string;
      automation_type: "flow" | "automation" | "sequence" | "campaign";
      test_phone: string;
      test_variables?: Record<string, any>;
      organization_id: string;
      instance_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("execute-sandbox", {
        body: params,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Falha ao iniciar simulação");
      return data.execution_id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sandbox-executions"] });
      toast({ title: "Simulação iniciada", description: "Acompanhe a execução na timeline." });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao iniciar simulação",
        description: err?.message ?? String(err),
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

    // Initial fetch
    (async () => {
      const { data: exec } = await supabase
        .from("sandbox_executions")
        .select("*")
        .eq("id", executionId)
        .single();
      if (mounted && exec) setExecution(exec as any);

      const { data: stepData } = await supabase
        .from("sandbox_step_logs")
        .select("*")
        .eq("execution_id", executionId)
        .order("step_order");
      if (mounted && stepData) setSteps(stepData as any);
    })();

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
      const { data, error } = await supabase
        .from("sandbox_executions")
        .select("*")
        .eq("automation_id", automationId!)
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as SandboxExecution[];
    },
  });
}
