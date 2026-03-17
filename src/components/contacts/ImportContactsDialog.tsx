import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2, X, Plus, Tag } from 'lucide-react';
import { parseCSV, CONTACT_FIELDS, autoMapHeaders, useImportContacts } from '@/hooks/useImportContacts';
import { useTags } from '@/hooks/useTags';

interface ImportContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'mapping' | 'tags' | 'preview' | 'queued';

export function ImportContactsDialog({ open, onOpenChange }: ImportContactsDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [importTags, setImportTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [queuedInfo, setQueuedInfo] = useState<{ totalRows: number } | null>(null);

  const importContacts = useImportContacts();
  const { data: existingTags } = useTags();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);
      setHeaders(h);
      setRows(r);
      setFieldMapping(autoMapHeaders(h));
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !importTags.includes(tag)) {
      setImportTags(prev => [...prev, tag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setImportTags(prev => prev.filter(t => t !== tag));
  };

  const handleImport = async () => {
    const result = await importContacts.mutateAsync({
      rows, fieldMapping, fileName, importTags,
    });
    setQueuedInfo({ totalRows: result.totalRows });
    setStep('queued');
  };

  const handleClose = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setFieldMapping({});
    setImportTags([]);
    setNewTag('');
    setQueuedInfo(null);
    onOpenChange(false);
  };

  const isFirstNameMapped = Object.values(fieldMapping).includes('first_name');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Contatos</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo CSV com seus contatos'}
            {step === 'mapping' && 'Mapeie as colunas do arquivo para os campos de contato'}
            {step === 'tags' && 'Defina tags que serão aplicadas a todos os contatos importados'}
            {step === 'preview' && 'Confira os dados antes de importar'}
            {step === 'queued' && 'Importação em segundo plano'}
          </DialogDescription>
        </DialogHeader>

        {/* UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="rounded-full bg-muted p-6">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Formatos aceitos: CSV (separado por vírgula ou ponto-e-vírgula)
              </p>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  <Upload className="h-4 w-4" />
                  Selecionar Arquivo
                </div>
                <Input id="csv-upload" type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
              </Label>
            </div>
          </div>
        )}

        {/* MAPPING */}
        {step === 'mapping' && (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName} - {rows.length} linhas encontradas
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coluna do Arquivo</TableHead>
                    <TableHead>Campo no Sistema</TableHead>
                    <TableHead>Exemplo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {headers.map((header) => (
                    <TableRow key={header}>
                      <TableCell className="font-medium">{header}</TableCell>
                      <TableCell>
                        <Select
                          value={fieldMapping[header] || 'ignore'}
                          onValueChange={(value) => setFieldMapping(prev => ({ ...prev, [header]: value }))}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">— Ignorar —</SelectItem>
                            {CONTACT_FIELDS.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {rows[0]?.[header] || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!isFirstNameMapped && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  O campo "Nome" é obrigatório. Mapeie uma coluna para ele.
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* TAGS */}
        {step === 'tags' && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Defina abaixo as tags que os leads receberão ao serem importados no sistema.
            </p>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {importTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1.5">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={(v) => {
                if (v && !importTags.includes(v)) setImportTags(prev => [...prev, v]);
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar tag existente..." />
                </SelectTrigger>
                <SelectContent>
                  {(existingTags ?? []).map((t: any) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Input
                  placeholder="Nova tag..."
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="w-40"
                />
                <Button variant="outline" size="icon" onClick={handleAddTag} disabled={!newTag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            {importTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tags:</span>
                {importTags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            )}
            <ScrollArea className="max-h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {CONTACT_FIELDS.filter(f => Object.values(fieldMapping).includes(f.key)).map(field => (
                      <TableHead key={field.key}>{field.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 10).map((row, index) => (
                    <TableRow key={index}>
                      {CONTACT_FIELDS.filter(f => Object.values(fieldMapping).includes(f.key)).map(field => {
                        const csvField = Object.entries(fieldMapping).find(([, v]) => v === field.key)?.[0];
                        return <TableCell key={field.key}>{csvField ? row[csvField] || '-' : '-'}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {rows.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... e mais {rows.length - 10} linhas
                </p>
              )}
            </ScrollArea>
          </div>
        )}

        {/* QUEUED - Background processing */}
        {step === 'queued' && queuedInfo && (
          <div className="py-8 space-y-6 text-center">
            <div className="rounded-full bg-primary/10 p-4 mx-auto w-fit">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Leads inseridos na fila de processamento!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Os leads foram inseridos na fila de processamento e serão importados em segundo plano.
              </p>
              <p className="text-sm font-medium text-primary mt-2">
                Você pode fechar esta janela e navegar para outra página. A importação continuará executando normalmente.
              </p>
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-sm">
                <span>Inserido na fila</span>
                <span className="font-semibold">100.00%</span>
              </div>
              <Progress value={100} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {queuedInfo.totalRows.toLocaleString()} / {queuedInfo.totalRows.toLocaleString()} leads inseridos na fila
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
              <Button onClick={() => setStep('tags')} disabled={!isFirstNameMapped}>Próximo</Button>
            </>
          )}
          {step === 'tags' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={() => setStep('preview')}>Próximo</Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('tags')}>Voltar</Button>
              <Button onClick={handleImport} disabled={importContacts.isPending}>
                {importContacts.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar {rows.length.toLocaleString()} leads
              </Button>
            </>
          )}
          {step === 'queued' && (
            <Button onClick={handleClose}>OK</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
