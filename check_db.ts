import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const supabaseUrl = 'https://ggkjishigcahzjdlwfat.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna2ppc2hpZ2NhaHpqZGx3ZmF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0NTgyMSwiZXhwIjoyMDk0MTIxODIxfQ.piFRu_ObqHXHyzyuB8HxMoVQ_F92H1LhglbqcAPQ1Ew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
  const { data, error } = await supabase
    .from('whatsapp_connection_history')
    .select('*')
    .limit(1);

  if (error) {
    console.log('whatsapp_connection_history table does NOT exist or error:', error.message);
  } else {
    console.log('whatsapp_connection_history table EXISTS.');
  }
}

checkState();
