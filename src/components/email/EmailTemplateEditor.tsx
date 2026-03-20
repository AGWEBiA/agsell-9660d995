import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Type, Image, Square, Link2, List, Minus, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Palette, Eye, Code, Trash2, GripVertical, Plus,
  ChevronUp, ChevronDown, Video, Quote, ListOrdered, Table, Star, MapPin,
  Clock, Share2, Users, Heading1, Heading2, LayoutGrid, Copy,
} from 'lucide-react';

type BlockType = 'text' | 'heading' | 'image' | 'button' | 'divider' | 'spacer' | 'columns' | 'video' | 'social' | 'quote' | 'list' | 'timer' | 'html';

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
}

interface EmailTemplateEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const blockCategories = [
  {
    label: 'Conteúdo',
    blocks: [
      { type: 'heading' as BlockType, label: 'Título', icon: Heading1 },
      { type: 'text' as BlockType, label: 'Texto', icon: Type },
      { type: 'image' as BlockType, label: 'Imagem', icon: Image },
      { type: 'video' as BlockType, label: 'Vídeo', icon: Video },
      { type: 'quote' as BlockType, label: 'Citação', icon: Quote },
      { type: 'list' as BlockType, label: 'Lista', icon: List },
    ],
  },
  {
    label: 'Ação',
    blocks: [
      { type: 'button' as BlockType, label: 'Botão', icon: Square },
      { type: 'social' as BlockType, label: 'Redes Sociais', icon: Share2 },
      { type: 'timer' as BlockType, label: 'Countdown', icon: Clock },
    ],
  },
  {
    label: 'Layout',
    blocks: [
      { type: 'divider' as BlockType, label: 'Divisor', icon: Minus },
      { type: 'spacer' as BlockType, label: 'Espaço', icon: LayoutGrid },
      { type: 'columns' as BlockType, label: 'Colunas', icon: LayoutGrid },
      { type: 'html' as BlockType, label: 'HTML', icon: Code },
    ],
  },
];

