import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Copy, Plus, Wand2, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContentBlock {
  id: string;
  condition_field: string;
  condition_operator: string;
  condition_value: string;
  content_if_true: string;
  content_if_false: string;
}

export default function ConditionalContent() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [preview, setPreview] = useState('');

  const addBlock = () => {
    setBlocks(prev => [...prev, {
      id: crypto.randomUUID(),
      condition_field: 'tag',
      condition_operator: 'contains',
      condition_value: '',
      content_if_true: '',
      content_if_false: '',
    }]);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const generateMergeTag = (block: ContentBlock) => {
    return `{% if contact.${block.condition_field} ${block.condition_operator} "${block.condition_value}" %}
${block.content_if_true}
{% else %}
${block.content_if_false}
{% endif %}`;
  };

  const generateAllCode = () => {
    return blocks.map(generateMergeTag).join('\n\n');
  };

  const fields = [
    { value: 'tag', label: 'Tag' },
    { value: 'source', label: 'Origem' },
    { value: 'lead_score', label: 'Lead Score' },
    { value: 'status', label: 'Status' },
    { value: 'city', label: 'Cidade' },
    { value: 'state', label: 'Estado' },
    { value: 'company', label: 'Empresa' },
  ];

  const operators = [
    { value: 'contains', label: 'contém' },
    { value: 'equals', label: 'é igual a' },
    { value: 'not_equals', label: 'é diferente de' },
    { value: 'greater_than', label: 'maior que' },
    { value: 'less_than', label: 'menor que' },
    { value: 'exists', label: 'existe' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conteúdo Condicional</h1>
          <p className="text-muted-foreground">Personalize e-mails com conteúdo dinâmico baseado nos dados do contato</p>
        </div>
        <Button onClick={addBlock}><Plus className="h-4 w-4 mr-2" /> Adicionar Bloco</Button>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="code">Código</TabsTrigger>
          <TabsTrigger value="help">Como Usar</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {blocks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <Wand2 className="h-16 w-16 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold text-foreground">Nenhum bloco condicional</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Crie blocos de conteúdo que mudam automaticamente com base nas características de cada contato.
                </p>
                <Button onClick={addBlock}><Plus className="h-4 w-4 mr-2" /> Criar Bloco</Button>
              </CardContent>
            </Card>
          ) : (
            blocks.map((block, i) => (
              <Card key={block.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Bloco Condicional #{i + 1}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => removeBlock(block.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Campo</label>
                      <Select value={block.condition_field} onValueChange={v => updateBlock(block.id, { condition_field: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {fields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Operador</label>
                      <Select value={block.condition_operator} onValueChange={v => updateBlock(block.id, { condition_operator: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {operators.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Valor</label>
                      <Input value={block.condition_value} onChange={e => updateBlock(block.id, { condition_value: e.target.value })} placeholder="Ex: cliente_vip" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-success">✓ Se verdadeiro, mostrar:</label>
                      <Textarea value={block.content_if_true} onChange={e => updateBlock(block.id, { content_if_true: e.target.value })} placeholder="Conteúdo para quem atende a condição" rows={3} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-destructive">✗ Se falso, mostrar:</label>
                      <Textarea value={block.content_if_false} onChange={e => updateBlock(block.id, { content_if_false: e.target.value })} placeholder="Conteúdo alternativo" rows={3} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> Código Gerado</CardTitle>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generateAllCode()); toast.success('Código copiado!'); }}>
                  <Copy className="h-4 w-4 mr-1" /> Copiar
                </Button>
              </div>
              <CardDescription>Cole este código no editor de e-mail para usar conteúdo dinâmico</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap text-foreground">
                {generateAllCode() || '// Adicione blocos condicionais para gerar o código'}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader><CardTitle>Como usar Conteúdo Condicional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Variáveis disponíveis</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    '{{contact.first_name}}', '{{contact.email}}', '{{contact.phone}}',
                    '{{contact.company}}', '{{contact.city}}', '{{contact.lead_score}}',
                    '{{contact.source}}', '{{contact.status}}', '{{contact.tags}}',
                  ].map(v => (
                    <Badge key={v} variant="outline" className="justify-between cursor-pointer" onClick={() => { navigator.clipboard.writeText(v); toast.success('Copiado!'); }}>
                      <span className="font-mono text-xs">{v}</span>
                      <Copy className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">Exemplo</h3>
                <pre className="bg-muted p-4 rounded-lg text-sm text-foreground">
{`Olá {{contact.first_name}},

{% if contact.tag contains "vip" %}
  Como cliente VIP, você tem acesso exclusivo a 30% de desconto!
{% else %}
  Confira nossas ofertas especiais para esta semana.
{% endif %}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
