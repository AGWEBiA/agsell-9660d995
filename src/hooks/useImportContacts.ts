import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ImportJob {
  id: string;
  user_id: string;
  organization_id: string | null;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  status: string;
  errors: Array<{ row: number; message: string }>;
  field_mapping: Record<string, string>;
  created_at: string;
  completed_at: string | null;
}

export interface ParsedContact {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  position?: string;
  source?: string;
  status?: string;
  notes?: string;
  [key: string]: string | undefined;
}

export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  // Parse headers
  const headers = lines[0].split(/[,;]/).map(h => h.trim().replace(/^["']|["']$/g, ''));

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

export const CONTACT_FIELDS = [
  { key: 'first_name', label: 'Nome', required: true },
  { key: 'last_name', label: 'Sobrenome', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'whatsapp', label: 'WhatsApp', required: false },
  { key: 'position', label: 'Cargo', required: false },
  { key: 'source', label: 'Origem', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'notes', label: 'Observações', required: false },
];

export function useImportContacts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      rows,
      fieldMapping,
      fileName,
    }: {
      rows: Record<string, string>[];
      fieldMapping: Record<string, string>;
      fileName: string;
    }) => {
      // Create import job
      const { data: job, error: jobError } = await supabase
        .from('import_jobs')
        .insert({
          user_id: user!.id,
          file_name: fileName,
          total_rows: rows.length,
          field_mapping: fieldMapping,
          status: 'processing',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      const errors: Array<{ row: number; message: string }> = [];
      let successCount = 0;

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        // Build contact object with proper typing
        let firstName = '';
        let lastName: string | undefined;
        let email: string | undefined;
        let phone: string | undefined;
        let whatsapp: string | undefined;
        let position: string | undefined;
        let source: string | undefined;
        let status: string | undefined;
        let notes: string | undefined;

        // Map fields
        for (const [csvField, contactField] of Object.entries(fieldMapping)) {
          if (contactField && contactField !== 'ignore' && row[csvField]) {
            const value = row[csvField];
            switch (contactField) {
              case 'first_name': firstName = value; break;
              case 'last_name': lastName = value; break;
              case 'email': email = value; break;
              case 'phone': phone = value; break;
              case 'whatsapp': whatsapp = value; break;
              case 'position': position = value; break;
              case 'source': source = value; break;
              case 'status': status = value; break;
              case 'notes': notes = value; break;
            }
          }
        }

        // Validate required fields
        if (!firstName) {
          errors.push({ row: i + 2, message: 'Nome é obrigatório' });
          continue;
        }

        // Insert contact
        const { error: insertError } = await supabase.from('contacts').insert([{
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          whatsapp,
          position,
          source,
          status,
          notes,
          user_id: user!.id,
        }]);

        if (insertError) {
          errors.push({ row: i + 2, message: insertError.message });
        } else {
          successCount++;
        }
      }

      // Update import job with results
      await supabase
        .from('import_jobs')
        .update({
          processed_rows: rows.length,
          success_count: successCount,
          error_count: errors.length,
          errors,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return { successCount, errorCount: errors.length, errors };
    },
    onSuccess: ({ successCount, errorCount }) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (errorCount === 0) {
        toast.success(`${successCount} contatos importados com sucesso!`);
      } else {
        toast.warning(`${successCount} importados, ${errorCount} erros`);
      }
    },
    onError: (error) => {
      toast.error('Erro na importação: ' + error.message);
    },
  });
}
