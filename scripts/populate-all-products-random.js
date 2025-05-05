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

async function populateAllProducts() {
  console.log('Fetching all products from Sanity...');
  // Fetch all products, including their _id, price, and quantity if available
  const products = await sanityClient.fetch(`*[_type == "product"]{_id, price, quantity}`);
  console.log(`Found ${products.length} products in Sanity.`);

  if (products.length === 0) {
    console.log('No products found in Sanity. Exiting.');
    return;
  }

  // Map Sanity products to the Supabase inventory table structure
  // Use provided defaults if values are missing in Sanity
  const inventoryData = products.map(product => ({
    product_id: product._id, // Sanity document ID maps to product_id
    price: product.price ?? 100000, // Default price if not set
    quantity: product.quantity ?? 10, // Default quantity if not set
    min_stock_level: 1, // Always default to 1
  }));

  console.log('Upserting inventory data into Supabase...');
  // Use upsert to insert new or update existing entries based on product_id
  const { data, error } = await supabase
    .from('inventory')
    .upsert(inventoryData, { onConflict: 'product_id' }); // Specify conflict column

  if (error) {
    console.error('Error upserting data to Supabase:', error);
  } else {
    console.log(`Successfully upserted ${inventoryData.length} inventory records.`);
    // Optional: Log the result data if needed for debugging
    // console.log('Upsert result:', data);
  }
}

populateAllProducts().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 