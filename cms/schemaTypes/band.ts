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
      name: 'locationDetails',
      title: 'Location Details',
      type: 'object',
      fields: [
        {
          name: 'city', 
          title: 'City/Town', 
          type: 'string',
          description: 'Primary city or town (e.g., Dublin, Cork, Belfast)'
        },
        {
          name: 'county',
          title: 'County',
          type: 'string',
          description: 'Irish county (all 32 counties supported)',
          options: {
            list: [
              // Republic of Ireland - Leinster
              {title: 'Dublin', value: 'Dublin'},
              {title: 'Wicklow', value: 'Wicklow'},
              {title: 'Wexford', value: 'Wexford'},
              {title: 'Carlow', value: 'Carlow'},
              {title: 'Kildare', value: 'Kildare'},
              {title: 'Meath', value: 'Meath'},
              {title: 'Louth', value: 'Louth'},
              {title: 'Longford', value: 'Longford'},
              {title: 'Westmeath', value: 'Westmeath'},
              {title: 'Offaly', value: 'Offaly'},
              {title: 'Laois', value: 'Laois'},
              {title: 'Kilkenny', value: 'Kilkenny'},
              // Republic of Ireland - Munster
              {title: 'Cork', value: 'Cork'},
              {title: 'Kerry', value: 'Kerry'},
              {title: 'Limerick', value: 'Limerick'},
              {title: 'Tipperary', value: 'Tipperary'},
              {title: 'Waterford', value: 'Waterford'},
              {title: 'Clare', value: 'Clare'},
              // Republic of Ireland - Connacht
              {title: 'Galway', value: 'Galway'},
              {title: 'Mayo', value: 'Mayo'},
              {title: 'Roscommon', value: 'Roscommon'},
              {title: 'Sligo', value: 'Sligo'},
              {title: 'Leitrim', value: 'Leitrim'},
              // Republic of Ireland - Ulster (3 counties)
              {title: 'Donegal', value: 'Donegal'},
              {title: 'Cavan', value: 'Cavan'},
              {title: 'Monaghan', value: 'Monaghan'},
              // Northern Ireland - Ulster (6 counties)
              {title: 'Antrim', value: 'Antrim'},
              {title: 'Armagh', value: 'Armagh'},
              {title: 'Down', value: 'Down'},
              {title: 'Fermanagh', value: 'Fermanagh'},
              {title: 'Londonderry', value: 'Londonderry'},
              {title: 'Tyrone', value: 'Tyrone'},
            ]
          }
        },
        {
          name: 'country', 
          title: 'Country', 
          type: 'string',
          initialValue: 'Ireland'
        }
      ]
    }),
    defineField({
      name: 'locationText',
      title: 'Location (Legacy Text)',
      type: 'string',
      description: 'Legacy field - use Location Details instead',
      readOnly: true
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
