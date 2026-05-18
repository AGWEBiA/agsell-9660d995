# 🛡️ Guia Rápido: Ambiente de Testes (Sandbox)

O **Modo Sandbox** é um ambiente de execução isolado projetado para validar fluxos, automações e chatbots antes que eles entrem em contato com clientes reais.

---

## 🚀 Como Iniciar um Teste
1. Abra o editor da automação/chatbot desejado.
2. Clique no ícone de **Frasco (Modo Teste)** na barra superior.
3. No painel lateral:
   - Insira o **Número WhatsApp** que receberá as mensagens (use seu próprio número).
   - Selecione a **Instância** de disparo.
   - (Opcional) Defina as **Variáveis de Teste** em formato JSON.
4. Clique em **Executar Simulação**.

---

## 🛠️ O que acontece no Sandbox?

### 1. Isolamento de Mensagens
Todas as mensagens disparadas pelo fluxo serão redirecionadas **exclusivamente** para o número de telefone informado no início do teste. Isso garante que nenhum cliente real receba mensagens de teste por engano.

### 2. Desativação de Efeitos Colaterais
Para manter seu CRM e logs limpos:
- **Webhooks Reais**: Não são disparados para servidores externos.
- **Criação de Contatos**: O bot não salvará novos contatos na base oficial durante o teste.
- **Integrações de Terceiros**: Ações de CRM (como criar Deals ou Notas) são simuladas, mas não executadas.

### 3. Aceleração de Delays
Se o seu fluxo possui blocos de "Aguardar" ou "Delay":
- Delays de **até 10 segundos** são respeitados normalmente.
- Delays **superiores a 10 segundos** são automaticamente reduzidos para agilizar a validação do fluxo completo.

### 4. Simulação de Variáveis
Você pode testar a personalização usando o campo JSON. 
Exemplo:
```json
{
  "nome": "Marcos",
  "ultimo_pedido": "Pizza Grande"
}
```
O sistema substituirá as tags `{{nome}}` e `{{ultimo_pedido}}` nas mensagens pelos valores acima.

---

## 📈 Acompanhando a Execução
Durante o teste, a **Timeline em Tempo Real** mostrará:
- ✅ **Sucesso**: Blocos executados corretamente.
- ⏳ **Executando**: Blocos de delay ou processamento.
- ❌ **Erro**: Problemas de configuração ou lógica no bloco.
- ⏭️ **Pulado**: Quando uma condição não foi atendida e o bot seguiu outro caminho.

---

## 💡 Melhores Práticas
- **Teste Caminhos Alternativos**: Execute a simulação várias vezes mudando as variáveis de entrada para testar todos os ramos das suas condições.
- **Valide o Visual**: Verifique se a formatação das mensagens (negrito, quebras de linha) está correta no seu WhatsApp.
- **Aprovação**: Use o Sandbox para demonstrar o fluxo para o cliente final antes da ativação oficial.
