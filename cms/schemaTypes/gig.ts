import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'gig',
  title: 'Gig',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      }
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'reference',
      to: {type: 'venue'},
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'headliner',
      title: 'Headliner',
      type: 'reference',
      to: {type: 'band'}
    }),
    defineField({
      name: 'supportActs',
      title: 'Support Acts',
      type: 'array',
      of: [{type: 'reference', to: {type: 'band'}}]
    }),
    defineField({
      name: 'date',
      title: 'Date & Time',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'ticketPrice',
      title: 'Ticket Price (€)',
      type: 'number'
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket URL',
      type: 'url'
    }),
    defineField({
      name: 'description',
      title: 'Event Description',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'poster',
      title: 'Event Poster',
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
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Upcoming', value: 'upcoming'},
          {title: 'Sold Out', value: 'sold_out'},
          {title: 'Cancelled', value: 'cancelled'},
          {title: 'Completed', value: 'completed'}
        ]
      },
      initialValue: 'upcoming'
    }),
    defineField({
      name: 'genre',
      title: 'Event Genre/Style',
      type: 'reference',
      to: {type: 'genre'}
    }),
    defineField({
      name: 'ageRestriction',
      title: 'Age Restriction',
      type: 'string',
      options: {
        list: [
          {title: 'All Ages', value: 'all_ages'},
          {title: '16+', value: '16_plus'},
          {title: '18+', value: '18_plus'},
          {title: '21+', value: '21_plus'}
        ]
      }
    }),
    defineField({
      name: 'featured',
      title: 'Featured Event',
      type: 'boolean',
      initialValue: false
    })
  ],
  preview: {
    select: {
      title: 'title',
      venue: 'venue.name',
      date: 'date',
      media: 'poster'
    },
    prepare(selection) {
      const {title, venue, date} = selection
      const dateStr = date ? new Date(date).toLocaleDateString() : 'No date'
      return {
        title: title,
        subtitle: `${venue} - ${dateStr}`,
        media: selection.media
      }
    }
  }
})
