import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'venue',
  title: 'Venue',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Venue Name',
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
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
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
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {name: 'street', type: 'string', title: 'Street Address'},
        {name: 'city', type: 'string', title: 'City'},
        {name: 'county', type: 'string', title: 'County'},
        {name: 'eircode', type: 'string', title: 'Eircode'},
        {name: 'country', type: 'string', title: 'Country', initialValue: 'Ireland'}
      ]
    }),
    defineField({
      name: 'location',
      title: 'Location (Map)',
      type: 'geopoint'
    }),
    defineField({
      name: 'contact',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {name: 'phone', type: 'string', title: 'Phone'},
        {name: 'email', type: 'email', title: 'Email'},
        {name: 'website', type: 'url', title: 'Website'}
      ]
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity',
      type: 'number'
    }),
    defineField({
      name: 'venueType',
      title: 'Venue Type',
      type: 'string',
      options: {
        list: [
          {title: 'Pub', value: 'pub'},
          {title: 'Club', value: 'club'},
          {title: 'Theatre', value: 'theatre'},
          {title: 'Arena', value: 'arena'},
          {title: 'Festival Ground', value: 'festival_ground'},
          {title: 'Concert Hall', value: 'concert_hall'},
          {title: 'Other', value: 'other'}
        ]
      }
    }),
    defineField({
      name: 'primaryGenres',
      title: 'Primary Genres',
      type: 'array',
      of: [{type: 'reference', to: {type: 'genre'}}]
    }),
    defineField({
      name: 'facilities',
      title: 'Facilities',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Sound System', value: 'sound_system'},
          {title: 'Lighting', value: 'lighting'},
          {title: 'Parking', value: 'parking'},
          {title: 'Green Room', value: 'green_room'},
          {title: 'Drum Kit', value: 'drum_kit'},
          {title: 'Ramp Access', value: 'ramp_access'},
          {title: 'Bar', value: 'bar'},
          {title: 'Food Service', value: 'food_service'},
          {title: 'Merchandise Stand', value: 'merch_stand'},
          {title: 'Security', value: 'security'}
        ]
      }
    }),
    defineField({
      name: 'techSpecs',
      title: 'Technical Specifications',
      type: 'object',
      fields: [
        {
          name: 'soundSystem',
          title: 'Sound System Details',
          type: 'text'
        },
        {
          name: 'lightingRig',
          title: 'Lighting Rig',
          type: 'text'
        },
        {
          name: 'stageSize',
          title: 'Stage Size',
          type: 'string'
        },
        {
          name: 'backline',
          title: 'Available Backline',
          type: 'array',
          of: [{type: 'string'}]
        }
      ]
    }),
    defineField({
      name: 'verified',
      title: 'Verified',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'claimed',
      title: 'Claimed by Owner',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'featured',
      title: 'Featured Venue',
      type: 'boolean',
      initialValue: false
    })
  ],
  preview: {
    select: {
      title: 'name',
      media: 'heroImage',
      subtitle: 'address.city'
    }
  }
})
