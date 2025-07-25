export default {
  name: 'venue',
  title: 'Music Venue',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Venue Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4
    },
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {
          name: 'street',
          title: 'Street Address',
          type: 'string'
        },
        {
          name: 'city',
          title: 'City',
          type: 'string'
        },
        {
          name: 'county',
          title: 'County',
          type: 'string'
        },
        {
          name: 'country',
          title: 'Country',
          type: 'string',
          initialValue: 'Ireland'
        }
      ]
    },
    {
      name: 'contact',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {
          name: 'phone',
          title: 'Phone Number',
          type: 'string'
        },
        {
          name: 'email',
          title: 'Email',
          type: 'email'
        },
        {
          name: 'website',
          title: 'Website',
          type: 'url'
        },
        {
          name: 'facebook',
          title: 'Facebook',
          type: 'url'
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url'
        },
        {
          name: 'twitter',
          title: 'Twitter',
          type: 'url'
        }
      ]
    },
    {
      name: 'venueDetails',
      title: 'Venue Details',
      type: 'object',
      fields: [
        {
          name: 'capacity',
          title: 'Capacity',
          type: 'number',
          description: 'Maximum number of people'
        },
        {
          name: 'venueType',
          title: 'Venue Type',
          type: 'string',
          options: {
            list: [
              {title: 'Live Music Venue', value: 'live_music'},
              {title: 'Pub', value: 'pub'},
              {title: 'Club', value: 'club'},
              {title: 'Concert Hall', value: 'concert_hall'},
              {title: 'Theatre', value: 'theatre'},
              {title: 'Arts Center', value: 'arts_center'},
              {title: 'Arena', value: 'arena'},
              {title: 'Restaurant with Music', value: 'restaurant_with_music'},
              {title: 'Other', value: 'other'}
            ]
          },
          initialValue: 'live_music'
        },
        {
          name: 'hasStage',
          title: 'Has Stage',
          type: 'boolean',
          initialValue: true
        },
        {
          name: 'hasPA',
          title: 'Has PA System',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'hasLighting',
          title: 'Has Lighting System',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'hasParking',
          title: 'Has Parking',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'isAccessible',
          title: 'Wheelchair Accessible',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'allowsAllAges',
          title: 'Allows All Ages',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'servesFood',
          title: 'Serves Food',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'servesAlcohol',
          title: 'Serves Alcohol',
          type: 'boolean',
          initialValue: false
        }
      ]
    },
    {
      name: 'musicGenres',
      title: 'Music Genres',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Rock', value: 'rock'},
          {title: 'Pop', value: 'pop'},
          {title: 'Folk', value: 'folk'},
          {title: 'Traditional Irish', value: 'traditional_irish'},
          {title: 'Jazz', value: 'jazz'},
          {title: 'Classical', value: 'classical'},
          {title: 'Electronic', value: 'electronic'},
          {title: 'Hip Hop', value: 'hip_hop'},
          {title: 'Metal', value: 'metal'},
          {title: 'Indie', value: 'indie'},
          {title: 'Alternative', value: 'alternative'},
          {title: 'Country', value: 'country'},
          {title: 'Blues', value: 'blues'},
          {title: 'Reggae', value: 'reggae'},
          {title: 'Punk', value: 'punk'},
          {title: 'All Genres', value: 'all_genres'}
        ]
      }
    },
    {
      name: 'location',
      title: 'Location',
      type: 'geopoint'
    },
    {
      name: 'googleData',
      title: 'Google Data',
      type: 'object',
      fields: [
        {
          name: 'placeId',
          title: 'Google Place ID',
          type: 'string'
        },
        {
          name: 'rating',
          title: 'Google Rating',
          type: 'number'
        },
        {
          name: 'totalReviews',
          title: 'Total Reviews',
          type: 'number'
        },
        {
          name: 'priceLevel',
          title: 'Price Level',
          type: 'number',
          description: '0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive'
        }
      ]
    },
    {
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          options: {
            isHighlighted: true
          }
        }
      ]
    },
    {
      name: 'images',
      title: 'Additional Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string'
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string'
            }
          ]
        }
      ]
    },
    {
      name: 'bandFriendly',
      title: 'Band Friendly',
      type: 'boolean',
      description: 'Is this venue welcoming to bands?',
      initialValue: true
    },
    {
      name: 'verified',
      title: 'Verified',
      type: 'boolean',
      description: 'Has this venue been verified by our team?',
      initialValue: false
    },
    {
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Should this venue be featured prominently?',
      initialValue: false
    },
    {
      name: 'openingHours',
      title: 'Opening Hours',
      type: 'object',
      fields: [
        {
          name: 'monday',
          title: 'Monday',
          type: 'string'
        },
        {
          name: 'tuesday',
          title: 'Tuesday',
          type: 'string'
        },
        {
          name: 'wednesday',
          title: 'Wednesday',
          type: 'string'
        },
        {
          name: 'thursday',
          title: 'Thursday',
          type: 'string'
        },
        {
          name: 'friday',
          title: 'Friday',
          type: 'string'
        },
        {
          name: 'saturday',
          title: 'Saturday',
          type: 'string'
        },
        {
          name: 'sunday',
          title: 'Sunday',
          type: 'string'
        }
      ]
    }
  ],
  
  preview: {
    select: {
      title: 'name',
      subtitle: 'address.city',
      media: 'profileImage',
      venueType: 'venueDetails.venueType',
      verified: 'verified',
      featured: 'featured'
    },
    prepare(selection) {
      const {title, subtitle, media, venueType, verified, featured} = selection
      const badges = []
      if (featured) badges.push('⭐ Featured')
      if (verified) badges.push('✅ Verified')
      if (venueType) badges.push(venueType.replace('_', ' '))
      
      return {
        title: title,
        subtitle: `${subtitle || 'Ireland'}${badges.length ? ' • ' + badges.join(' • ') : ''}`,
        media: media
      }
    }
  },

  orderings: [
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [
        {field: 'name', direction: 'asc'}
      ]
    },
    {
      title: 'City A-Z',
      name: 'cityAsc',
      by: [
        {field: 'address.city', direction: 'asc'},
        {field: 'name', direction: 'asc'}
      ]
    },
    {
      title: 'Featured First',
      name: 'featuredFirst',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: 'verified', direction: 'desc'},
        {field: 'name', direction: 'asc'}
      ]
    }
  ]
}
