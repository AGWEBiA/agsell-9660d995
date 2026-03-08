import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { GitBranch, Plus, Trash2, Tag, Eye } from 'lucide-react';

interface ConditionalBlock {
  id: string;
  condition_type: 'tag' | 'field' | 'score' | 'segment';
  operator: 'has' | 'not_has' | 'equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
  content: string;
}

interface Props {
  onInsert: (html: string) => void;
}

export function EmailConditionalContent({ onInsert }: Props) {
  const [blocks, setBlocks] = useState<ConditionalBlock[]>([]);
  const [fallbackContent, setFallbackContent] = useState('');

  const addBlock = () => {
    setBlocks(prev => [...prev, {
      id: crypto.randomUUID(),
      condition_type: 'tag',
      operator: 'has',
      value: '',
      content: '',
    }]);
  };

  const updateBlock = (id: string, updates: Partial<ConditionalBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const generateHTML = () => {
    let html = '<!-- AG Sell Conditional Content -->\n';
    blocks.forEach((block, i) => {
      const conditionComment = `${block.condition_type} ${block.operator} "${block.value}"`;
      html += `<!--[if ${conditionComment}]-->\n${block.content}\n<!--[endif]-->\n`;
    });
    if (fallbackContent) {
      html += `<!--[else]-->\n${fallbackContent}\n<!--[endelse]-->\n`;
    }
    html += '<!-- /AG Sell Conditional Content -->';
    return html;
  };

  const handleInsert = () => {
    const html = generateHTML();
    onInsert(html);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <GitBranch className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">Conteúdo Condicional</CardTitle>
            <CardDescription>Mostre conteúdo diferente baseado em tags, campos ou score do contato</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocks.map((block, index) => (
          <div key={block.id} className="p-3 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {index === 0 ? 'SE' : 'OU SE'}
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeBlock(block.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={block.condition_type} onValueChange={v => updateBlock(block.id, { condition_type: v as any })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tag">Tag</SelectItem>
                  <SelectItem value="field">Campo</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="segment">Segmento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={block.operator} onValueChange={v => updateBlock(block.id, { operator: v as any })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="has">tem</SelectItem>
                  <SelectItem value="not_has">não tem</SelectItem>
                  <SelectItem value="equals">é igual a</SelectItem>
                  <SelectItem value="greater_than">maior que</SelectItem>
                  <SelectItem value="less_than">menor que</SelectItem>
                  <SelectItem value="contains">contém</SelectItem>
                </SelectContent>
              </Select>
              <Input className="h-8 text-xs" placeholder="Valor..." value={block.value} onChange={e => updateBlock(block.id, { value: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Conteúdo HTML</Label>
              <textarea
                className="w-full mt-1 min-h-[60px] text-xs p-2 rounded-md border bg-background resize-y font-mono"
                placeholder="<p>Conteúdo para esta condição...</p>"
                value={block.content}
                onChange={e => updateBlock(block.id, { content: e.target.value })}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addBlock} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar Condição
        </Button>

        {blocks.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Conteúdo padrão (fallback)
              </Label>
              <textarea
                className="w-full min-h-[60px] text-xs p-2 rounded-md border bg-background resize-y font-mono"
                placeholder="<p>Conteúdo exibido quando nenhuma condição é verdadeira...</p>"
                value={fallbackContent}
                onChange={e => setFallbackContent(e.target.value)}
              />
            </div>
            <Button onClick={handleInsert} size="sm" className="w-full">
              <GitBranch className="h-3.5 w-3.5 mr-1.5" /> Inserir Conteúdo Condicional
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
