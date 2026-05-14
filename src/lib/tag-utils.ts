/**
 * Normaliza um nome de tag em tempo real para o padrão do sistema:
 * - tudo minúsculo
 * - espaços viram hífen
 * - caracteres acentuados normalizados
 * - somente [a-z0-9-_] permitidos
 * - hífens duplicados colapsados
 */
export function normalizeTagInput(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/-{2,}/g, '-');
}

/** Versão final ao salvar: também remove hífens nas pontas. */
export function normalizeTagFinal(value: string): string {
  return normalizeTagInput(value).replace(/^-+|-+$/g, '');
}
