
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('sandbox_executions')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('Error or missing table:', error.message);
    if (error.code === 'PGRST204' || error.message.includes('not found')) {
      console.log('TABLE_MISSING');
    }
  } else {
    console.log('TABLE_EXISTS');
  }
}

checkTable();
