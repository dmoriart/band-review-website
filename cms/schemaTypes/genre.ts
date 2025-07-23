import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'genre',
  title: 'Genre',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Genre Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      }
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text'
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'color',
      options: {
        disableAlpha: true
      }
    }),
    defineField({
      name: 'parentGenre',
      title: 'Parent Genre',
      type: 'reference',
      to: {type: 'genre'},
      description: 'e.g., Rock could be parent of Indie Rock'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'description'
    }
  }
})
