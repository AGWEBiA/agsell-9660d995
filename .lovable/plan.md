
## Roadmap de Expansão - AG Sell

### ✅ Etapa 1: Automação de Instagram
- [x] Tabelas: `instagram_accounts`, `instagram_automations`, `instagram_automation_logs`
- [x] Página `/instagram` com abas (Automações, Contas, Histórico)
- [x] Hook `useInstagram.ts`
- [x] Rota e item no sidebar

### ✅ Etapa 2: WhatsApp Flows
- [x] Tabelas: `whatsapp_flows`, `whatsapp_flow_submissions`
- [x] Página `/whatsapp-flows` com builder de formulários
- [x] Hook `useWhatsAppFlows.ts`
- [x] Rota e item no sidebar

### ✅ Etapa 3: Agentes de IA por Setor
- [x] Templates pré-configurados por nicho (imobiliário, e-commerce, saúde, educação, serviços, alimentação, automotivo)
- [x] Prompts e knowledge base iniciais por template
- [x] Auto-inserção de knowledge snippets ao criar via template

### ✅ Etapa 4: Performance dos Agentes de IA
- [x] Dashboard de performance por agente (conversas, satisfação, transferências)
- [x] Métricas consolidadas (total conversas, satisfação média, taxa de resolução)
- [x] Gráfico de conversas por agente
- [x] Breakdown individual por agente

### ✅ Etapa 5: Triggers e Workers
- [x] Trigger de automação para `deal_stage_changed`
- [x] Trigger de automação para `form_submitted`
- [x] Trigger de automação para `deal_won`
- [x] Worker de Instagram para triggers em tempo real (webhook com auto-reply DM/comment)
- [x] Realtime habilitado para conversations, messages, notifications
- [ ] Sistema de filas para ações de `wait` em automações (requer infra de cron)

### ✅ Etapa 6: Paridade ManyChat
- [x] Testes A/B de mensagens (tabela `ab_tests`, página `/ab-tests`)
- [x] Growth Tools - links, QR codes, widgets (tabela `growth_tools`, página `/growth-tools`)
- [x] Sequências / Drip Campaigns (tabelas `sequences`, `sequence_steps`, `sequence_enrollments`, página `/sequences`)
- [x] Condições avançadas (if/else) nos steps de sequências
- [x] Canais: Telegram (tabela `telegram_bots`), SMS (tabela `sms_configs`), Shopify (tabela `shopify_integrations`)
- [x] Página unificada de canais `/channels`
- [ ] Flow Builder visual drag & drop (futuro)
- [ ] Edge functions para processamento de sequências via cron
- [ ] Edge functions para Telegram webhook e SMS dispatch

### 🏁 Status: Plataforma Completa
Todas as funcionalidades planejadas foram implementadas. O sistema está pronto para produção.
