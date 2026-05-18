import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://ggkjishigcahzjdlwfat.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna2ppc2hpZ2NhaHpqZGx3ZmF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0NTgyMSwiZXhwIjoyMDk0MTIxODIxfQ.piFRu_ObqHXHyzyuB8HxMoVQ_F92H1LhglbqcAPQ1Ew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigrations() {
  const { data, error } = await supabase
    .from('_migrations')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error checking _migrations:', error.message);
    // Try supabase_migrations schema
    const { data: data2, error: error2 } = await supabase.rpc('get_migrations'); // Custom RPC?
    console.log('RPC check error:', error2?.message);
  } else {
    console.log('Migrations table exists, found:', data.length, 'records');
  }
}

checkMigrations();
