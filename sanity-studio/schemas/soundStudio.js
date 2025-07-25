export default {
  name: 'soundStudio',
  title: 'Sound Studio',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Studio Name',
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
        },
        {
          name: 'eircode',
          title: 'Eircode',
          type: 'string'
        }
      ]
    },
    {
      name: 'location',
      title: 'Location (Geo)',
      type: 'geopoint',
      description: 'Pin the exact location on the map'
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
          title: 'Facebook URL',
          type: 'url'
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url'
        },
        {
          name: 'twitter',
          title: 'Twitter URL',
          type: 'url'
        }
      ]
    },
    {
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      }
    },
    {
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility.',
            }
          ]
        }
      ]
    },
    {
      name: 'amenities',
      title: 'Amenities & Equipment',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Professional Mixing Console', value: 'mixing_console'},
          {title: 'High-End Microphones', value: 'high_end_mics'},
          {title: 'Digital Audio Workstation (DAW)', value: 'daw'},
          {title: 'Analog Recording Equipment', value: 'analog_equipment'},
          {title: 'Drum Kit Available', value: 'drum_kit'},
          {title: 'Guitar Amps', value: 'guitar_amps'},
          {title: 'Bass Amps', value: 'bass_amps'},
          {title: 'Piano/Keyboard', value: 'piano_keyboard'},
          {title: 'Vocal Booth', value: 'vocal_booth'},
          {title: 'Live Room', value: 'live_room'},
          {title: 'Control Room', value: 'control_room'},
          {title: 'Mastering Suite', value: 'mastering_suite'},
          {title: 'MIDI Controllers', value: 'midi_controllers'},
          {title: 'Audio Interfaces', value: 'audio_interfaces'},
          {title: 'Studio Monitors', value: 'studio_monitors'},
          {title: 'Headphone Distribution', value: 'headphone_distribution'},
          {title: 'Acoustic Treatment', value: 'acoustic_treatment'},
          {title: 'Parking Available', value: 'parking'},
          {title: 'WiFi', value: 'wifi'},
          {title: 'Kitchen/Break Area', value: 'kitchen'},
          {title: 'Air Conditioning', value: 'air_conditioning'},
          {title: 'Accessible Entrance', value: 'accessible_entrance'}
        ]
      }
    },
    {
      name: 'pricing',
      title: 'Pricing Information',
      type: 'object',
      fields: [
        {
          name: 'hourlyRate',
          title: 'Hourly Rate (EUR)',
          type: 'number',
          description: 'Standard hourly rate in Euros'
        },
        {
          name: 'halfDayRate',
          title: 'Half Day Rate (EUR)',
          type: 'number',
          description: '4-hour session rate'
        },
        {
          name: 'fullDayRate',
          title: 'Full Day Rate (EUR)',
          type: 'number',
          description: '8-hour session rate'
        },
        {
          name: 'engineerIncluded',
          title: 'Engineer Included in Price',
          type: 'boolean',
          initialValue: false
        },
        {
          name: 'mixingRate',
          title: 'Mixing Rate per Song (EUR)',
          type: 'number'
        },
        {
          name: 'masteringRate',
          title: 'Mastering Rate per Song (EUR)',
          type: 'number'
        },
        {
          name: 'currency',
          title: 'Currency',
          type: 'string',
          initialValue: 'EUR',
          options: {
            list: [
              {title: 'Euro (EUR)', value: 'EUR'},
              {title: 'British Pound (GBP)', value: 'GBP'},
              {title: 'US Dollar (USD)', value: 'USD'}
            ]
          }
        }
      ]
    },
    {
      name: 'genresSupported',
      title: 'Genres Supported',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Rock', value: 'rock'},
          {title: 'Pop', value: 'pop'},
          {title: 'Folk', value: 'folk'},
          {title: 'Traditional Irish', value: 'traditional_irish'},
          {title: 'Celtic', value: 'celtic'},
          {title: 'Country', value: 'country'},
          {title: 'Blues', value: 'blues'},
          {title: 'Jazz', value: 'jazz'},
          {title: 'Classical', value: 'classical'},
          {title: 'Electronic', value: 'electronic'},
          {title: 'Hip Hop', value: 'hip_hop'},
          {title: 'R&B', value: 'r_and_b'},
          {title: 'Indie', value: 'indie'},
          {title: 'Alternative', value: 'alternative'},
          {title: 'Metal', value: 'metal'},
          {title: 'Punk', value: 'punk'},
          {title: 'Reggae', value: 'reggae'},
          {title: 'Funk', value: 'funk'},
          {title: 'Singer-Songwriter', value: 'singer_songwriter'},
          {title: 'Acoustic', value: 'acoustic'}
        ]
      }
    },
    {
      name: 'bandFriendly',
      title: 'Band Friendly',
      type: 'boolean',
      description: 'Does this studio cater specifically to bands?',
      initialValue: true
    },
    {
      name: 'studioType',
      title: 'Studio Type',
      type: 'string',
      options: {
        list: [
          {title: 'Professional Recording Studio', value: 'professional'},
          {title: 'Home Studio', value: 'home'},
          {title: 'Project Studio', value: 'project'},
          {title: 'Commercial Studio', value: 'commercial'},
          {title: 'Rehearsal & Recording', value: 'rehearsal_recording'},
          {title: 'Mobile Recording', value: 'mobile'}
        ]
      }
    },
    {
      name: 'features',
      title: 'Special Features',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Live Recording Capability', value: 'live_recording'},
          {title: 'Video Recording', value: 'video_recording'},
          {title: 'Streaming Setup', value: 'streaming'},
          {title: 'Podcast Recording', value: 'podcast'},
          {title: 'Voice Over Services', value: 'voice_over'},
          {title: 'Audio Post Production', value: 'post_production'},
          {title: 'Vinyl Cutting', value: 'vinyl_cutting'},
          {title: 'CD Duplication', value: 'cd_duplication'},
          {title: 'Online Collaboration', value: 'online_collaboration'},
          {title: 'Remote Mixing', value: 'remote_mixing'}
        ]
      }
    },
    {
      name: 'capacity',
      title: 'Maximum Capacity',
      type: 'number',
      description: 'Maximum number of musicians that can record simultaneously'
    },
    {
      name: 'verified',
      title: 'Verified Studio',
      type: 'boolean',
      description: 'Has this studio been verified by our team?',
      initialValue: false
    },
    {
      name: 'featured',
      title: 'Featured Studio',
      type: 'boolean',
      description: 'Should this studio be featured prominently?',
      initialValue: false
    },
    {
      name: 'claimed',
      title: 'Claimed by Owner',
      type: 'boolean',
      description: 'Has this studio been claimed by its owner?',
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
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'tuesday',
          title: 'Tuesday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'wednesday',
          title: 'Wednesday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'thursday',
          title: 'Thursday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'friday',
          title: 'Friday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'saturday',
          title: 'Saturday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        },
        {
          name: 'sunday',
          title: 'Sunday',
          type: 'string',
          placeholder: 'e.g., 9:00 AM - 10:00 PM or Closed'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'profileImage',
      subtitle: 'address.city'
    },
    prepare(selection) {
      const {title, media, subtitle} = selection
      return {
        title: title,
        media: media,
        subtitle: subtitle ? `📍 ${subtitle}` : 'No location set'
      }
    }
  }
}
