import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useLandingPages, useCreateLandingPage, useUpdateLandingPage, useDeleteLandingPage, LandingPage } from '@/hooks/useLandingPages';
import { Eye, Plus, Trash2, Edit, Globe, Copy, ExternalLink, Layout } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LandingPages() {
  const { data: pages = [], isLoading } = useLandingPages();
  const createPage = useCreateLandingPage();
  const updatePage = useUpdateLandingPage();
  const deletePage = useDeleteLandingPage();
  const [showCreate, setShowCreate] = useState(false);
  const [newPage, setNewPage] = useState({ name: '', slug: '', description: '' });

  const handleCreate = async () => {
    if (!newPage.name || !newPage.slug) return toast.error('Nome e slug são obrigatórios');
    await createPage.mutateAsync({
      name: newPage.name,
      slug: newPage.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      description: newPage.description || null,
      content: [
        { type: 'hero', title: newPage.name, subtitle: 'Edite esta seção', buttonText: 'Saiba Mais', buttonUrl: '#' },
        { type: 'text', content: 'Adicione seu conteúdo aqui...' },
      ],
      settings: { theme: 'light', font: 'Inter' },
    });
    setNewPage({ name: '', slug: '', description: '' });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Landing Pages</h1>
          <p className="text-muted-foreground">Crie páginas de captura e conversão sem precisar de código</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nova Landing Page</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome</label>
                <Input value={newPage.name} onChange={e => setNewPage(p => ({ ...p, name: e.target.value }))} placeholder="Campanha Black Friday" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Slug (URL)</label>
                <Input value={newPage.slug} onChange={e => setNewPage(p => ({ ...p, slug: e.target.value }))} placeholder="black-friday" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descrição</label>
                <Textarea value={newPage.description} onChange={e => setNewPage(p => ({ ...p, description: e.target.value }))} placeholder="Descrição opcional" />
              </div>
              <Button onClick={handleCreate} disabled={createPage.isPending} className="w-full">
                {createPage.isPending ? 'Criando...' : 'Criar Landing Page'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pages.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Layout className="h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground">Nenhuma landing page</h3>
            <p className="text-muted-foreground text-center max-w-md">Crie sua primeira landing page para capturar leads e aumentar suas conversões.</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Criar Agora</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map(page => (
            <Card key={page.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{page.name}</CardTitle>
                    <CardDescription className="text-xs">/{page.slug}</CardDescription>
                  </div>
                  <Badge variant={page.is_published ? 'default' : 'secondary'}>
                    {page.is_published ? 'Publicada' : 'Rascunho'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {page.visits_count}</span>
                  <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> {page.conversions_count}</span>
                  <span>{page.conversion_rate}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePage.mutate({ id: page.id, is_published: !page.is_published })}
                  >
                    {page.is_published ? 'Despublicar' : 'Publicar'}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deletePage.mutate(page.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
