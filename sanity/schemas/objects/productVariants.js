export default {
    name: 'productVariant',
    title: 'Product Variant',
    type: 'object',
    fields: [
      {
        name: 'sku',
        title: 'SKU',
        type: 'string',
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'price',
        title: 'Price',
        type: 'number',
        validation: (Rule) => Rule.required().min(0),
      },
      {
        name: 'compareAtPrice',
        title: 'Compare at Price',
        type: 'number',
      },
      {
        name: 'inventory',
        title: 'Inventory',
        type: 'number',
        validation: (Rule) => Rule.required().min(0),
      },
      {
        name: 'images',
        title: 'Images',
        type: 'array',
        of: [{ type: 'image' }],
      },
      {
        name: 'options',
        title: 'Options',
        type: 'array',
        of: [
          {
            type: 'object',
            fields: [
              { name: 'name', type: 'string', title: 'Name' },
              { name: 'value', type: 'string', title: 'Value' },
            ],
          },
        ],
      },
    ],
  } 