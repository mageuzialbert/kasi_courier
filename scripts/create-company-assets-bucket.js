const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket() {
  const { data, error } = await supabaseAdmin.storage.createBucket('company-assets', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'],
    fileSizeLimit: 5242880, // 5MB
  });
  
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists, updating it...');
      const { data: updateData, error: updateError } = await supabaseAdmin.storage.updateBucket('company-assets', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'],
        fileSizeLimit: 5242880,
      });
      if (updateError) console.error('Error updating:', updateError);
      else console.log('Bucket updated:', updateData);
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created:', data);
  }
}

createBucket();
