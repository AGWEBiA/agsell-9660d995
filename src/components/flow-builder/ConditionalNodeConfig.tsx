import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { GitBranch, Plus, X, Info } from 'lucide-react';
import { useTags } from '@/hooks/useTags';

interface ConditionalNodeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const FIELD_OPTIONS = [
  { value: 'tag', label: 'Tag', operators: ['has', 'not_has'] },
  { value: 'score', label: 'Lead Score', operators: ['gte', 'lte', 'eq'] },
  { value: 'email', label: 'E-mail', operators: ['exists', 'not_exists', 'contains', 'equals'] },
  { value: 'whatsapp', label: 'WhatsApp', operators: ['exists', 'not_exists'] },
  { value: 'phone', label: 'Telefone', operators: ['exists', 'not_exists'] },
  { value: 'source', label: 'Fonte do contato', operators: ['equals', 'not_equals'] },
  { value: 'status', label: 'Status do contato', operators: ['equals', 'not_equals'] },
  { value: 'first_name', label: 'Nome', operators: ['exists', 'not_exists', 'contains', 'equals'] },
];

const OPERATOR_LABELS: Record<string, string> = {
  has: 'Possui',
  not_has: 'Não possui',
  gte: 'Maior ou igual a',
  lte: 'Menor ou igual a',
  eq: 'Igual a',
  exists: 'Existe',
  not_exists: 'Não existe',
  contains: 'Contém',
  equals: 'É igual a',
  not_equals: 'Não é igual a',
};

const SOURCE_OPTIONS = [
  'website', 'landing_page', 'formulario', 'whatsapp', 'instagram',
  'indicacao', 'evento', 'ads', 'importacao', 'outro',
];

const STATUS_OPTIONS = ['lead', 'qualified', 'customer', 'churned', 'inactive'];

