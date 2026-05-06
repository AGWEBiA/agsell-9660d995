# ── Build stage ──────────────────────────────────
FROM oven/bun:1.3.3-alpine AS build

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

# Build args opcionais. O publish do Lovable pode não enviar build args;
# nesse caso o Vite lê as chaves públicas VITE_* do .env copiado acima.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_SUPABASE_PUBLISHABLE_KEY=${VITE_SUPABASE_PUBLISHABLE_KEY}

# Diagnóstico não bloqueante: mostra de onde o build receberá as variáveis sem vazar chaves.
RUN bun -e "const fs=require('fs'); const dot=fs.existsSync('.env')?fs.readFileSync('.env','utf8'):''; const has=(k)=>Boolean(process.env[k]||new RegExp('^'+k+'=', 'm').test(dot)); console.log('Build env check:', {VITE_SUPABASE_URL:has('VITE_SUPABASE_URL'), VITE_SUPABASE_PUBLISHABLE_KEY:has('VITE_SUPABASE_PUBLISHABLE_KEY'), VITE_SUPABASE_ANON_KEY:has('VITE_SUPABASE_ANON_KEY'), envFile:fs.existsSync('.env')});"

RUN bun run build

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
