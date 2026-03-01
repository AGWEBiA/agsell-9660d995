import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { CompetitorComparison } from '@/components/pricing/CompetitorComparison';
import {
  ArrowRight, Check, Users, Target, Bot, MessageSquare, Mail, BarChart3,
  Sparkles, FileText, Calendar, Inbox, Globe, Clock, Zap, Shield,
  Phone, Star, TrendingUp, Layers, Award, ChevronRight, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Minimal Hero ───────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] rounded-full border border-primary/10 pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full border border-primary/5 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/[0.03] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            CRM + WhatsApp + IA em uma única plataforma
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95] mb-8">
            Venda mais.
            <br />
            <span className="text-primary">Pense menos.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-12 leading-relaxed">
            O CRM que une WhatsApp nativo, automações e agentes de IA para sua equipe
            fechar mais negócios — com menos esforço.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link to="/pricing">
              <Button size="lg" className="h-14 px-10 text-base font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="ghost" className="h-14 px-8 text-base rounded-full text-muted-foreground hover:text-foreground">
                Ver planos
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Marquee Stats ──────────────────────────────────────────
const STATS = [
  { value: '10k+', label: 'Leads gerenciados' },
  { value: '50%', label: 'Mais conversões' },
  { value: '3x', label: 'Mais produtividade' },
  { value: '24/7', label: 'IA trabalhando por você' },
];

function StatsBar() {
  return (
    <section className="border-y border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
          {STATS.map((s, i) => (
            <div key={i} className="py-10 md:py-14 text-center px-4">
              <p className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Differentials – Bento Grid ─────────────────────────────
const DIFFERENTIALS = [
  {
    icon: MessageSquare,
    title: 'WhatsApp Nativo',
    description: 'Múltiplos números via QR Code. Campanhas em massa, grupos e flows interativos — direto no CRM.',
    span: 'md:col-span-2',
  },
  {
    icon: Bot,
    title: 'Agentes IA com RAG',
    description: 'IA que acessa sua base de conhecimento, qualifica leads e transfere para humanos automaticamente.',
    span: '',
  },
  {
    icon: Layers,
    title: 'Modo Agência',
    description: 'Multi-tenant com dados isolados e troca rápida de conta.',
    span: '',
  },
  {
    icon: Award,
    title: 'Gamificação de Vendas',
    description: 'Rankings, conquistas e pontuação para motivar sua equipe.',
    span: '',
  },
  {
    icon: Inbox,
    title: 'Inbox Omnichannel',
    description: 'WhatsApp, e-mail e Instagram DM em uma única tela com CSAT e transcrição de áudio.',
    span: 'md:col-span-2',
  },
];

function DifferentialsSection() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="max-w-xl mb-16">
        <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Diferenciais</p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          Por que escolher a AG Sell?
        </h2>
        <p className="text-muted-foreground text-lg">
          Recursos exclusivos que nenhum outro CRM oferece.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {DIFFERENTIALS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'group relative rounded-2xl border border-border/60 bg-card p-8 hover:border-primary/30 transition-all duration-300',
              d.span
            )}
          >
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <d.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{d.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            <Badge variant="outline" className="mt-4 text-[10px] text-primary border-primary/20">
              Exclusivo
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Features – Minimal List ────────────────────────────────
const FEATURES_LEFT = [
  { icon: Users, title: 'CRM Completo' },
  { icon: Target, title: 'Pipeline Kanban' },
  { icon: Mail, title: 'E-mail Marketing' },
  { icon: BarChart3, title: 'Analytics em Tempo Real' },
  { icon: FileText, title: 'Formulários Web' },
  { icon: Calendar, title: 'Gestão de Tarefas' },
];

const FEATURES_RIGHT = [
  { icon: Globe, title: 'API & Webhooks' },
  { icon: Clock, title: 'Histórico Completo' },
  { icon: Phone, title: 'Instagram DM' },
  { icon: Shield, title: 'Permissões Granulares' },
  { icon: Sparkles, title: 'Assistente IA' },
  { icon: Star, title: 'CSAT Integrado' },
];

function FeaturesSection() {
  return (
    <section className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Plataforma Completa</p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Tudo em um só lugar
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Substitua 5 ferramentas diferentes por uma única plataforma.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-0 max-w-3xl mx-auto divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="space-y-0">
            {FEATURES_LEFT.map((f, i) => (
              <div key={i} className="flex items-center gap-4 py-4 px-6 group hover:bg-background/60 transition-colors">
                <f.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{f.title}</span>
              </div>
            ))}
          </div>
          <div className="space-y-0">
            {FEATURES_RIGHT.map((f, i) => (
              <div key={i} className="flex items-center gap-4 py-4 px-6 group hover:bg-background/60 transition-colors">
                <f.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials – Minimal Cards ───────────────────────────
const TESTIMONIALS = [
  {
    name: 'Marcos Silva',
    role: 'CEO, Digital Solutions',
    text: 'A AG Sell transformou nosso processo de vendas. O WhatsApp integrado e os agentes de IA nos fizeram converter 50% mais leads.',
  },
  {
    name: 'Ana Beatriz Costa',
    role: 'Gerente Comercial, TechStart',
    text: 'Testei ActiveCampaign, RD Station e HubSpot. Nenhuma tem o WhatsApp nativo e a gamificação que a AG Sell oferece.',
  },
  {
    name: 'Ricardo Mendes',
    role: 'Fundador, Agência Scale',
    text: 'O modo agência é fantástico. Gerencio 12 clientes com dados isolados e tudo centralizado.',
  },
];

function TestimonialsSection() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="max-w-xl mb-16">
        <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Depoimentos</p>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
          Quem usa, recomenda
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="relative rounded-2xl border border-border/60 bg-card p-8">
            <div className="text-4xl font-serif text-primary/20 leading-none mb-4">"</div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.text}</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{t.name[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────
function CTASection() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="relative rounded-3xl bg-foreground overflow-hidden px-8 py-16 md:py-24 text-center">
        {/* Subtle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-background/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-background/5 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-background mb-4 tracking-tight">
            Pronto para vender mais?
          </h2>
          <p className="text-background/60 text-lg max-w-md mx-auto mb-10">
            Escolha o plano ideal e comece a transformar seus resultados hoje.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/pricing">
              <Button size="lg" className="h-14 px-10 text-base font-semibold rounded-full">
                Ver Planos e Assinar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="ghost" className="h-14 px-8 text-base rounded-full text-background/70 hover:text-background hover:bg-background/10">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Landing Page ──────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header – Minimal sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="red" size="md" showText />
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#diferenciais" className="text-muted-foreground hover:text-foreground transition-colors">Diferenciais</a>
            <a href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#comparativo" className="text-muted-foreground hover:text-foreground transition-colors">Comparativo</a>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground">Entrar</Button>
            </Link>
            <Link to="/pricing">
              <Button size="sm" className="rounded-full px-5">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      <HeroSection />
      <StatsBar />

      <div id="diferenciais">
        <DifferentialsSection />
      </div>

      <div id="recursos">
        <FeaturesSection />
      </div>

      <TestimonialsSection />

      <div id="comparativo">
        <section className="bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-6 py-24 md:py-32">
            <CompetitorComparison />
          </div>
        </section>
      </div>

      <CTASection />

      {/* Footer – Ultra minimal */}
      <footer className="border-t border-border/50">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo variant="red" size="sm" showText />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Preços</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} AG Sell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
