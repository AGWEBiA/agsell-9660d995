import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Play, FlaskConical, Info, AlertTriangle, X, History, RefreshCw, Activity, Loader2 } from "lucide-react";
import { useStartSandbox, useSandboxExecution, useRecentSandboxExecutions, useSandboxHealth } from "@/hooks/useSandbox";
import { SandboxTimeline } from "./SandboxTimeline";
import { SandboxQuickGuide } from "./SandboxQuickGuide";
import { WhatsAppInstanceSelector } from "@/components/whatsapp/WhatsAppInstanceSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  automationId: string;
  automationType: "flow" | "automation" | "sequence" | "campaign" | "chatbot";
  organizationId: string;
  automationName?: string;
  /** Called when execution finishes — useful to update lifecycle status */
  onExecutionComplete?: (success: boolean) => void;
}

export function SandboxTestPanel({
  open,
  onOpenChange,
  automationId,
  automationType,
  organizationId,
  automationName,
  onExecutionComplete,
}: Props) {
  const [phone, setPhone] = useState("");
  const [instanceId, setInstanceId] = useState<string | undefined>(undefined);
  const [variablesText, setVariablesText] = useState(
    '{\n  "nome": "Cliente Teste",\n  "empresa": "Empresa XYZ"\n}',
  );
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useStartSandbox();
  const { execution, steps } = useSandboxExecution(executionId);
  const health = useSandboxHealth();
  const history = useRecentSandboxExecutions(automationId);

  const [activeTab, setActiveTab] = useState("run");

  React.useEffect(() => {
    if (execution && (execution.status === "completed" || execution.status === "failed")) {
      onExecutionComplete?.(execution.status === "completed");
    }
  }, [execution?.status]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 11) {
      return digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 15);
    } else {
      return digits
        .replace(/^(\d{2})(\d{2})(\d)/g, "+$1 ($2) $3")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 19);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError(null);
  };

  const handleRun = async () => {
    setError(null);
    let vars: Record<string, any> = {};
    try {
      vars = variablesText ? JSON.parse(variablesText) : {};
    } catch (e) {
      setError("O campo de variáveis deve ser um JSON válido.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setError("Por favor, informe o número de WhatsApp de teste.");
      return;
    }

    if (cleanPhone.length < 10) {
      setError("O número de WhatsApp deve ter pelo menos 10 dígitos (DDD + número).");
      return;
    }

    if (!automationId) {
      setError("ID da automação não encontrado.");
      return;
    }

    try {
      const id = await start.mutateAsync({
        automation_id: automationId,
        automation_type: automationType,
        test_phone: cleanPhone,
        test_variables: vars,
        organization_id: organizationId,
        instance_id: instanceId,
      });
      setExecutionId(id);
    } catch (err: any) {
      setError(err?.message || "Ocorreu um erro ao iniciar a simulação.");
    }
  };

  const handleReset = () => {
    setExecutionId(null);
    setError(null);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-amber-500" />
              Modo Teste
            </div>
            <SandboxQuickGuide />
          </SheetTitle>
          <SheetDescription className="text-xs">
            {automationName ?? "Automação"} — execução sandbox isolada
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 border-b">
            <TabsList className="grid w-full grid-cols-2 mt-2 mb-2">
              <TabsTrigger value="run" className="text-xs">
                <Play className="h-3 w-3 mr-2" /> Executar
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="h-3 w-3 mr-2" /> Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="run" className="flex-1 flex flex-col overflow-hidden m-0">
            {!executionId ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <span>Status do Servidor</span>
                  <div className="flex items-center gap-1.5">
                    <Activity className={cn("h-3 w-3", health.data ? "text-green-500" : "text-red-500")} />
                    <span className={health.data ? "text-green-600" : "text-red-600"}>
                      {health.isLoading ? "Verificando..." : health.data ? "Online" : "Indisponível"}
                    </span>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    As mensagens serão enviadas <strong>apenas para o número de teste</strong> abaixo.
                    Webhooks externos e criação de contatos/deals são <strong>desativados</strong>.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="test_phone">Número WhatsApp de teste</Label>
                  <Input
                    id="test_phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={cn("mt-1", error && !phone && "border-destructive")}
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Use seu próprio número para receber as mensagens.
                  </p>
                </div>

                <WhatsAppInstanceSelector
                  value={instanceId}
                  onChange={setInstanceId}
                  label="Instância de envio"
                />

                <div>
                  <Label>Variáveis de teste (JSON)</Label>
                  <Textarea
                    rows={6}
                    value={variablesText}
                    onChange={(e) => setVariablesText(e.target.value)}
                    className="mt-1 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Substitui {"{{nome}}, {{empresa}}"} etc. nas mensagens.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs flex flex-col gap-2">
                      <span>{error}</span>
                      {(error.includes("Failed to send a request") || error.includes("falha")) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRun}
                          className="w-fit h-7 text-[10px] border-destructive text-destructive hover:bg-destructive/10"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Tentar Novamente
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleRun}
                  disabled={start.isPending || phone.replace(/\D/g, "").length < 10}
                >
                  {start.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  {start.isPending ? "Iniciando..." : "Executar Simulação"}
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <SandboxTimeline execution={execution} steps={steps} />
                <div className="p-3 border-t bg-background">
                  <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                    <X className="h-4 w-4 mr-2" />
                    Nova Simulação
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Últimas Simulações</h3>
                <Button variant="ghost" size="sm" onClick={() => history.refetch()} className="h-7 text-[10px]">
                  <RefreshCw className={cn("h-3 w-3 mr-1", history.isFetching && "animate-spin")} /> Atualizar
                </Button>
              </div>

              {history.isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : history.data?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs italic">Nenhuma simulação anterior encontrada.</div>
              ) : (
                history.data?.map((exec) => (
                  <div 
                    key={exec.id} 
                    className="p-3 rounded-lg border bg-card hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setExecutionId(exec.id);
                      setActiveTab("run");
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        exec.status === "completed" ? "bg-green-500/10 text-green-600" :
                        exec.status === "failed" ? "bg-red-500/10 text-red-600" :
                        "bg-blue-500/10 text-blue-600"
                      )}>
                        {exec.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(exec.started_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-xs font-medium truncate">Para: {exec.test_phone}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">ID: {exec.id.slice(0, 8)}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
