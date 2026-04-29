import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, ListFilter } from 'lucide-react';
import { useSmartLists, useCreateSmartList, useDeleteSmartList, type SmartListEntity, type SmartListFilter } from '@/hooks/useSmartLists';

const ops: SmartListFilter['op'][] = ['eq', 'neq', 'contains', 'starts', 'gt', 'gte', 'lt', 'lte', 'is_null', 'not_null'];

export function SmartListsPanel() {
  const [entity, setEntity] = useState<SmartListEntity>('contact');
  const { data: lists = [] } = useSmartLists();
  const create = useCreateSmartList();
  const del = useDeleteSmartList();

  const [name, setName] = useState('');
  const [pinned, setPinned] = useState(false);
  const [filters, setFilters] = useState<SmartListFilter[]>([{ field: '', op: 'eq', value: '' }]);

  const updateFilter = (i: number, patch: Partial<SmartListFilter>) =>
    setFilters(filters.map((f, idx) => idx === i ? { ...f, ...patch } : f));

  const handleCreate = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({
      name: name.trim(), entity_type: entity, filters: filters.filter(f => f.field),
      is_shared: false, icon: null, color: null, pinned, sort_order: lists.length,
    });
    setName(''); setPinned(false); setFilters([{ field: '', op: 'eq', value: '' }]);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListFilter className="h-4 w-4" /> Nova Lista Inteligente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Hot Leads SP" /></div>
            <div>
              <Label>Entidade</Label>
              <Select value={entity} onValueChange={(v) => setEntity(v as SmartListEntity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contatos</SelectItem>
                  <SelectItem value="company">Empresas</SelectItem>
                  <SelectItem value="deal">Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Filtros</Label>
            {filters.map((f, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-4" placeholder="Campo (ex: status, lead_score)" value={f.field} onChange={(e) => updateFilter(i, { field: e.target.value })} />
                <Select value={f.op} onValueChange={(v) => updateFilter(i, { op: v as any })}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>{ops.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="col-span-4" placeholder="Valor" value={f.value ?? ''} onChange={(e) => updateFilter(i, { value: e.target.value })} disabled={f.op === 'is_null' || f.op === 'not_null'} />
                <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setFilters(filters.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setFilters([...filters, { field: '', op: 'eq', value: '' }])}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Filtro
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={pinned} onCheckedChange={setPinned} /> Fixar no topo</label>
          <Button onClick={handleCreate} disabled={!name.trim()}><Plus className="h-4 w-4 mr-2" /> Criar Lista</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Listas ({lists.length})</CardTitle></CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma lista criada.</p>
          ) : (
            <div className="space-y-2">
              {lists.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {l.name} {l.pinned && <Badge variant="secondary">📌</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-1 mt-1">
                      <Badge variant="outline">{l.entity_type}</Badge>
                      <Badge variant="outline">{(l.filters as any[])?.length || 0} filtros</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => del.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
