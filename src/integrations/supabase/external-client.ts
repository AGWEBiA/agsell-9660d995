// =====================================================================
// CLIENTE SUPABASE EXTERNO (ggkjishigcahzjdlwfat)
// =====================================================================
// Este arquivo SUBSTITUI o client.ts auto-gerado do Lovable Cloud.
// O Lovable não permite desconectar o Cloud, então fazemos override
// via alias no vite.config.ts apontando "@/integrations/supabase/client"
// para este arquivo.
//
// Banco: AGWEBiA's Org (Supabase externo do cliente)
// URL: https://ggkjishigcahzjdlwfat.supabase.co
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://ggkjishigcahzjdlwfat.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna2ppc2hpZ2NhaHpqZGx3ZmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDU4MjEsImV4cCI6MjA5NDEyMTgyMX0.r6IiwRb2PgqnrOzzsUoX5sKoYhNZVP6QJPt8GM3idAk';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
