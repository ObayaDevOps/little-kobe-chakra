export default {
    name: 'category',
    title: 'Category',
    type: 'document',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        validation: (Rule) => Rule.required(),
      },
      {
        name: 'slug',
        title: 'Slug (will appear at the end of a url after slash e.g little-kobe.ug/soy-sauce',
        type: 'slug',
        validation: (Rule) => Rule.required(),
        options: {
          source: 'title',
          maxLength: 96,
        },
      },
      {
        name: 'description',
        title: 'Description',
        type: 'text',
      },
      {
        name: 'parent',
        title: 'Parent Category',
        type: 'reference',
        to: [{ type: 'category' }],
      },
      {
        name: 'order',
        title: 'Order',
        type: 'number',
        description: 'Number to determine the order of categories. Lower numbers appear first.',
        validation: (Rule) => Rule.integer().min(0),
      },
      {
        name: 'image',
        title: 'Image',
        type: 'image',
        validation: (Rule) => Rule.required(),
        options: {
          hotspot: true,
        },
      },
    ],
  } 