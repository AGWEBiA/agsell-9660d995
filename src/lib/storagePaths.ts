const FALLBACK_EXTENSION = 'bin';

const getSafeFileName = (fileName: string) => {
  const withoutExtension = fileName.replace(/\.[^.]+$/, '');
  return withoutExtension.replace(/[^a-zA-Z0-9._-]/g, '_') || 'arquivo';
};

export const getFileExtension = (fileName: string, fallback = FALLBACK_EXTENSION) => {
  return fileName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || fallback;
};

export const buildStoragePath = (scopeId: string, file: File, folder?: string) => {
  const ext = getFileExtension(file.name);
  const safeName = getSafeFileName(file.name);
  const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const parts = [scopeId, folder, `${Date.now()}-${uniqueId}-${safeName}.${ext}`].filter(Boolean);

  return parts.join('/');
};

const getFunctionErrorMessage = async (error: unknown) => {
  const context = (error as { context?: Response })?.context;
  if (context?.clone) {
    try {
      const payload = await context.clone().json();
      if (payload?.error) return String(payload.error);
      if (payload?.message) return String(payload.message);
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {
        // Keep the original SDK message below.
      }
    }
  }

  return error instanceof Error ? error.message : 'erro desconhecido';
};

export const uploadMediaFile = async (bucket: 'inbox-attachments' | 'voip-audio', path: string, file: File) => {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    throw new Error('Sessão expirada. Entre novamente para enviar arquivos.');
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const uploadOptions = {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  };

  const directUpload = await supabase.storage.from(bucket).upload(normalizedPath, file, uploadOptions);
  if (!directUpload.error) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
    return data.publicUrl as string;
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });

  const { data, error } = await supabase.functions.invoke('upload-media', {
    body: { bucket, path: normalizedPath, contentType: file.type || undefined, base64 },
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });

  if (error) throw new Error(await getFunctionErrorMessage(error));
  if (data?.error) throw new Error(String(data.error));
  if (!data?.publicUrl) throw new Error(data?.error || 'Upload não retornou URL pública.');
  return data.publicUrl as string;
};