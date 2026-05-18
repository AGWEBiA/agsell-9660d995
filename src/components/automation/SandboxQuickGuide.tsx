import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, ShieldCheck, Zap, MessageSquare, Play, List } from "lucide-react";

export function SandboxQuickGuide() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
          Como funciona?
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Guia do Ambiente de Testes (Sandbox)
          </SheetTitle>
          <SheetDescription>
            Entenda como validar suas automações com segurança total.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-10">
          <section className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              1. Isolamento Total
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No modo Sandbox, as mensagens são enviadas <strong>apenas para o número de teste</strong> que você definir. 
              Ações com efeitos colaterais externos (como disparar Webhooks Reais ou criar contatos no CRM) são 
              automaticamente interceptadas e desativadas para evitar poluição de dados.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              2. Simulação de Variáveis
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Você pode definir um objeto JSON com variáveis como <code>{"{ \"nome\": \"Pedro\" }"}</code>. 
              O bot substituirá todos os <code>{"{{nome}}"}</code> nas mensagens por esses valores, 
              permitindo testar a personalização do fluxo.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              3. Aceleração de Tempo
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para que você não precise esperar minutos entre uma mensagem e outra, o Sandbox reduz 
              automaticamente qualquer "Delay" ou "Aguardar" superior a 10 segundos. Assim, você valida 
              o fluxo completo em instantes.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              4. Timeline em Tempo Real
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Acompanhe cada "passo" do bot na lateral da tela. Você verá qual caminho ele escolheu em 
              blocos de condição, o conteúdo exato enviado e se houve algum erro técnico em algum bloco específico.
            </p>
          </section>

          <div className="bg-muted p-3 rounded-lg border space-y-2">
            <p className="text-[11px] font-medium flex items-center gap-1 uppercase tracking-wider text-muted-foreground">
              <Play className="h-3 w-3" /> Dica de Fluxo
            </p>
            <p className="text-xs">
              Sempre realize ao menos uma execução completa no Sandbox antes de mover sua automação para 
              os status <strong>"Produção"</strong> ou <strong>"Publicado"</strong>.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
