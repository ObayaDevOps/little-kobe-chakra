export default {
    name: 'product',
    title: 'Product',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'Product Name',
        type: 'string',
        validation: Rule => Rule.required()
      },
      {
        name: 'description',
        title: 'Product Description',
        type: 'text',
        validation: Rule => Rule.required()
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
        title: 'Category',
        type: 'reference',
        to: [{ type: 'category' }],
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