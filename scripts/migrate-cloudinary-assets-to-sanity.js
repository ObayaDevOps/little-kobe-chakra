require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@sanity/client');

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const writeToken = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !writeToken) {
  console.error('Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-03-20',
  token: writeToken,
  useCdn: false,
});

const baseDir = '/media/obi/Seagate/Cloudinary_Bulk_Download_March_4_2026';

const mappings = [
  {
    key: 'ogImage',
    cloudinaryUrl: 'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1737052416/neko-logo_f5fiok.png',
    filename: 'neko-logo_f5fiok.png',
    contentType: 'image/png',
  },
  {
    key: 'heroBackgroundImage',
    cloudinaryUrl: 'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1738747948/pexels-apasaric-3423860_ddbmcf.jpg',
    filename: 'pexels-apasaric-3423860_ddbmcf.jpg',
    contentType: 'image/jpeg',
  },
  {
    key: 'footerLogo',
    cloudinaryUrl: 'https://res.cloudinary.com/medoptics-image-cloud/image/upload/v1745851600/image-black-2_m163vh.svg',
    filename: 'image-black-2_m163vh.svg',
    contentType: 'image/svg+xml',
  },
];

async function uploadOne(mapping) {
  const localPath = path.join(baseDir, mapping.filename);

  if (!fs.existsSync(localPath)) {
    throw new Error(`Local file not found: ${localPath}`);
  }

  const stream = fs.createReadStream(localPath);
  const uploaded = await client.assets.upload('image', stream, {
    filename: mapping.filename,
    contentType: mapping.contentType,
    label: mapping.key,
    title: mapping.filename,
  });

  return {
    ...mapping,
    localPath,
    sanityAssetId: uploaded._id,
    sanityUrl: uploaded.url,
  };
}

async function createOrPatchSiteSettings(uploadedMappings) {
  const siteSettingsId = 'siteSettings';

  const patch = {
    _type: 'siteSettings',
    title: 'Global Site Settings',
  };

  for (const mapping of uploadedMappings) {
    patch[mapping.key] = {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: mapping.sanityAssetId,
      },
    };
  }

  await client
    .transaction()
    .createIfNotExists({
      _id: siteSettingsId,
      _type: 'siteSettings',
      title: 'Global Site Settings',
    })
    .patch(siteSettingsId, (p) => p.set(patch))
    .commit();

  return siteSettingsId;
}

async function main() {
  console.log('Uploading mapped Cloudinary files to Sanity...');

  const uploadedMappings = [];
  for (const mapping of mappings) {
    const uploaded = await uploadOne(mapping);
    uploadedMappings.push(uploaded);
    console.log(`Uploaded ${mapping.filename} -> ${uploaded.sanityAssetId}`);
  }

  const siteSettingsId = await createOrPatchSiteSettings(uploadedMappings);
  console.log(`Patched site settings document: ${siteSettingsId}`);

  const output = {
    generatedAt: new Date().toISOString(),
    projectId,
    dataset,
    siteSettingsId,
    mappings: uploadedMappings,
  };

  const outputPath = path.join(process.cwd(), 'docs', 'cloudinary-to-sanity-map.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`Wrote mapping file: ${outputPath}`);
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
