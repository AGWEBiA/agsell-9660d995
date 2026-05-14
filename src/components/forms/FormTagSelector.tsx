import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag as TagIcon, X, Check, Plus, ChevronDown } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';
import { normalizeTagInput, normalizeTagFinal } from '@/lib/tag-utils';

interface FormTagSelectorProps {
  tagId?: string | null;
  tagName?: string | null;
  onChange: (next: { tag_id: string | null; tag_name: string | null }) => void;
}

/**
 * Combobox de tag para formulários: digite para filtrar tags existentes
 * ou criar uma nova. A seleção fica visível como um chip "salvo".
 */
export function FormTagSelector({ tagId, tagName, onChange }: FormTagSelectorProps) {
  const { data: tags = [], isLoading } = useTags();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTag = tags.find((t) => t.id === tagId);
  const hasSelection = !!(tagId || tagName);
  const displayName = selectedTag?.name ?? tagName ?? '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  const exactMatch = useMemo(
    () => tags.find((t) => t.name.toLowerCase() === query.trim().toLowerCase()),
    [tags, query],
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleSelectExisting = (id: string, name: string) => {
    onChange({ tag_id: id, tag_name: null });
    setQuery('');
    setOpen(false);
  };

  const handleCreateNew = () => {
    const name = normalizeTagFinal(query);
    if (!name) return;
    onChange({ tag_id: null, tag_name: name });
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange({ tag_id: null, tag_name: null });
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && !canCreate) {
        handleSelectExisting(filtered[0].id, filtered[0].name);
      } else if (canCreate) {
        handleCreateNew();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && hasSelection) {
      handleClear();
    }
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-primary" />
          Tag automática
        </Label>
        {hasSelection && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClear}
          >
            <X className="h-3 w-3 mr-1" />
            Remover
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Todo lead que enviar este formulário será marcado com esta tag.
      </p>

      <div className="relative">
        <div
          className={cn(
            'flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text',
          )}
          onClick={() => setOpen(true)}
        >
          {hasSelection && (
            <Badge
              variant="secondary"
              className="gap-1 pr-1 pl-2 py-0.5 text-xs"
              style={
                selectedTag?.color
                  ? { backgroundColor: `${selectedTag.color}22`, color: selectedTag.color, borderColor: `${selectedTag.color}55` }
                  : undefined
              }
            >
              {tagId ? (
                <Check className="h-3 w-3" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span>{displayName}</span>
              {!tagId && (
                <span className="ml-1 rounded-sm bg-primary/15 px-1 text-[10px] font-medium text-primary">
                  nova
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="ml-0.5 rounded-sm hover:bg-muted p-0.5"
                aria-label="Remover tag"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <input
            value={query}
            onChange={(e) => {
              setQuery(normalizeTagInput(e.target.value));
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={hasSelection ? '' : 'digite-para-buscar-ou-criar…'}
            disabled={isLoading}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-[120px] bg-transparent outline-none placeholder:text-muted-foreground lowercase"
          />
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-64 overflow-auto">
            {canCreate && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground border-b"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>Criar tag</span>
                <Badge variant="secondary" className="text-xs">
                  {query.trim()}
                </Badge>
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <div className="px-3 py-3 text-xs text-muted-foreground">
                {isLoading ? 'Carregando…' : 'Nenhuma tag encontrada.'}
              </div>
            )}
            {filtered.map((tag) => {
              const isSelected = tag.id === tagId;
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => handleSelectExisting(tag.id, tag.name)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent/50',
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || 'hsl(var(--primary))' }}
                  />
                  <span className="flex-1 text-left truncate">{tag.name}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {hasSelection && !tagId && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3 text-primary" />
          Tag <strong className="text-foreground">"{displayName}"</strong> será criada automaticamente na primeira submissão.
        </p>
      )}
      {hasSelection && tagId && selectedTag && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check className="h-3 w-3 text-primary" />
          Usando tag existente: <strong className="text-foreground">{selectedTag.name}</strong>
        </p>
      )}
    </div>
  );
}
