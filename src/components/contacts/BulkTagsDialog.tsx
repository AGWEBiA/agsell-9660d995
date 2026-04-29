import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTags } from '@/hooks/useTags';
import { useBulkApplyTags } from '@/hooks/useContactTags';
import { Loader2, Tags, Search } from 'lucide-react';
import { toast } from 'sonner';

interface BulkTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactIds: string[];
}

export function BulkTagsDialog({ open, onOpenChange, contactIds }: BulkTagsDialogProps) {
  const { data: allTags = [] } = useTags();
  const bulkApply = useBulkApplyTags();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => allTags.filter(t => t.name.toLowerCase().includes(search.trim().toLowerCase())),
    [allTags, search]
  );

  const handleApply = async () => {
    if (selected.size === 0) {
      toast.warning('Selecione ao menos uma tag.');
      return;
    }
    if (contactIds.length === 0) {
      toast.warning('Selecione ao menos um contato.');
      return;
    }
    try {
      const res = await bulkApply.mutateAsync({
        contactIds,
        tagIds: Array.from(selected),
      });
      toast.success(
        `Tags aplicadas: ${res.inserted} associações criadas` +
        (res.skipped > 0 ? `, ${res.skipped} já existiam (ignoradas).` : '.')
      );
      setSelected(new Set());
      onOpenChange(false);
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Aplicar tags em massa
          </DialogTitle>
          <DialogDescription>
            {contactIds.length} contato(s) selecionado(s). Tags duplicadas são ignoradas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[280px] rounded-md border p-2">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma tag encontrada</p>
            ) : (
              <div className="space-y-1">
                {filtered.map(tag => {
                  const checked = selected.has(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = new Set(selected);
                          if (v) next.add(tag.id); else next.delete(tag.id);
                          setSelected(next);
                        }}
                      />
                      <span
                        className="h-2.5 w-2.5 rounded-full border"
                        style={{ backgroundColor: tag.color || 'transparent' }}
                      />
                      <span className="text-sm flex-1">{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          {selected.size > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(selected).map(id => {
                const t = allTags.find(x => x.id === id);
                if (!t) return null;
                return <Badge key={id} variant="secondary">{t.name}</Badge>;
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={bulkApply.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={bulkApply.isPending || selected.size === 0}>
            {bulkApply.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Aplicar a {contactIds.length} contato(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
