// Import document schemas
import product from './schemas/documents/product'
import category from './schemas/documents/category'

// Import object schemas
import productVariant from './schemas/objects/productVariants'

export const schema = {
  types: [product, category, productVariant],
}
