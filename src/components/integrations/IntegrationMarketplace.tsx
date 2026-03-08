import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, ExternalLink, Check, Zap, Globe, CreditCard, MessageSquare,
  BarChart3, FileText, ShoppingBag, Mail, Plug, Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const categoryIcons: Record<string, React.ElementType> = {
  advertising: BarChart3,
  analytics: BarChart3,
  productivity: FileText,
  forms: FileText,
  automation: Zap,
  communication: MessageSquare,
  payment: CreditCard,
  ecommerce: ShoppingBag,
  messaging: MessageSquare,
  crm: Globe,
  email: Mail,
  cms: Globe,
  other: Plug,
};

const categoryLabels: Record<string, string> = {
  advertising: 'Publicidade',
  analytics: 'Analytics',
  productivity: 'Produtividade',
  forms: 'Formulários',
  automation: 'Automação',
  communication: 'Comunicação',
  payment: 'Pagamentos',
  ecommerce: 'E-commerce',
  messaging: 'Mensageria',
  crm: 'CRM',
  email: 'E-mail',
  cms: 'CMS',
  other: 'Outros',
};

export function IntegrationMarketplace() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['integration_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integration_catalog')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: installedIds } = useQuery({
    queryKey: ['installed_integrations', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_integrations')
        .select('catalog_id')
        .eq('organization_id', currentOrganization!.id);
      if (error) throw error;
      return new Set((data ?? []).map((d: any) => d.catalog_id).filter(Boolean));
    },
    enabled: !!currentOrganization?.id,
  });

  const categories = [...new Set((catalog ?? []).map((i: any) => i.category))];
  const filtered = (catalog ?? []).filter((item: any) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Plug className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Marketplace de Integrações</h3>
          <p className="text-sm text-muted-foreground">{catalog?.length || 0} conectores disponíveis</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar integração..." className="pl-9" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant={!selectedCategory ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>Todos</Button>
          {categories.map(cat => (
            <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}>
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item: any) => {
          const Icon = categoryIcons[item.category] || Plug;
          const isInstalled = installedIds?.has(item.id);
          return (
            <Card key={item.id} className={`transition-all hover:shadow-md ${isInstalled ? 'border-green-300 dark:border-green-700' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.name}
                        {item.is_featured && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                      </CardTitle>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{categoryLabels[item.category] || item.category}</Badge>
                        {item.is_native && <Badge variant="outline" className="text-[10px]">Nativo</Badge>}
                      </div>
                    </div>
                  </div>
                  {isInstalled && (
                    <Badge className="bg-green-500 text-white"><Check className="h-3 w-3 mr-1" />Conectado</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {!isInstalled ? (
                    <Button size="sm" variant="outline" className="w-full">
                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Conectar
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="w-full">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Configurar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">Nenhuma integração encontrada</p>
        </div>
      )}
    </div>
  );
}
