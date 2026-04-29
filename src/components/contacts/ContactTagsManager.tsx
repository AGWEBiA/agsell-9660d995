import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, X, Tag as TagIcon, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContactTagsManagerProps {
  contactId: string;
}

export function ContactTagsManager({ contactId }: ContactTagsManagerProps) {
  const queryClient = useQueryClient();
  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: contactTags = [], isLoading } = useQuery({
    queryKey: ['contact-tags', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('tag_id, tags(id, name, color)')
        .eq('contact_id', contactId);
      if (error) throw error;
      return (data || []).map((r: any) => r.tags).filter(Boolean) as Array<{ id: string; name: string; color: string | null }>;
    },
    enabled: !!contactId,
  });

  const addTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('contact_tags')
        .insert({ contact_id: contactId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
      toast.success('Tag adicionada!');
    },
    onError: (e: any) => toast.error('Erro ao adicionar tag: ' + e.message),
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('contact_id', contactId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
      toast.success('Tag removida!');
    },
    onError: (e: any) => toast.error('Erro ao remover tag: ' + e.message),
  });

  const assignedIds = new Set(contactTags.map(t => t.id));
  const trimmed = search.trim();
  const exactMatch = allTags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());

  const handleCreateAndAssign = async () => {
    if (!trimmed) return;
    try {
      const newTag = await createTag.mutateAsync({ name: trimmed });
      await addTag.mutateAsync(newTag.id);
      setSearch('');
    } catch {}
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : contactTags.length === 0 ? (
          <span className="text-xs text-muted-foreground">Nenhuma tag</span>
        ) : (
          contactTags.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color, borderColor: tag.color } : undefined}
              className="gap-1 pr-1 border"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag.mutate(tag.id)}
                disabled={removeTag.isPending}
                className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                aria-label={`Remover tag ${tag.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar ou criar tag..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {trimmed ? (
                    <button
                      type="button"
                      onClick={handleCreateAndAssign}
                      disabled={createTag.isPending || addTag.isPending}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm flex items-center gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Criar "{trimmed}"
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhuma tag</span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {allTags
                    .filter(t => t.name.toLowerCase().includes(trimmed.toLowerCase()))
                    .map(tag => {
                      const isAssigned = assignedIds.has(tag.id);
                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            if (isAssigned) {
                              removeTag.mutate(tag.id);
                            } else {
                              addTag.mutate(tag.id);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border"
                            style={{ backgroundColor: tag.color || 'transparent' }}
                          />
                          <span className="flex-1">{tag.name}</span>
                          {isAssigned && <Check className="h-3.5 w-3.5 text-primary" />}
                        </CommandItem>
                      );
                    })}
                  {trimmed && !exactMatch && (
                    <CommandItem onSelect={handleCreateAndAssign} className="flex items-center gap-2">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Criar "{trimmed}"</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
