export default {
    name: 'product',
    title: 'Product',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'Name',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text',
        validation: Rule => Rule.required()
      },
      {
        name: 'price',
        title: 'Price (UGX)',
        type: 'number',
        validation: Rule => Rule.required().min(0)
      },
      {
        name: 'quantity',
        title: 'Quantity in Stock',
        type: 'number',
        description: 'Quantity available. This is the number managed by the shopkeeper. Real-time stock is handled separately in database but synced from this value.',
        initialValue: 0,
        validation: Rule => Rule.required().integer().min(0)
      },
      {
        name: 'isPopular',
        title: 'Popular Item? (Will Display at top of Landing Page)',
        type: 'boolean',
        description: 'Mark this product as a popular item',
        initialValue: false
      },
      {
        name: 'images',
        title: 'Images',
        type: 'array',
        of: [{ type: 'image' }],
        validation: Rule => Rule.required()
      },
      
      {
        name: 'categories',
        title: 'Categories',
        type: 'array',
        of: [{ type: 'reference', to: [{ type: 'category' }] }],
        validation: Rule => Rule.required()
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      },

    ]
  }