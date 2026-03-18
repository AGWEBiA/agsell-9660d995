import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Copy, Check, Globe, Key, BarChart3, Users, Mail,
  TrendingUp, RefreshCw, ShieldCheck, FileText, Code2, Webhook,
  Search, Filter, ArrowRight, Zap, ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label || 'Texto'} copiado!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function CodeBlock({ code, language = 'typescript', label }: { code: string; language?: string; label?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-5 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed border border-zinc-800">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} label={label || 'Código'} />
      </div>
    </div>
  );
}

const BASE_URL = 'https://gmemxbfibakfpsjbsvyt.supabase.co/functions/v1/public-api';

const endpoints = [
  { method: 'GET', path: '/metrics/overview', desc: 'Resumo geral de todas as métricas', icon: BarChart3, category: 'metrics' },
  { method: 'GET', path: '/metrics/email', desc: 'Aberturas, cliques, taxa de entrega', icon: Mail, category: 'metrics' },
  { method: 'GET', path: '/metrics/leads', desc: 'Leads por período, funil, tag e source', icon: Users, category: 'metrics' },
  { method: 'GET', path: '/metrics/pipeline', desc: 'Deals por etapa, taxa de conversão', icon: TrendingUp, category: 'metrics' },
  { method: 'GET', path: '/metrics/automations', desc: 'Execuções e taxa de sucesso', icon: RefreshCw, category: 'metrics' },
  { method: 'GET', path: '/metrics/forms', desc: 'Submissões e taxa de conversão', icon: FileText, category: 'metrics' },
  { method: 'GET', path: '/contacts', desc: 'Listar contatos (paginado)', icon: Users, category: 'crud' },
  { method: 'POST', path: '/contacts', desc: 'Criar novo contato', icon: Users, category: 'crud' },
  { method: 'GET', path: '/contacts/:id', desc: 'Buscar contato por ID', icon: Users, category: 'crud' },
  { method: 'PUT', path: '/contacts/:id', desc: 'Atualizar contato', icon: Users, category: 'crud' },
  { method: 'DELETE', path: '/contacts/:id', desc: 'Excluir contato', icon: Users, category: 'crud' },
  { method: 'GET', path: '/companies', desc: 'Listar empresas', icon: Globe, category: 'crud' },
  { method: 'POST', path: '/companies', desc: 'Criar nova empresa', icon: Globe, category: 'crud' },
  { method: 'GET', path: '/deals', desc: 'Listar negócios', icon: TrendingUp, category: 'crud' },
  { method: 'POST', path: '/deals', desc: 'Criar novo negócio', icon: TrendingUp, category: 'crud' },
  { method: 'GET', path: '/forms', desc: 'Listar formulários', icon: FileText, category: 'forms' },
  { method: 'GET', path: '/forms/:id', desc: 'Detalhes do formulário', icon: FileText, category: 'forms' },
  { method: 'GET', path: '/forms/:id/submissions', desc: 'Submissões com filtros', icon: FileText, category: 'forms' },
];

