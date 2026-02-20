
## Aumentar a Logo na Tela de Login

**O que sera feito:**
Aumentar o tamanho da imagem do logo na pagina de login. Atualmente o logo usa o tamanho `xl` que corresponde a `h-12` (48px). Vamos aumentar para um tamanho maior.

**Alteracoes:**

1. **`src/pages/Login.tsx`** - Adicionar uma classe customizada ao componente Logo para aumentar o tamanho, por exemplo `h-16` ou `h-20` (80px), mantendo a proporcao automatica da largura.

2. **`src/components/ui/Logo.tsx`** - Opcionalmente, adicionar um tamanho `2xl` ao mapa de tamanhos do logo para reutilizacao futura.

**Detalhes tecnicos:**
- No componente `Logo`, adicionar entrada `2xl` nos mapas `iconSizeMap` e `fullLogoSizeMap` com valores `h-16 w-16` e `h-16 w-auto` respectivamente
- No `Login.tsx`, trocar `size="xl"` por `size="2xl"` ou aplicar classe extra via `className="h-20"`
