import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { useCustomFields, useCreateCustomField, useDeleteCustomField, type EntityType, type FieldType } from '@/hooks/useCustomFields';

const fieldTypes: FieldType[] = ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email'];

function FieldsForEntity({ entity }: { entity: EntityType }) {
  const { data: fields = [] } = useCustomFields(entity);
  const create = useCreateCustomField();
  const del = useDeleteCustomField();
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [options, setOptions] = useState('');
  const [required, setRequired] = useState(false);
  const [showInList, setShowInList] = useState(false);

  const handleAdd = async () => {
    if (!label.trim()) return;
    const key = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 40);
    await create.mutateAsync({
      entity_type: entity,
      field_key: key + '_' + Date.now().toString(36),
      field_label: label.trim(),
      field_type: type,
      options: type === 'select' || type === 'multiselect' ? options.split(',').map(s => s.trim()).filter(Boolean) : null,
      is_required: required,
      show_in_list: showInList,
      sort_order: fields.length,
    });
    setLabel(''); setOptions(''); setRequired(false); setShowInList(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Novo Campo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Nome do Campo</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: CNPJ, Aniversário" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{fieldTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {(type === 'select' || type === 'multiselect') && (
            <div>
              <Label>Opções (separar por vírgula)</Label>
              <Input value={options} onChange={(e) => setOptions(e.target.value)} placeholder="Opção 1, Opção 2, Opção 3" />
            </div>
          )}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={required} onCheckedChange={setRequired} /> Obrigatório</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={showInList} onCheckedChange={setShowInList} /> Mostrar na listagem</label>
          </div>
          <Button onClick={handleAdd} disabled={!label.trim() || create.isPending}>
            <Plus className="h-4 w-4 mr-2" /> Criar Campo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Campos Existentes ({fields.length})</CardTitle></CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum campo customizado ainda.</p>
          ) : (
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div>
                    <div className="font-medium">{f.field_label}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                      <Badge variant="outline">{f.field_type}</Badge>
                      {f.is_required && <Badge variant="secondary">Obrigatório</Badge>}
                      {f.show_in_list && <Badge variant="secondary">Em listagem</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => del.mutate(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CustomFieldsManager() {
  return (
    <Tabs defaultValue="contact">
      <TabsList>
        <TabsTrigger value="contact">Contatos</TabsTrigger>
        <TabsTrigger value="company">Empresas</TabsTrigger>
        <TabsTrigger value="deal">Deals</TabsTrigger>
      </TabsList>
      <TabsContent value="contact"><FieldsForEntity entity="contact" /></TabsContent>
      <TabsContent value="company"><FieldsForEntity entity="company" /></TabsContent>
      <TabsContent value="deal"><FieldsForEntity entity="deal" /></TabsContent>
    </Tabs>
  );
}
