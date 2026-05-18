import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://ggkjishigcahzjdlwfat.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna2ppc2hpZ2NhaHpqZGx3ZmF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0NTgyMSwiZXhwIjoyMDk0MTIxODIxfQ.piFRu_ObqHXHyzyuB8HxMoVQ_F92H1LhglbqcAPQ1Ew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
  const { data: tables, error: tableError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(1);

  if (tableError) {
    console.log('user_roles table does NOT exist or error:', tableError.message);
  } else {
    console.log('user_roles table EXISTS.');
  }

  // Check another table likely to be there if it was configured
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (profileError) {
    console.log('profiles table does NOT exist or error:', profileError.message);
  } else {
    console.log('profiles table EXISTS.');
  }
}

checkState();
