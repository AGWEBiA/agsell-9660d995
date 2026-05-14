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