import 'server-only'
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
}

if (!token) {
  throw new Error('Missing SANITY_API_WRITE_TOKEN')
}

const serverClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-03-20',
  useCdn: false,
  token,
})

export default serverClient