const presetTemplates = [
  {
    id: 'welcome',
    name: 'Boas-vindas',
    description: 'Email de boas-vindas para novos leads',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Logo', align: 'center', width: '200px' } },
      { id: '2', type: 'heading' as BlockType, content: { text: 'Olá {{nome}}, seja bem-vindo!', align: 'center', level: 'h1', color: '#1a1a2e' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Estamos muito felizes em ter você conosco. Explore nossos recursos e descubra como podemos ajudar você a alcançar seus objetivos.', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Começar Agora', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: false } },
      { id: '5', type: 'divider' as BlockType, content: { color: '#E5E7EB', style: 'solid', thickness: '1px' } },
      { id: '6', type: 'text' as BlockType, content: { text: 'Abraços,\nEquipe AG Sell', align: 'left', fontSize: '14px' } },
    ],
  },
  {
    id: 'promotion',
    name: 'Promoção',
    description: 'Email promocional com desconto',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Banner', align: 'center', width: '100%' } },
      { id: '2', type: 'heading' as BlockType, content: { text: '🎉 OFERTA ESPECIAL 🎉', align: 'center', level: 'h1', color: '#dc2626' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Por tempo limitado, aproveite 50% de desconto em todos os planos!', align: 'center', fontSize: '18px', lineHeight: '1.5' } },
      { id: '4', type: 'timer' as BlockType, content: { endDate: '', label: 'Oferta expira em:', align: 'center' } },
      { id: '5', type: 'button' as BlockType, content: { text: 'Aproveitar Desconto', url: '#', align: 'center', bgColor: '#22C55E', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: true } },
      { id: '6', type: 'text' as BlockType, content: { text: '*Oferta válida até o final do mês', align: 'center', fontSize: '12px', color: '#666' } },
    ],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Newsletter mensal',
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: { text: 'Newsletter - {{mes}} {{ano}}', align: 'center', level: 'h1', color: '#1a1a2e' } },
      { id: '2', type: 'divider' as BlockType, content: { color: '#3B82F6', style: 'solid', thickness: '3px' } },
      { id: '3', type: 'heading' as BlockType, content: { text: '📢 Novidades do Mês', align: 'left', level: 'h2', color: '#1a1a2e' } },
      { id: '4', type: 'text' as BlockType, content: { text: 'Aqui está um resumo das principais novidades e atualizações da nossa plataforma.', align: 'left', fontSize: '16px', lineHeight: '1.6' } },
      { id: '5', type: 'spacer' as BlockType, content: { height: '20px' } },
      { id: '6', type: 'heading' as BlockType, content: { text: '💡 Dicas da Semana', align: 'left', level: 'h2', color: '#1a1a2e' } },
      { id: '7', type: 'list' as BlockType, content: { items: ['Otimize suas automações', 'Segmente seus contatos', 'Acompanhe as métricas'], ordered: false } },
      { id: '8', type: 'button' as BlockType, content: { text: 'Ler Mais no Blog', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px' } },
      { id: '9', type: 'divider' as BlockType, content: { color: '#E5E7EB', style: 'solid', thickness: '1px' } },
      { id: '10', type: 'social' as BlockType, content: { align: 'center', instagram: '#', facebook: '#', linkedin: '#', youtube: '#' } },
    ],
  },
  {
    id: 'abandoned-cart',
    name: 'Carrinho Abandonado',
    description: 'Recuperar vendas de carrinho abandonado',
    blocks: [
      { id: '1', type: 'heading' as BlockType, content: { text: 'Você esqueceu algo! 🛒', align: 'center', level: 'h1', color: '#1a1a2e' } },
      { id: '2', type: 'text' as BlockType, content: { text: 'Olá {{nome}}, notamos que você deixou itens no carrinho. Finalize sua compra agora e aproveite condições especiais!', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '3', type: 'spacer' as BlockType, content: { height: '16px' } },
      { id: '4', type: 'button' as BlockType, content: { text: 'Finalizar Compra', url: '#', align: 'center', bgColor: '#F59E0B', textColor: '#000000', borderRadius: '8px', fullWidth: true } },
      { id: '5', type: 'spacer' as BlockType, content: { height: '12px' } },
      { id: '6', type: 'text' as BlockType, content: { text: 'Seu carrinho será mantido por mais 24h.', align: 'center', fontSize: '13px', color: '#999' } },
    ],
  },
  {
    id: 'event-invite',
    name: 'Convite para Evento',
    description: 'Convite para webinar ou evento',
    blocks: [
      { id: '1', type: 'image' as BlockType, content: { src: '', alt: 'Banner do Evento', align: 'center', width: '100%' } },
      { id: '2', type: 'heading' as BlockType, content: { text: 'Você está convidado! 🎤', align: 'center', level: 'h1', color: '#7c3aed' } },
      { id: '3', type: 'text' as BlockType, content: { text: 'Participe do nosso webinar exclusivo sobre estratégias de marketing digital e vendas.', align: 'center', fontSize: '16px', lineHeight: '1.6' } },
      { id: '4', type: 'quote' as BlockType, content: { text: '📅 Data: DD/MM/AAAA às 19h\n📍 Online via Zoom\n⏰ Duração: 1h30', borderColor: '#7c3aed' } },
      { id: '5', type: 'button' as BlockType, content: { text: 'Garantir Minha Vaga', url: '#', align: 'center', bgColor: '#7c3aed', textColor: '#FFFFFF', borderRadius: '8px' } },
    ],
  },
];

export function EmailTemplateEditor({ content, onChange }: EmailTemplateEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try { return JSON.parse(content) || []; } catch { return []; }
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'code'>('edit');

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(JSON.stringify(newBlocks));
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: crypto.randomUUID(), type, content: getDefaultContent(type) };
    updateBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const duplicateBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const newBlock = { ...block, id: crypto.randomUUID(), content: { ...block.content } };
    const idx = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
  };

  const getDefaultContent = (type: BlockType): Record<string, unknown> => {
    switch (type) {
      case 'heading': return { text: 'Seu título aqui', align: 'center', level: 'h1', color: '#1a1a2e' };
      case 'text': return { text: 'Digite seu texto aqui...', align: 'left', fontSize: '16px', lineHeight: '1.6', color: '#333333', bold: false, italic: false, underline: false };
      case 'image': return { src: '', alt: 'Imagem', align: 'center', width: '100%', link: '' };
      case 'video': return { url: '', thumbnailUrl: '', align: 'center' };
      case 'button': return { text: 'Clique Aqui', url: '#', align: 'center', bgColor: '#3B82F6', textColor: '#FFFFFF', borderRadius: '8px', fullWidth: false, size: 'md' };
      case 'divider': return { color: '#E5E7EB', style: 'solid', thickness: '1px' };
      case 'spacer': return { height: '20px' };
      case 'columns': return { columns: 2, gap: '16px' };
      case 'quote': return { text: 'Sua citação aqui...', borderColor: '#3B82F6', bgColor: '#F8FAFC' };
      case 'list': return { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false };
      case 'social': return { align: 'center', instagram: '', facebook: '', linkedin: '', youtube: '', twitter: '' };
      case 'timer': return { endDate: '', label: 'Oferta expira em:', align: 'center' };
      case 'html': return { code: '<div style="text-align:center;">HTML personalizado</div>' };
      default: return {};
    }
  };

  const updateBlockContent = (blockId: string, newContent: Record<string, unknown>) => {
    updateBlocks(blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...newContent } } : b));
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === blockId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === blocks.length - 1)) return;
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  const loadTemplate = (templateId: string) => {
    const template = presetTemplates.find(t => t.id === templateId);
    if (template) updateBlocks(template.blocks.map(b => ({ ...b, id: crypto.randomUUID() })));
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const renderBlockPreview = (block: Block) => {
    const c = block.content;
    switch (block.type) {
      case 'heading': {
        const Tag = (c.level as string) === 'h2' ? 'h2' : (c.level as string) === 'h3' ? 'h3' : 'h1';
        const sizes = { h1: '28px', h2: '22px', h3: '18px' };
        return <Tag style={{ textAlign: (c.align as any) || 'center', color: (c.color as string) || '#1a1a2e', fontSize: sizes[(c.level as string) as keyof typeof sizes] || '28px', fontWeight: 'bold', margin: '8px 0' }}>{(c.text as string) || 'Título'}</Tag>;
      }
      case 'text': {
        const style: React.CSSProperties = {
          textAlign: (c.align as any) || 'left',
          fontSize: (c.fontSize as string) || '16px',
          fontWeight: c.bold ? 'bold' : 'normal',
          fontStyle: c.italic ? 'italic' : 'normal',
          textDecoration: c.underline ? 'underline' : 'none',
          color: (c.color as string) || '#333',
          lineHeight: (c.lineHeight as string) || '1.6',
        };
        return <div style={style} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(((c.text as string) || '').replace(/\n/g, '<br>'), { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'], ALLOWED_ATTR: ['href', 'target', 'style'] }) }} />;
      }
      case 'image':
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            {c.src ? (
              <img src={c.src as string} alt={c.alt as string} style={{ maxWidth: (c.width as string) || '100%', display: 'inline-block' }} />
            ) : (
              <div className="bg-muted h-40 flex flex-col items-center justify-center rounded-md gap-2">
                <Image className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Insira a URL da imagem</span>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            {c.url ? (
              <div className="bg-muted rounded-md p-4 flex flex-col items-center gap-2">
                <Video className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate max-w-full">{c.url as string}</span>
                <span className="text-[10px] text-muted-foreground">O vídeo será exibido como thumbnail com link</span>
              </div>
            ) : (
              <div className="bg-muted h-32 flex flex-col items-center justify-center rounded-md gap-2">
                <Video className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Insira a URL do vídeo</span>
              </div>
            )}
          </div>
        );
      case 'button': {
        const btnSize = { sm: '8px 16px', md: '12px 24px', lg: '16px 32px' };
        return (
          <div style={{ textAlign: (c.align as any) || 'center' }}>
            <button style={{
              backgroundColor: (c.bgColor as string) || '#3B82F6',
              color: (c.textColor as string) || '#FFFFFF',
              padding: btnSize[(c.size as string) as keyof typeof btnSize] || '12px 24px',
              borderRadius: (c.borderRadius as string) || '8px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              width: c.fullWidth ? '100%' : 'auto',
              fontSize: (c.size as string) === 'lg' ? '18px' : (c.size as string) === 'sm' ? '13px' : '15px',
            }}>
              {(c.text as string) || 'Botão'}
            </button>
          </div>
        );
      }
      case 'divider':
        return <hr style={{ borderColor: (c.color as string) || '#E5E7EB', borderStyle: (c.style as string) || 'solid', borderWidth: `${(c.thickness as string) || '1px'} 0 0 0` }} />;
      case 'spacer':
        return <div style={{ height: (c.height as string) || '20px' }} className="bg-muted/30 rounded flex items-center justify-center text-[10px] text-muted-foreground">{c.height as string}</div>;
      case 'quote':
        return (
          <div style={{ borderLeft: `4px solid ${(c.borderColor as string) || '#3B82F6'}`, padding: '12px 16px', backgroundColor: (c.bgColor as string) || '#F8FAFC', borderRadius: '0 8px 8px 0', margin: '8px 0' }}>
            <p style={{ fontStyle: 'italic', fontSize: '15px', color: '#555', margin: 0, whiteSpace: 'pre-wrap' }}>{(c.text as string) || 'Citação'}</p>
          </div>
        );
      case 'list': {
        const items = (c.items as string[]) || [];
        const ListTag = c.ordered ? 'ol' : 'ul';
        return (
          <ListTag style={{ paddingLeft: '20px', margin: '8px 0' }}>
            {items.map((item, i) => <li key={i} style={{ marginBottom: '4px', fontSize: '15px', color: '#333' }}>{item}</li>)}
          </ListTag>
        );
      }
      case 'social': {
        const socials = [
          { key: 'instagram', label: 'Instagram', emoji: '📸' },
          { key: 'facebook', label: 'Facebook', emoji: '👍' },
          { key: 'linkedin', label: 'LinkedIn', emoji: '💼' },
          { key: 'youtube', label: 'YouTube', emoji: '🎬' },
          { key: 'twitter', label: 'X/Twitter', emoji: '🐦' },
        ].filter(s => c[s.key]);
        return (
          <div style={{ textAlign: (c.align as any) || 'center', padding: '8px 0' }}>
            {socials.length === 0 ? (
              <span className="text-xs text-muted-foreground">Configure os links das redes sociais</span>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {socials.map(s => (
                  <span key={s.key} style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'underline', cursor: 'pointer' }}>{s.emoji} {s.label}</span>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'timer':
        return (
          <div style={{ textAlign: (c.align as any) || 'center', padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: '#92400E', margin: '0 0 8px 0' }}>{(c.label as string) || 'Oferta expira em:'}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {['00d', '00h', '00m', '00s'].map((t, i) => (
                <span key={i} style={{ backgroundColor: '#FDE68A', padding: '8px 12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px', color: '#78350F' }}>{t}</span>
              ))}
            </div>
          </div>
        );
      case 'html':
        return <div className="bg-muted/50 p-3 rounded border text-xs font-mono overflow-hidden" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((c.code as string) || '') }} />;
      default:
        return null;
    }
  };

  const renderPropertiesPanel = () => {
    if (!selectedBlock) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Nenhum bloco selecionado</p>
          <p className="text-xs mt-1">Clique em um bloco no editor para editar suas propriedades</p>
        </div>
      );
    }

    const AlignButtons = ({ value, onChange: onAlignChange }: { value: string; onChange: (v: string) => void }) => (
      <div className="flex gap-1">
        {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }].map(({ v, I }) => (
          <Button key={v} size="icon" variant={value === v ? 'default' : 'outline'} className="h-8 w-8" onClick={() => onAlignChange(v)}><I className="h-4 w-4" /></Button>
        ))}
      </div>
    );

    const c = selectedBlock.content;
    const update = (data: Record<string, unknown>) => updateBlockContent(selectedBlock.id, data);

    switch (selectedBlock.type) {
      case 'heading':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Texto</Label><Input value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="space-y-2"><Label>Nível</Label>
              <Select value={(c.level as string) || 'h1'} onValueChange={v => update({ level: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1 — Grande</SelectItem>
                  <SelectItem value="h2">H2 — Médio</SelectItem>
                  <SelectItem value="h3">H3 — Pequeno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <div className="space-y-2"><Label>Cor</Label><Input type="color" value={(c.color as string) || '#1a1a2e'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Texto</Label><Textarea rows={5} value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} placeholder="Digite seu texto..." /></div>
            <div className="space-y-2">
              <Label>Formatação</Label>
              <div className="flex gap-1">
                <Button size="icon" variant={c.bold ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ bold: !c.bold })}><Bold className="h-4 w-4" /></Button>
                <Button size="icon" variant={c.italic ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ italic: !c.italic })}><Italic className="h-4 w-4" /></Button>
                <Button size="icon" variant={c.underline ? 'default' : 'outline'} className="h-8 w-8" onClick={() => update({ underline: !c.underline })}><Underline className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'left'} onChange={v => update({ align: v })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tamanho</Label><Input value={(c.fontSize as string) || '16px'} onChange={e => update({ fontSize: e.target.value })} /></div>
              <div className="space-y-2"><Label>Altura linha</Label><Input value={(c.lineHeight as string) || '1.6'} onChange={e => update({ lineHeight: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Cor do texto</Label><Input type="color" value={(c.color as string) || '#333333'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>URL da Imagem</Label><Input value={(c.src as string) || ''} onChange={e => update({ src: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Texto Alternativo</Label><Input value={(c.alt as string) || ''} onChange={e => update({ alt: e.target.value })} /></div>
            <div className="space-y-2"><Label>Largura</Label><Input value={(c.width as string) || '100%'} onChange={e => update({ width: e.target.value })} placeholder="100% ou 300px" /></div>
            <div className="space-y-2"><Label>Link (ao clicar)</Label><Input value={(c.link as string) || ''} onChange={e => update({ link: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>URL do Vídeo</Label><Input value={(c.url as string) || ''} onChange={e => update({ url: e.target.value })} placeholder="https://youtube.com/..." /></div>
            <div className="space-y-2"><Label>URL da Thumbnail</Label><Input value={(c.thumbnailUrl as string) || ''} onChange={e => update({ thumbnailUrl: e.target.value })} placeholder="https://..." /></div>
            <p className="text-xs text-muted-foreground">Em emails, vídeos são exibidos como imagem com link de play.</p>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Texto</Label><Input value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="space-y-2"><Label>URL</Label><Input value={(c.url as string) || ''} onChange={e => update({ url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Tamanho</Label>
              <Select value={(c.size as string) || 'md'} onValueChange={v => update({ size: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Pequeno</SelectItem>
                  <SelectItem value="md">Médio</SelectItem>
                  <SelectItem value="lg">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Cor Fundo</Label><Input type="color" value={(c.bgColor as string) || '#3B82F6'} onChange={e => update({ bgColor: e.target.value })} className="h-8" /></div>
              <div className="space-y-2"><Label>Cor Texto</Label><Input type="color" value={(c.textColor as string) || '#FFFFFF'} onChange={e => update({ textColor: e.target.value })} className="h-8" /></div>
            </div>
            <div className="space-y-2"><Label>Borda arredondada</Label><Input value={(c.borderRadius as string) || '8px'} onChange={e => update({ borderRadius: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={!!c.fullWidth} onCheckedChange={v => update({ fullWidth: v })} /><Label>Largura total</Label></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
          </div>
        );

      case 'divider':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Cor</Label><Input type="color" value={(c.color as string) || '#E5E7EB'} onChange={e => update({ color: e.target.value })} className="h-8" /></div>
            <div className="space-y-2"><Label>Estilo</Label>
              <Select value={(c.style as string) || 'solid'} onValueChange={v => update({ style: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="dashed">Tracejado</SelectItem>
                  <SelectItem value="dotted">Pontilhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Espessura</Label><Input value={(c.thickness as string) || '1px'} onChange={e => update({ thickness: e.target.value })} /></div>
          </div>
        );

      case 'spacer':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Altura</Label><Input value={(c.height as string) || '20px'} onChange={e => update({ height: e.target.value })} /></div>
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Citação</Label><Textarea rows={3} value={(c.text as string) || ''} onChange={e => update({ text: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Cor borda</Label><Input type="color" value={(c.borderColor as string) || '#3B82F6'} onChange={e => update({ borderColor: e.target.value })} className="h-8" /></div>
              <div className="space-y-2"><Label>Cor fundo</Label><Input type="color" value={(c.bgColor as string) || '#F8FAFC'} onChange={e => update({ bgColor: e.target.value })} className="h-8" /></div>
            </div>
          </div>
        );

      case 'list': {
        const items = (c.items as string[]) || [];
        return (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-2"><Switch checked={!!c.ordered} onCheckedChange={v => update({ ordered: v })} /><Label>Lista numerada</Label></div>
            <div className="space-y-2">
              <Label>Itens (um por linha)</Label>
              <Textarea rows={5} value={items.join('\n')} onChange={e => update({ items: e.target.value.split('\n') })} placeholder="Item 1&#10;Item 2&#10;Item 3" />
            </div>
          </div>
        );
      }

      case 'social':
        return (
          <div className="space-y-3 p-4">
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            {['instagram', 'facebook', 'linkedin', 'youtube', 'twitter'].map(network => (
              <div key={network} className="space-y-1">
                <Label className="capitalize text-xs">{network}</Label>
                <Input value={(c[network] as string) || ''} onChange={e => update({ [network]: e.target.value })} placeholder={`https://${network}.com/...`} className="h-8 text-xs" />
              </div>
            ))}
          </div>
        );

      case 'timer':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Legenda</Label><Input value={(c.label as string) || ''} onChange={e => update({ label: e.target.value })} /></div>
            <div className="space-y-2"><Label>Data de expiração</Label><Input type="datetime-local" value={(c.endDate as string) || ''} onChange={e => update({ endDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Alinhamento</Label><AlignButtons value={(c.align as string) || 'center'} onChange={v => update({ align: v })} /></div>
            <p className="text-xs text-muted-foreground">O countdown será renderizado em tempo real no email.</p>
          </div>
        );

      case 'html':
        return (
          <div className="space-y-4 p-4">
            <div className="space-y-2"><Label>Código HTML</Label><Textarea rows={8} value={(c.code as string) || ''} onChange={e => update({ code: e.target.value })} className="font-mono text-xs" /></div>
            <p className="text-xs text-muted-foreground">⚠️ HTML avançado. Certifique-se de que é compatível com clientes de email.</p>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-[650px]">
      {/* Sidebar - Blocks */}
      <div className="col-span-2 border rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Blocos</p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-3">
            {blockCategories.map(cat => (
              <div key={cat.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1 mb-1">{cat.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {cat.blocks.map(({ type, label, icon: Icon }) => (
                    <Button key={type} variant="outline" size="sm" className="h-auto py-2 flex-col gap-1 text-[11px]" onClick={() => addBlock(type)}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-2" />
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase px-1 mb-1">Templates</p>
            <div className="space-y-1.5">
              {presetTemplates.map(template => (
                <Button key={template.id} variant="outline" size="sm" className="w-full justify-start text-left h-auto py-1.5" onClick={() => loadTemplate(template.id)}>
                  <div>
                    <p className="text-[11px] font-medium">{template.name}</p>
                    <p className="text-[10px] text-muted-foreground">{template.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Canvas */}
      <div className="col-span-7 border rounded-lg flex flex-col">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-medium text-sm">Editor</p>
          <div className="flex gap-1">
            {[
              { mode: 'edit' as const, icon: Type, label: 'Editar' },
              { mode: 'preview' as const, icon: Eye, label: 'Preview' },
              { mode: 'code' as const, icon: Code, label: 'HTML' },
            ].map(({ mode, icon: Icon, label }) => (
              <Button key={mode} size="sm" variant={viewMode === mode ? 'default' : 'ghost'} onClick={() => setViewMode(mode)}>
                <Icon className="h-4 w-4 mr-1" />{label}
              </Button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {viewMode === 'edit' && (
            <div className="p-4 space-y-2">
              {blocks.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Type className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground mb-3 text-sm">Comece adicionando blocos ou escolha um template</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => addBlock('heading')}><Heading1 className="h-4 w-4 mr-1" />Título</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('text')}><Type className="h-4 w-4 mr-1" />Texto</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('image')}><Image className="h-4 w-4 mr-1" />Imagem</Button>
                    <Button variant="outline" size="sm" onClick={() => addBlock('button')}><Square className="h-4 w-4 mr-1" />Botão</Button>
                  </div>
                </div>
              ) : (
                blocks.map(block => (
                  <Card
                    key={block.id}
                    className={`cursor-pointer group relative ${selectedBlockId === block.id ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground/20'}`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <CardContent className="p-4">
                      {/* Block controls */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up'); }}><ChevronUp className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down'); }}><ChevronDown className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); duplicateBlock(block.id); }}><Copy className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); removeBlock(block.id); }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      {renderBlockPreview(block)}
                    </CardContent>
                  </Card>
                ))
              )}
              {blocks.length > 0 && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => addBlock('text')}><Plus className="h-3 w-3 mr-1" />Adicionar bloco</Button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900">
              <div className="max-w-[600px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                {blocks.map(block => (
                  <div key={block.id} className="mb-4">{renderBlockPreview(block)}</div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'code' && (
            <div className="p-4">
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(blocks, null, 2)}
              </pre>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3 border rounded-lg flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <p className="font-medium text-sm">Propriedades</p>
        </div>
        <ScrollArea className="flex-1">
          {renderPropertiesPanel()}
        </ScrollArea>
      </div>
    </div>
  );
}
