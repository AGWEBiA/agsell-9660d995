import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';

interface TagsImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** CSV format: contact_id,contact_email,tag_name,tag_color */
function rowsToCsv(rows: Array<Record<string, string>>): string {
  if (rows.length === 0) return 'contact_id,contact_email,tag_name,tag_color\n';
  const header = Object.keys(rows[0]);
  const escape = (v: string) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    header.join(','),
    ...rows.map(r => header.map(h => escape(r[h])).join(',')),
  ].join('\n');
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').split('\n').filter(l => l.length > 0);
  if (lines.length === 0) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else cur += c;
      } else {
        if (c === ',') { out.push(cur); cur = ''; }
        else if (c === '"') inQuotes = true;
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  };
  const headers = splitLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(l => {
    const cells = splitLine(l);
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = (cells[i] ?? '').trim(); });
    return r;
  });
}

export function TagsImportExportDialog({ open, onOpenChange }: TagsImportExportDialogProps) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);

  const handleExport = async () => {
    if (!currentOrganization?.id) return;
    setBusy(true);
    try {
      // Fetch contact_tags joined with contact email and tag info
      const { data, error } = await supabase
        .from('contact_tags')
        .select('contact_id, tags(name, color), contacts!inner(email, organization_id)')
        .eq('contacts.organization_id', currentOrganization.id);
      if (error) throw error;

      const rows = (data || []).map((r: any) => ({
        contact_id: r.contact_id,
        contact_email: r.contacts?.email || '',
        tag_name: r.tags?.name || '',
        tag_color: r.tags?.color || '',
      }));
      const csv = rowsToCsv(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tags-por-contato-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length} associações exportadas.`);
    } catch (e: any) {
      toast.error('Erro ao exportar: ' + (e.message || 'desconhecido'));
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (f: File) => {
    setFile(f);
    const text = await f.text();
    const rows = parseCsv(text);
    setPreview(rows.slice(0, 10));
  };

  const handleImport = async () => {
    if (!file || !currentOrganization?.id || !user?.id) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.warning('CSV vazio.');
        return;
      }

      // Group by tag_name to avoid creating duplicates
      const tagNames = Array.from(new Set(rows.map(r => (r.tag_name || '').trim()).filter(Boolean)));
      const { data: existingTags } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('organization_id', currentOrganization.id);
      const tagMap = new Map((existingTags || []).map((t: any) => [t.name.toLowerCase(), t]));

      // Create missing tags
      const toCreate = tagNames
        .filter(n => !tagMap.has(n.toLowerCase()))
        .map(name => ({
          name,
          color: rows.find(r => r.tag_name === name)?.tag_color || '#6366f1',
          user_id: user.id,
          organization_id: currentOrganization.id,
        }));

      if (toCreate.length > 0) {
        const { data: created, error: createErr } = await supabase
          .from('tags')
          .insert(toCreate)
          .select('id, name, color');
        if (createErr) throw createErr;
        for (const t of created || []) tagMap.set(t.name.toLowerCase(), t);
      }

      // Resolve contact_ids: prefer contact_id; fallback to contact_email
      const emailsToResolve = rows
        .filter(r => !r.contact_id && r.contact_email)
        .map(r => r.contact_email.toLowerCase());

      let emailMap = new Map<string, string>();
      if (emailsToResolve.length > 0) {
        const { data: byEmail } = await supabase
          .from('contacts')
          .select('id, email')
          .eq('organization_id', currentOrganization.id)
          .in('email', emailsToResolve);
        emailMap = new Map((byEmail || []).map((c: any) => [c.email.toLowerCase(), c.id]));
      }

      // Build contact_tags rows
      const inserts: Array<{ contact_id: string; tag_id: string }> = [];
      let unresolved = 0;
      for (const r of rows) {
        const tag = tagMap.get((r.tag_name || '').toLowerCase());
        if (!tag) { unresolved++; continue; }
        let cid = r.contact_id?.trim();
        if (!cid && r.contact_email) cid = emailMap.get(r.contact_email.toLowerCase());
        if (!cid) { unresolved++; continue; }
        inserts.push({ contact_id: cid, tag_id: tag.id });
      }

      // Dedupe locally
      const seen = new Set<string>();
      const dedup = inserts.filter(i => {
        const k = `${i.contact_id}:${i.tag_id}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      // Use upsert with onConflict to skip existing
      let inserted = 0;
      for (let i = 0; i < dedup.length; i += 500) {
        const chunk = dedup.slice(i, i + 500);
        const { error } = await supabase
          .from('contact_tags')
          .upsert(chunk, { onConflict: 'contact_id,tag_id', ignoreDuplicates: true });
        if (error) throw error;
        inserted += chunk.length;
      }

      queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success(
        `Import concluído: ${inserted} linhas processadas` +
        (unresolved > 0 ? `, ${unresolved} ignoradas (contato/tag não encontrado).` : '.')
      );
      setFile(null);
      setPreview([]);
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Erro ao importar: ' + (e.message || 'desconhecido'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Tags por contato — CSV
          </DialogTitle>
          <DialogDescription>
            Exporte ou importe associações de tags em massa. Linhas duplicadas são ignoradas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Gera um arquivo CSV com colunas: <code className="text-xs">contact_id, contact_email, tag_name, tag_color</code>.
            </p>
            <Button onClick={handleExport} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar CSV
            </Button>
          </TabsContent>

          <TabsContent value="import" className="space-y-3 pt-3">
            <div className="space-y-2">
              <Label>Arquivo CSV</Label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <p className="text-xs text-muted-foreground">
                Formato esperado: <code>contact_id</code> ou <code>contact_email</code> + <code>tag_name</code> (cor opcional).
                Tags inexistentes serão criadas. Pares já existentes são ignorados.
              </p>
            </div>
            {preview.length > 0 && (
              <div className="border rounded-md p-2 max-h-40 overflow-auto bg-muted/30">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Preview ({preview.length} primeiras)</p>
                <table className="w-full text-xs">
                  <thead><tr>{Object.keys(preview[0]).map(k => <th key={k} className="text-left pr-2">{k}</th>)}</tr></thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>{Object.keys(preview[0]).map(k => <td key={k} className="pr-2 truncate max-w-[120px]">{r[k]}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button onClick={handleImport} disabled={busy || !file} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar e atualizar contact_tags
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
