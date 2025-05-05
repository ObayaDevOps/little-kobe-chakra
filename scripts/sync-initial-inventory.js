// scripts/sync-initial-inventory.js
require('dotenv').config({ path: '.env.local' }); // Load environment variables
const { createClient: createSanityClient } = require('@sanity/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');


// Ensure these are set in your .env.local
const sanityClient = createSanityClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-04-03', // use a recent date
  token: process.env.SANITY_API_READ_TOKEN, // Needs read token
  useCdn: false, // Use false for guaranteed fresh data
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend operations

if (!supabaseUrl || !supabaseServiceKey || !process.env.SANITY_API_READ_TOKEN) {
  console.error('Missing environment variables for Supabase URL/Service Key or Sanity Read Token');
  process.exit(1);
}

const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

async function syncInventory() {
  console.log('Fetching products from Sanity...');
  // Fetch only products that have a quantity defined
  const products = await sanityClient.fetch(`*[_type == "product" && defined(quantity)]{_id, quantity}`);
  console.log(`Found ${products.length} products with quantity in Sanity.`);

  if (products.length === 0) {
    console.log('No products found or none have quantity defined. Exiting.');
    return;
  }

  const inventoryData = products.map(product => ({
    product_id: product._id, // Sanity document ID
    quantity: product.quantity ?? 0, // Default to 0 if null/undefined
  }));

  console.log('Upserting inventory data into Supabase...');
  // Use upsert to insert new or update existing entries
  const { data, error } = await supabase
    .from('inventory')
    .upsert(inventoryData, { onConflict: 'product_id' }); // Important: specify conflict column

  if (error) {
    console.error('Error upserting data to Supabase:', error);
  } else {
    console.log(`Successfully upserted ${inventoryData.length} inventory records.`);
    // Supabase v2 might return the data slightly differently on upsert success
    // console.log('Upsert result:', data);
  }
}

syncInventory().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});