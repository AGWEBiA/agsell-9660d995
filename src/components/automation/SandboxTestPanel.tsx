import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Play, FlaskConical, Info, AlertTriangle, X } from "lucide-react";
import { useStartSandbox, useSandboxExecution } from "@/hooks/useSandbox";
import { SandboxTimeline } from "./SandboxTimeline";
import { SandboxQuickGuide } from "./SandboxQuickGuide";
import { WhatsAppInstanceSelector } from "@/components/whatsapp/WhatsAppInstanceSelector";

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

  React.useEffect(() => {
    if (execution && (execution.status === "completed" || execution.status === "failed")) {
      onExecutionComplete?.(execution.status === "completed");
    }
  }, [execution?.status]);

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, "");
    
    // Formato: 55 11 99999-9999 ou 11 99999-9999
    if (digits.length <= 11) {
      // Formato nacional (sem DDI 55)
      return digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .substring(0, 15);
    } else {
      // Formato internacional (com DDI)
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
    
    // Validação de JSON
    try {
      vars = variablesText ? JSON.parse(variablesText) : {};
    } catch (e) {
      setError("O campo de variáveis deve ser um JSON válido.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    // Validações explícitas
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
      // O erro já é tratado no hook (toast), mas podemos mostrar aqui também
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

        {!executionId ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                className={`mt-1 ${error && !phone ? "border-destructive" : ""}`}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Use seu próprio número para receber as mensagens (ex: 55119...).
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {error}
                </AlertDescription>
              </Alert>
            )}

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

            <Alert variant="default" className="border-amber-500/30 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                Delays maiores que 10 segundos serão reduzidos para acelerar o teste.
              </AlertDescription>
            </Alert>

            <Separator />

            <Button
              className="w-full"
              size="lg"
              onClick={handleRun}
              disabled={start.isPending || phone.replace(/\D/g, "").length < 10}
            >
              <Play className="h-4 w-4 mr-2" />
              {start.isPending ? "Iniciando..." : "Executar Simulação"}
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <SandboxTimeline execution={execution} steps={steps} />
            <div className="p-3 border-t">
              <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Nova Simulação
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
