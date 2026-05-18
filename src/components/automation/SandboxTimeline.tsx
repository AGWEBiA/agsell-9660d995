import React from "react";
import { CheckCircle2, XCircle, Loader2, SkipForward, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SandboxExecution, SandboxStepLog } from "@/hooks/useSandbox";

interface Props {
  execution: SandboxExecution | null;
  steps: SandboxStepLog[];
}

const statusIcon = (s: string) => {
  switch (s) {
    case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":   return <XCircle className="h-4 w-4 text-red-500" />;
    case "running": return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case "skipped": return <SkipForward className="h-4 w-4 text-muted-foreground" />;
    default:        return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour12: false });

export function SandboxTimeline({ execution, steps }: Props) {
  if (!execution) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Nenhuma simulação ativa. Clique em <strong>Executar Simulação</strong> para começar.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Execução {execution.id.slice(0, 8)}</p>
          <p className="text-sm font-medium">Teste para {execution.test_phone}</p>
        </div>
        <Badge
          variant={
            execution.status === "completed" ? "default"
            : execution.status === "failed" ? "destructive"
            : execution.status === "running" ? "secondary"
            : "outline"
          }
        >
          {execution.status === "running" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {execution.status === "completed" ? "Concluído"
            : execution.status === "failed" ? "Falhou"
            : execution.status === "running" ? "Executando"
            : "Cancelado"}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {steps.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aguardando primeira etapa...
            </p>
          ) : (
            steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  step.status === "error" && "border-red-500/30 bg-red-500/5",
                  step.status === "success" && "border-green-500/20 bg-green-500/5",
                  step.status === "running" && "border-blue-500/30 bg-blue-500/5 animate-pulse",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{statusIcon(step.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {step.node_label || step.node_type}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {fmtTime(step.executed_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.node_type}</p>

                    {step.output?.message && (
                      <div className="mt-2 p-2 rounded bg-muted/50 text-xs whitespace-pre-wrap line-clamp-3">
                        {step.output.message}
                      </div>
                    )}
                    {step.output?.skipped && step.output?.reason && (
                      <p className="mt-1 text-xs italic text-muted-foreground">⏭ {step.output.reason}</p>
                    )}
                    {step.output?.capped && (
                      <p className="mt-1 text-[10px] text-amber-500">
                        Delay reduzido para {Math.round((step.output.waited_ms ?? 0) / 1000)}s (limite sandbox)
                      </p>
                    )}
                    {step.output?.branch && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Ramo: {step.output.branch === "yes" ? "✓ Sim" : "✗ Não"}
                      </Badge>
                    )}
                    {step.error_message && (
                      <p className="mt-1 text-xs text-red-500">{step.error_message}</p>
                    )}
                    {step.duration_ms != null && step.duration_ms > 100 && (
                      <p className="mt-1 text-[10px] text-muted-foreground">{step.duration_ms}ms</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {execution.status === "failed" && execution.error_message && (
        <div className="p-3 border-t bg-red-500/10 text-xs text-red-500">
          <strong>Erro:</strong> {execution.error_message}
        </div>
      )}
    </div>
  );
}
