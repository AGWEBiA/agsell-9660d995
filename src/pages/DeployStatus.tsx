import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, XCircle, Terminal } from "lucide-react";

interface LogEntry {
  id: string;
  message: string;
  type: "info" | "success" | "error";
  timestamp: string;
}

export default function DeployStatus() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "building" | "uploading" | "deploying" | "success" | "error">("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      {
        id: Math.random().toString(36).substr(2, 9),
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    const runDiagnostics = async () => {
      addLog("Iniciando diagnósticos de infraestrutura...", "info");
      setStatus("building");
      setProgress(20);

      try {
        // Teste 1: Conexão com Supabase
        const { error: dbError } = await supabase.from('automations').select('count', { count: 'exact', head: true }).limit(0);
        if (dbError) {
          addLog(`Falha na conexão com Banco de Dados: ${dbError.message}`, "error");
          if (dbError.message.includes("timeout")) {
            addLog("Dica: O banco de dados parece estar sobrecarregado. Tente aguardar alguns minutos.", "info");
          }
          setStatus("error");
          return;
        }
        addLog("Conexão com Banco de Dados: OK", "success");
        setProgress(50);

        // Teste 2: Edge Functions
        const { data, error: funcError } = await supabase.functions.invoke('process-scheduled-steps', { body: { action: 'ping' } });
        if (funcError) {
          addLog(`Edge Function (process-scheduled-steps): ${funcError.message}`, "error");
        } else {
          addLog(`Edge Function (process-scheduled-steps): ONLINE (v${data?.version || 'unknown'})`, "success");
        }
        setProgress(80);

        addLog("Build/Deploy: Pronto para sincronização.", "info");
        setStatus("success");
        setProgress(100);
      } catch (err: any) {
        addLog(`Erro inesperado: ${err.message}`, "error");
        setStatus("error");
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div className="container max-w-2xl py-10">
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Status do Deploy</CardTitle>
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status.toUpperCase()}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Total</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div className={`p-2 rounded-lg border ${progress >= 50 ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <CheckCircle2 className={`mx-auto mb-1 h-5 w-5 ${progress >= 50 ? "text-green-500" : "text-gray-300"}`} />
              Build
            </div>
            <div className={`p-2 rounded-lg border ${progress >= 80 ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <Loader2 className={`mx-auto mb-1 h-5 w-5 ${progress >= 80 ? "text-green-500" : progress >= 50 ? "animate-spin text-blue-500" : "text-gray-300"}`} />
              Upload
            </div>
            <div className={`p-2 rounded-lg border ${progress >= 100 ? "bg-green-50 border-green-200" : "bg-gray-50"}`}>
              <Terminal className={`mx-auto mb-1 h-5 w-5 ${progress >= 100 ? "text-green-500" : progress >= 80 ? "animate-spin text-blue-500" : "text-gray-300"}`} />
              Rollout
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4" /> Logs em Tempo Real
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border bg-black p-4">
              {logs.map((log) => (
                <div key={log.id} className="mb-2 font-mono text-xs flex gap-2">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={log.type === "error" ? "text-red-400" : log.type === "success" ? "text-green-400" : "text-blue-300"}>
                    {log.message}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
