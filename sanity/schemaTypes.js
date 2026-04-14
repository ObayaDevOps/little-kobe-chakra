// Import document schemas
import product from './schemas/documents/product'
import category from './schemas/documents/category'
import siteSettings from './schemas/documents/siteSettings'

// Import object schemas
import productVariant from './schemas/objects/productVariants'

export const schema = {
  types: [product, category, siteSettings, productVariant],
}
