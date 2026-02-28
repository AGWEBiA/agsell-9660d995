import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export default function FormView() {
  const { formId } = useParams<{ formId: string }>();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: form, isLoading, error } = useQuery({
    queryKey: ['public-form', formId],
    queryFn: async () => {
      if (!formId) throw new Error('Form ID missing');
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!formId,
  });

  const fields: FormField[] = Array.isArray(form?.fields) ? (form.fields as unknown as FormField[]) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formData[field.name]?.trim()) {
        toast.error(`O campo "${field.label}" é obrigatório.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error, data: submission } = await supabase
        .from('form_submissions')
        .insert({ form_id: formId, data: formData })
        .select()
        .single();
      if (error) throw error;

      // Fire form_submitted automations
      try {
        const orgId = form?.organization_id;
        if (orgId) {
          const { data: automations } = await supabase
            .from('automations')
            .select('id')
            .eq('organization_id', orgId)
            .eq('trigger_type', 'form_submitted')
            .eq('is_active', true);
          if (automations?.length) {
            await Promise.allSettled(
              automations.map((a) =>
                supabase.functions.invoke('process-automation', {
                  body: { automation_id: a.id, contact_id: submission?.contact_id ?? null, trigger_event: 'form_submitted' },
                })
              )
            );
          }
        }
      } catch {}

      setSubmitted(true);
    } catch (err: any) {
      toast.error('Erro ao enviar: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Formulário não encontrado ou desativado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Enviado com sucesso!</h2>
            <p className="text-muted-foreground">Obrigado por preencher o formulário.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const onChange = (val: string) => setFormData(prev => ({ ...prev, [field.name]: val }));

    switch (field.type) {
      case 'textarea':
        return <Textarea placeholder={field.placeholder || ''} value={value} onChange={(e) => onChange(e.target.value)} />;
      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={value === 'true'} onCheckedChange={(c) => onChange(c ? 'true' : 'false')} />
            <span className="text-sm text-muted-foreground">{field.placeholder || field.label}</span>
          </div>
        );
      default:
        return <Input type={field.type || 'text'} placeholder={field.placeholder || ''} value={value} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Este formulário não possui campos configurados.</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting || fields.length === 0}>
              {submitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
