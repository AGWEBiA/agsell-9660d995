# ── Build stage ──────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* bun.lockb* ./
RUN npm ci

COPY . .

# Build args (precisam ser declarados para o Vite ler durante o build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

# Validações – falha cedo se algo não chegou no build
RUN test -n "$VITE_SUPABASE_URL" || (echo "Erro: VITE_SUPABASE_URL não recebida como build arg" && exit 1)
RUN test -n "$VITE_SUPABASE_ANON_KEY" || (echo "Erro: VITE_SUPABASE_ANON_KEY não recebida como build arg" && exit 1)
RUN test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" || (echo "Erro: VITE_SUPABASE_PUBLISHABLE_KEY não recebida como build arg" && exit 1)
RUN node -e "console.log('Build usando Supabase project ref:', new URL(process.env.VITE_SUPABASE_URL).hostname.split('.')[0])"

RUN npm run build

# ── Production stage ─────────────────────────────
FROM nginx:alpine

# SPA fallback: todas as rotas → index.html
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n\
    expires 1y;\n\
    add_header Cache-Control "public, immutable";\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
