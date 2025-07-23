import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'band',
  title: 'Band',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Band Name',
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
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'text',
      rows: 4
    }),
    defineField({
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'bannerImage',
      title: 'Banner Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'gallery',
      title: 'Photo Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption'
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text'
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      of: [{type: 'reference', to: {type: 'genre'}}]
    }),
    defineField({
      name: 'location',
      title: 'Location (Map)',
      type: 'geopoint'
    }),
    defineField({
      name: 'locationText',
      title: 'Location (Text)',
      type: 'string',
      description: 'e.g., Dublin, Ireland'
    }),
    defineField({
      name: 'formedYear',
      title: 'Year Formed',
      type: 'number'
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        {name: 'website', type: 'url', title: 'Website'},
        {name: 'spotify', type: 'url', title: 'Spotify'},
        {name: 'youtube', type: 'url', title: 'YouTube'},
        {name: 'instagram', type: 'url', title: 'Instagram'},
        {name: 'facebook', type: 'url', title: 'Facebook'},
        {name: 'twitter', type: 'url', title: 'Twitter'},
        {name: 'bandcamp', type: 'url', title: 'Bandcamp'},
        {name: 'soundcloud', type: 'url', title: 'SoundCloud'}
      ]
    }),
    defineField({
      name: 'verified',
      title: 'Verified',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'featured',
      title: 'Featured Band',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'members',
      title: 'Band Members',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'name', type: 'string', title: 'Member Name'},
            {name: 'instrument', type: 'string', title: 'Instrument/Role'},
            {name: 'photo', type: 'image', title: 'Photo', options: {hotspot: true}}
          ]
        }
      ]
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'profileImage',
      subtitle: 'locationText'
    }
  }
})
