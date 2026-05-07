# Histórico de Erros de Publicação e Diagnóstico

Este documento serve como memória técnica para evitar a repetição de falhas no processo de deploy para o ambiente de produção.

## Problemas Identificados (Maio 2026)

### 1. Dependência de Migrações não Aplicadas no Build Frontend
**Sintoma:** O "Publish" falha no estágio de *type generation* ou *build*.
**Causa:** O código frontend (ex: `AutomationsMonitor.tsx`) tenta usar uma RPC (`reprocess_scheduled_step`) que foi definida em uma migração que ainda não foi aplicada ao ambiente Live. O sistema de build do Lovable gera os tipos do Supabase a partir do banco de dados Live antes de finalizar o build.
**Solução Aplicada:** Desacoplar o frontend de RPCs críticas recém-criadas. Usar `supabase.functions.invoke` ou cast para `any` em chamadas de RPC novas até que o deploy da migração seja confirmado.

### 2. Lockfiles e Gerenciadores de Pacote
**Sintoma:** Erros de "checksum mismatch" ou falha ao instalar dependências no Docker.
**Causa:** Presença de `package-lock.json` em um projeto configurado para usar `bun`. O ambiente de build do Lovable prioriza `npm ci` se o lockfile do npm existir, o que causa conflitos com o `bun.lockb`.
**Solução:** Garantir que apenas o `bun.lockb` esteja presente na raiz do projeto.

### 3. Timeouts em Edge Functions
**Sintoma:** O backend para de processar automações ou retorna 5xx/401 intermitentes.
**Causa:** Funções de orquestração (como `process-scheduled-steps`) chamando outras funções sem limite de timeout, causando travamento do processo (zombie executions).
**Solução:** Implementar `fetchWithTimeout` e limites de execução rigorosos nas Edge Functions.

### 4. Instabilidade na API do Supabase (Live)
**Sintoma:** Mensagens de "Publishing failed" mesmo sem erros aparentes no código.
**Causa:** Timeouts de rede ou latência na aplicação de migrações pesadas ou na regeneração de tipos no ambiente de produção.
**Recomendação:** Aguardar alguns minutos entre tentativas se o erro parecer ser de timeout de infraestrutura.

## Plano de Ação para Automações
1. **Deploy Independente**: Atualizar Edge Functions via ferramenta dedicada antes de tentar o Publish frontend.
2. **Resiliência**: Funções devem verificar se tabelas/RPCs existem antes de falhar (fallback manual).
3. **Monitoramento**: Usar a página de Monitor de Automações para validar o status real do banco Live.
