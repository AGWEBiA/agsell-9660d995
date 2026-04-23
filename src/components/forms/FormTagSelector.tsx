import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag as TagIcon, X } from 'lucide-react';
import { useTags } from '@/hooks/useTags';

const NEW_TAG_VALUE = '__new__';
const NONE_VALUE = '__none__';

interface FormTagSelectorProps {
  tagId?: string | null;
  tagName?: string | null;
  onChange: (next: { tag_id: string | null; tag_name: string | null }) => void;
}

/**
 * Seletor de tag para formulários: permite escolher uma tag existente
 * ou digitar o nome de uma nova (criada na primeira submissão).
 */
export function FormTagSelector({ tagId, tagName, onChange }: FormTagSelectorProps) {
  const { data: tags = [], isLoading } = useTags();
  const initialMode: 'existing' | 'new' = tagName && !tagId ? 'new' : 'existing';
  const [mode, setMode] = useState<'existing' | 'new'>(initialMode);

  const selectedTag = tags.find((t) => t.id === tagId);

  const selectValue = tagId ? tagId : NONE_VALUE;

  const handleSelect = (value: string) => {
    if (value === NEW_TAG_VALUE) {
      setMode('new');
      onChange({ tag_id: null, tag_name: tagName ?? '' });
    } else if (value === NONE_VALUE) {
      onChange({ tag_id: null, tag_name: null });
    } else {
      setMode('existing');
      onChange({ tag_id: value, tag_name: null });
    }
  };

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-primary" />
          Tag automática
        </Label>
        {(tagId || tagName) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setMode('existing');
              onChange({ tag_id: null, tag_name: null });
            }}
          >
            <X className="h-3 w-3 mr-1" />
            Remover
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Todo lead que enviar este formulário será marcado com esta tag.
      </p>

      {mode === 'existing' ? (
        <div className="space-y-2">
          <Select value={selectValue} onValueChange={handleSelect} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma tag…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>Sem tag</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: tag.color || 'hsl(var(--primary))' }}
                    />
                    {tag.name}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value={NEW_TAG_VALUE}>+ Criar nova tag…</SelectItem>
            </SelectContent>
          </Select>
          {selectedTag && (
            <Badge variant="secondary" className="text-xs">
              Tag: {selectedTag.name}
            </Badge>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Ex: webinar-junho-2026"
            value={tagName ?? ''}
            onChange={(e) => onChange({ tag_id: null, tag_name: e.target.value })}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              A tag será criada na primeira submissão.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setMode('existing');
                onChange({ tag_id: null, tag_name: null });
              }}
            >
              Usar existente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
