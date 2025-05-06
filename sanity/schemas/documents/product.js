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
        title: 'Slug [This is the end of the url e.g soy-sauce in  litle-kobe.com/soy-sauce], Just click generate :)',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96
        },
        validation: Rule => Rule.required()
      },

    ]
  }