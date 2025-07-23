import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Review Title',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'reviewer',
      title: 'Reviewer (Band)',
      type: 'reference',
      to: {type: 'band'},
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'venue',
      title: 'Venue Reviewed',
      type: 'reference',
      to: {type: 'venue'},
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'gigDate',
      title: 'Gig Date',
      type: 'date'
    }),
    defineField({
      name: 'overallRating',
      title: 'Overall Rating',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(5),
      options: {
        list: [
          {title: '1 Star', value: 1},
          {title: '2 Stars', value: 2},
          {title: '3 Stars', value: 3},
          {title: '4 Stars', value: 4},
          {title: '5 Stars', value: 5}
        ]
      }
    }),
    defineField({
      name: 'ratings',
      title: 'Detailed Ratings',
      type: 'object',
      fields: [
        {
          name: 'soundQuality',
          title: 'Sound Quality',
          type: 'number',
          validation: Rule => Rule.min(1).max(5)
        },
        {
          name: 'hospitality',
          title: 'Hospitality',
          type: 'number',
          validation: Rule => Rule.min(1).max(5)
        },
        {
          name: 'payment',
          title: 'Payment Experience',
          type: 'number',
          validation: Rule => Rule.min(1).max(5)
        },
        {
          name: 'facilities',
          title: 'Facilities',
          type: 'number',
          validation: Rule => Rule.min(1).max(5)
        },
        {
          name: 'audience',
          title: 'Audience Engagement',
          type: 'number',
          validation: Rule => Rule.min(1).max(5)
        }
      ]
    }),
    defineField({
      name: 'reviewText',
      title: 'Review Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'}
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'}
            ]
          }
        }
      ]
    }),
    defineField({
      name: 'photos',
      title: 'Review Photos',
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
              title: 'Photo Caption'
            },
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text'
            },
            {
              name: 'category',
              type: 'string',
              title: 'Photo Category',
              options: {
                list: [
                  {title: 'Stage Setup', value: 'stage'},
                  {title: 'Sound Equipment', value: 'sound'},
                  {title: 'Lighting', value: 'lighting'},
                  {title: 'Green Room', value: 'green_room'},
                  {title: 'Venue Interior', value: 'interior'},
                  {title: 'Audience', value: 'audience'},
                  {title: 'Band Performance', value: 'performance'},
                  {title: 'Other', value: 'other'}
                ]
              }
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'gigDetails',
      title: 'Gig Details',
      type: 'object',
      fields: [
        {
          name: 'attendance',
          title: 'Estimated Attendance',
          type: 'number'
        },
        {
          name: 'supportActs',
          title: 'Support Acts',
          type: 'array',
          of: [{type: 'string'}]
        },
        {
          name: 'ticketPrice',
          title: 'Ticket Price (€)',
          type: 'number'
        },
        {
          name: 'paymentAmount',
          title: 'Payment Received (€)',
          type: 'number'
        },
        {
          name: 'setDuration',
          title: 'Set Duration (minutes)',
          type: 'number'
        }
      ]
    }),
    defineField({
      name: 'wouldPlayAgain',
      title: 'Would Play Again?',
      type: 'boolean'
    }),
    defineField({
      name: 'recommendToOthers',
      title: 'Recommend to Other Bands?',
      type: 'boolean'
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'featured',
      title: 'Featured Review',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    })
  ],
  preview: {
    select: {
      title: 'title',
      reviewer: 'reviewer.name',
      venue: 'venue.name',
      rating: 'overallRating',
      media: 'photos.0'
    },
    prepare(selection) {
      const {title, reviewer, venue, rating} = selection
      return {
        title: title,
        subtitle: `${reviewer} → ${venue} (${rating}★)`,
        media: selection.media
      }
    }
  }
})
