import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("TARGET_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("TARGET_SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket(name: string, isPublic: boolean) {
  console.log(`Checking bucket: ${name}`);
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error(`Error listing buckets:`, listError);
    return;
  }

  if (buckets.find(b => b.name === name)) {
    console.log(`Bucket ${name} already exists.`);
  } else {
    console.log(`Creating bucket ${name}...`);
    const { data, error } = await supabase.storage.createBucket(name, {
      public: isPublic,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) {
      console.error(`Error creating bucket ${name}:`, error);
    } else {
      console.log(`Bucket ${name} created successfully.`);
    }
  }
}

await createBucket("inbox-attachments", true);
await createBucket("voip-audio", false);
await createBucket("avatars", true);
await createBucket("contacts", false);
await createBucket("organization-assets", true);
await createBucket("automation-assets", true);
await createBucket("content", true);
await createBucket("campaigns", true);