export function ConditionalNodeConfig({ config, onChange }: ConditionalNodeConfigProps) {
  const { data: tags = [] } = useTags();
  const conditions: Condition[] = (config.conditions as Condition[]) || [];
  const logicOperator = String(config.logic_operator || 'and');
  const needsValueInput = (operator: string) => !['exists', 'not_exists'].includes(operator);

  const getFieldConfig = (field: string) => FIELD_OPTIONS.find(f => f.value === field);

  const addCondition = () => {
    const newCondition: Condition = {
      id: crypto.randomUUID(),
      field: 'tag',
      operator: 'has',
      value: '',
    };
    onChange({ ...config, conditions: [...conditions, newCondition] });
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    const updated = conditions.map(c => {
      if (c.id !== id) return c;
      const merged = { ...c, ...updates };
      // Reset operator/value when field changes
      if (updates.field) {
        const fieldCfg = getFieldConfig(updates.field);
        merged.operator = fieldCfg?.operators[0] || 'exists';
        merged.value = '';
      }
      return merged;
    });
    onChange({ ...config, conditions: updated });
  };

  const removeCondition = (id: string) => {
    onChange({ ...config, conditions: conditions.filter(c => c.id !== id) });
  };

  // Backward compat: migrate old single-field config to conditions array
  if (conditions.length === 0 && config.field) {
    const migrated: Condition = {
      id: crypto.randomUUID(),
      field: String(config.field),
      operator: config.field === 'tag' ? 'has' : config.field === 'score' ? 'gte' : 'exists',
      value: String(config.tag_name || config.min_score || ''),
    };
    onChange({ ...config, conditions: [migrated], field: undefined, tag_name: undefined, min_score: undefined });
    return null;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Condicional</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Configure uma ou mais condições. Se <strong>todas</strong> (E) ou <strong>alguma</strong> (OU) for verdadeira, o lead segue pelo caminho "Sim". Caso contrário, segue pelo "Não".
        </p>
      </div>

      {/* Logic operator */}
      {conditions.length > 1 && (
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Operador lógico:</Label>
          <div className="flex gap-2">
            <Badge
              variant={logicOperator === 'and' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => onChange({ ...config, logic_operator: 'and' })}
            >
              E (todas)
            </Badge>
            <Badge
              variant={logicOperator === 'or' ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1"
              onClick={() => onChange({ ...config, logic_operator: 'or' })}
            >
              OU (alguma)
            </Badge>
          </div>
        </div>
      )}

      {/* Conditions list */}
      <div className="space-y-3">
        {conditions.map((condition, idx) => {
          const fieldCfg = getFieldConfig(condition.field);
          return (
            <div key={condition.id} className="rounded-lg border p-4 space-y-3 relative group">
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              {idx > 0 && (
                <div className="flex items-center justify-center -mt-6 -mb-1">
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {logicOperator === 'and' ? 'E' : 'OU'}
                  </Badge>
                </div>
              )}

              {/* Field selector */}
              <div>
                <Label className="text-xs">Campo</Label>
                <Select
                  value={condition.field}
                  onValueChange={v => updateCondition(condition.id, { field: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator selector */}
              <div>
                <Label className="text-xs">Condição</Label>
                <Select
                  value={condition.operator}
                  onValueChange={v => updateCondition(condition.id, { operator: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(fieldCfg?.operators || ['exists']).map(op => (
                      <SelectItem key={op} value={op}>{OPERATOR_LABELS[op] || op}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value input */}
              {needsValueInput(condition.operator) && (
                <div>
                  <Label className="text-xs">Valor</Label>
                  {condition.field === 'tag' ? (
                    <Select
                      value={condition.value}
                      onValueChange={v => updateCondition(condition.id, { value: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma tag" />
                      </SelectTrigger>
                      <SelectContent>
                        {tags.map(t => (
                          <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                        ))}
                        {tags.length === 0 && (
                          <SelectItem value="_none" disabled>Nenhuma tag disponível</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : condition.field === 'source' ? (
                    <Select
                      value={condition.value}
                      onValueChange={v => updateCondition(condition.id, { value: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : condition.field === 'status' ? (
                    <Select
                      value={condition.value}
                      onValueChange={v => updateCondition(condition.id, { value: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : condition.field === 'score' ? (
                    <Input
                      type="number"
                      placeholder="Ex: 50"
                      min={0}
                      max={100}
                      value={condition.value}
                      onChange={e => updateCondition(condition.id, { value: e.target.value })}
                    />
                  ) : (
                    <Input
                      placeholder="Digite o valor..."
                      value={condition.value}
                      onChange={e => updateCondition(condition.id, { value: e.target.value })}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add condition button */}
      <Button variant="outline" className="w-full" onClick={addCondition}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar condição
      </Button>

      {/* Preview */}
      {conditions.length > 0 && (
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Resumo</span>
          </div>
          <p className="text-xs text-muted-foreground">
            O lead segue pelo caminho <strong className="text-green-600">Sim</strong> se{' '}
            {logicOperator === 'and' ? 'todas' : 'alguma'} das condições abaixo forem verdadeiras:
          </p>
          <ul className="mt-2 space-y-1">
            {conditions.map((c, i) => {
              const fieldLabel = FIELD_OPTIONS.find(f => f.value === c.field)?.label || c.field;
              const opLabel = OPERATOR_LABELS[c.operator] || c.operator;
              return (
                <li key={c.id} className="text-xs text-muted-foreground flex items-center gap-1">
                  {i > 0 && <Badge variant="outline" className="text-[9px] px-1 py-0 mr-1">{logicOperator === 'and' ? 'E' : 'OU'}</Badge>}
                  <span className="font-medium">{fieldLabel}</span>{' '}
                  <span>{opLabel.toLowerCase()}</span>{' '}
                  {c.value && <span className="font-medium">"{c.value}"</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {conditions.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Adicione pelo menos uma condição para configurar o nó condicional.
        </div>
      )}
    </div>
  );
}