const queryParams = [
  { param: 'period', desc: 'Período dos dados', values: 'today, 7d, 30d, 90d', default: '30d' },
  { param: 'tag', desc: 'Filtrar por tag', values: 'nome ou ID da tag', default: '—' },
  { param: 'source', desc: 'Filtrar por fonte do lead', values: 'whatsapp, formulario, etc.', default: '—' },
  { param: 'stage', desc: 'Filtrar por etapa do funil', values: 'nome ou ID da etapa', default: '—' },
  { param: 'status', desc: 'Filtrar por status', values: 'new, qualified, etc.', default: '—' },
  { param: 'page', desc: 'Página (paginação)', values: 'número inteiro', default: '1' },
  { param: 'per_page', desc: 'Itens por página', values: '1-100', default: '50' },
  { param: 'fields', desc: 'Campos específicos (submissions)', values: 'campo1,campo2', default: 'todos' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  PUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

export default function ApiDocs() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredEndpoints = activeCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Logo variant="auto" size="md" />
            </Link>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">API Docs</span>
              <Badge variant="outline" className="text-xs font-mono">v1</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="gap-1.5">
                Criar Conta <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge className="bg-primary/10 text-primary border-primary/20">REST API</Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            AG Sell API
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Integre qualquer ferramenta externa ao AG Sell via API REST ou Webhooks.
            Leia métricas, gerencie contatos e receba dados de formulários em tempo real.
          </p>
        </div>

        {/* Quick Start */}
        <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <CardHeader className="bg-zinc-900 dark:bg-zinc-950 pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Start — Primeira Requisição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CodeBlock
              label="Quick Start"
              code={`curl -X GET "${BASE_URL}/metrics/overview?period=7d" \\
  -H "x-api-key: ag_sua_chave_aqui" \\
  -H "Content-Type: application/json"`}
            />
          </CardContent>
        </Card>

        {/* Auth Section */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Autenticação
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Todas as requisições exigem o header <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm font-mono text-primary">x-api-key</code> com uma chave válida.
              </p>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Como obter sua API Key:</p>
                <ol className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal pl-5">
                  <li>Acesse o AG Sell e vá em <strong>Configurações → API Keys</strong></li>
                  <li>Clique em <strong>"Gerar Nova Chave"</strong></li>
                  <li>Selecione as permissões desejadas (<code className="font-mono text-xs">read</code> para métricas, <code className="font-mono text-xs">read,write</code> para CRUD)</li>
                  <li>Copie a chave — ela não será exibida novamente</li>
                </ol>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Segurança:</strong> As chaves são armazenadas com hash SHA-256. Nunca compartilhe sua API Key em código público.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Base URL */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Base URL
          </h2>
          <div className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-800">
            <code className="text-emerald-400 font-mono text-sm flex-1 break-all">{BASE_URL}</code>
            <CopyButton text={BASE_URL} label="Base URL" />
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Endpoints
          </h2>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'metrics', label: 'Métricas' },
              { key: 'crud', label: 'CRUD' },
              { key: 'forms', label: 'Formulários' },
            ].map(cat => (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredEndpoints.map((ep) => (
              <div
                key={ep.method + ep.path}
                className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-primary/30 transition-colors"
              >
                <ep.icon className="h-4 w-4 text-zinc-400 shrink-0" />
                <Badge className={`${methodColors[ep.method]} text-xs font-mono px-2 shrink-0`}>
                  {ep.method}
                </Badge>
                <code className="text-sm font-mono text-primary truncate">{ep.path}</code>
                <span className="hidden sm:inline text-xs text-zinc-500 ml-auto shrink-0">{ep.desc}</span>
                <CopyButton text={ep.path} label="Endpoint" />
              </div>
            ))}
          </div>
        </section>

        {/* Query Params */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Filter className="h-6 w-6 text-primary" />
            Parâmetros de Query
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Parâmetro</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Descrição</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Valores</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queryParams.map((qp) => (
                      <tr key={qp.param} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        <td className="py-3 px-4">
                          <code className="font-mono text-primary text-xs bg-primary/5 px-1.5 py-0.5 rounded">{qp.param}</code>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">{qp.desc}</td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-500 font-mono text-xs">{qp.values}</td>
                        <td className="py-3 px-4">
                          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{qp.default}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Code Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Exemplos de Código
          </h2>

          <Tabs defaultValue="sdk" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sdk">SDK Client</TabsTrigger>
              <TabsTrigger value="fetch">Fetch API</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="php">PHP</TabsTrigger>
            </TabsList>

            <TabsContent value="sdk">
              <CodeBlock
                label="SDK Client"
                code={`// agsell-client.ts — SDK para integração nativa
class AGSellClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || '${BASE_URL}';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(this.baseUrl + endpoint, {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || \`AG Sell API error: \${res.status}\`);
    }
    return res.json();
  }

  async testConnection() {
    return this.request('/metrics/overview');
  }

  async getOverview(period = '30d') {
    return this.request(\`/metrics/overview?period=\${period}\`);
  }

  async getLeadMetrics(params: Record<string, string> = {}) {
    const qs = new URLSearchParams({ period: '30d', ...params });
    return this.request(\`/metrics/leads?\${qs}\`);
  }

  async listContacts(page = 1, perPage = 50) {
    return this.request(\`/contacts?page=\${page}&per_page=\${perPage}\`);
  }

  async createContact(data: Record<string, any>) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFormSubmissions(formId: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params);
    return this.request(\`/forms/\${formId}/submissions?\${qs}\`);
  }
}

// Uso:
const agsell = new AGSellClient('ag_sua_chave_aqui');
const overview = await agsell.getOverview('7d');
console.log(overview);`}
              />
            </TabsContent>

            <TabsContent value="fetch">
              <CodeBlock
                label="Fetch API"
                code={`const API_KEY = 'ag_sua_chave_aqui';
const BASE = '${BASE_URL}';

// Buscar métricas de e-mail dos últimos 7 dias
const res = await fetch(\`\${BASE}/metrics/email?period=7d\`, {
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});
const data = await res.json();
console.log('Aberturas:', data.data.opens);
console.log('Cliques:', data.data.clicks);

// Criar contato
await fetch(\`\${BASE}/contacts\`, {
  method: 'POST',
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'Maria',
    email: 'maria@email.com',
    phone: '11999999999',
  }),
});`}
              />
            </TabsContent>

            <TabsContent value="python">
              <CodeBlock
                language="python"
                label="Python"
                code={`import requests

API_KEY = "ag_sua_chave_aqui"
BASE = "${BASE_URL}"
HEADERS = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
}

# Buscar overview
res = requests.get(f"{BASE}/metrics/overview?period=7d", headers=HEADERS)
print(res.json())

# Listar contatos
res = requests.get(f"{BASE}/contacts?page=1&per_page=50", headers=HEADERS)
contacts = res.json()
for c in contacts["data"]:
    print(f"{c['first_name']} - {c.get('email', 'sem email')}")

# Buscar submissões de formulário
form_id = "uuid-do-formulario"
res = requests.get(f"{BASE}/forms/{form_id}/submissions", headers=HEADERS)
submissions = res.json()
for s in submissions["data"]:
    print(s["data"])`}
              />
            </TabsContent>

            <TabsContent value="php">
              <CodeBlock
                language="php"
                label="PHP"
                code={`<?php
$apiKey = "ag_sua_chave_aqui";
$base = "${BASE_URL}";

function agsellRequest($endpoint, $method = "GET", $body = null) {
    global $apiKey, $base;
    $ch = curl_init($base . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "x-api-key: $apiKey",
        "Content-Type: application/json",
    ]);
    if ($method === "POST") {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// Overview
$overview = agsellRequest("/metrics/overview?period=30d");
print_r($overview);

// Criar contato
$newContact = agsellRequest("/contacts", "POST", [
    "first_name" => "João",
    "email" => "joao@email.com",
]);
print_r($newContact);`}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Webhooks */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            Webhooks (Push em Tempo Real)
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6 space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Configure um <strong>Webhook URL</strong> diretamente no formulário do AG Sell. A cada nova submissão, um <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">POST</code> é disparado automaticamente com os dados.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payload de exemplo:</p>
                <CodeBlock
                  label="Webhook Payload"
                  code={`{
  "event": "form_submission",
  "form_id": "uuid-do-formulario",
  "submission_id": "uuid-da-submissao",
  "data": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "mensagem": "Quero saber mais sobre o produto"
  },
  "contact_id": "uuid-do-contato-criado",
  "submitted_at": "2026-03-18T14:30:00.000Z"
}`}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Receiver de exemplo (Node.js/Express):</p>
                <CodeBlock
                  label="Webhook Receiver"
                  code={`// POST /webhook/agsell
app.post('/webhook/agsell', (req, res) => {
  // 1. Validar autenticação (header customizado)
  const auth = req.headers['authorization'];
  if (auth !== \`Bearer \${process.env.AGSELL_WEBHOOK_SECRET}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Processar payload
  const { event, form_id, data, contact_id } = req.body;

  if (event === 'form_submission') {
    const nome  = data.nome || data.name;
    const email = data.email;
    const fone  = data.telefone || data.phone || data.whatsapp;

    // 3. Salvar, disparar ação, etc.
    console.log(\`Novo lead: \${nome} — \${email} — \${fone}\`);
  }

  res.status(200).json({ received: true });
});`}
                />
              </div>

              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Como configurar:</p>
                <ol className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-decimal pl-5">
                  <li>Acesse o formulário no AG Sell</li>
                  <li>Vá na aba <strong>Integrações → Webhook</strong></li>
                  <li>Informe a <strong>URL de callback</strong> da sua ferramenta</li>
                  <li>Adicione headers customizados (ex: <code className="font-mono text-xs">Authorization: Bearer TOKEN</code>)</li>
                  <li>Salve — a cada submissão, o POST é disparado automaticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rate Limiting & Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Segurança & Limites
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Key, title: 'API Key com Hash SHA-256', desc: 'Chaves nunca são armazenadas em texto plano.' },
              { icon: ShieldCheck, title: 'Rate Limiting', desc: '60 req/min e 10.000 req/dia por padrão. Header retry_after no 429.' },
              { icon: Globe, title: 'Isolamento Multi-Tenant', desc: 'Cada chave é vinculada a uma organização. Dados de outras orgs são inacessíveis.' },
              { icon: Search, title: 'Somente Leitura (Métricas)', desc: 'Endpoints de métricas são GET only. Permissão read é suficiente.' },
            ].map((item) => (
              <Card key={item.title} className="border-zinc-200 dark:border-zinc-800">
                <CardContent className="pt-6 flex items-start gap-3">
                  <item.icon className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Checklist */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Check className="h-6 w-6 text-primary" />
            Checklist de Implementação
          </h2>
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  'Tela de config com campo API Key e Base URL',
                  'Botão "Testar Conexão" (GET /metrics/overview)',
                  'Armazenar API Key criptografada',
                  'Endpoint webhook para receber submissões',
                  'Mapeamento de campos do formulário',
                  'Tratamento de erros + retry com backoff',
                  'Respeitar rate limits (429 + retry_after)',
                  'Log de chamadas para debugging',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Architecture Diagram */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Arquitetura Recomendada
          </h2>
          <CodeBlock
            label="Diagrama"
            code={`┌─────────────────────────────────────────┐
│          SUA FERRAMENTA / PLUGIN        │
│                                         │
│  ┌────────────────────────────────────┐  │
│  │  Tela de Configuração             │  │
│  │  • Campo: API Key                 │  │
│  │  • Campo: Base URL (opcional)     │  │
│  │  • Botão: Testar Conexão          │  │
│  └──────────┬─────────────────────────┘  │
│             │                           │
│  ┌──────────▼─────────────────────────┐  │
│  │  AG Sell API Client (SDK)          │  │
│  │  • GET  /metrics/*                 │  │
│  │  • CRUD /contacts, /deals          │  │
│  │  • GET  /forms/*/submissions       │  │
│  └──────────┬─────────────────────────┘  │
│             │                           │
│  ┌──────────▼─────────────────────────┐  │
│  │  Webhook Receiver (POST)           │  │
│  │  • Endpoint: /webhook/agsell       │  │
│  │  • Valida headers                  │  │
│  │  • Processa form_submission        │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
          │                    ▲
          │  API Requests      │  Webhook POST
          ▼                    │
┌─────────────────────────────────────────┐
│              AG SELL                    │
│  REST API + Webhook Dispatcher          │
└─────────────────────────────────────────┘`}
          />
        </section>

        {/* CTA */}
        <div className="text-center space-y-4 py-8">
          <p className="text-zinc-500 dark:text-zinc-400">Pronto para integrar?</p>
          <div className="flex justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Criar Conta Grátis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2">
                Já tenho conta <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} AG Sell — Documentação da API v1</p>
      </footer>
    </div>
  );
}
