# Band Venue Review CMS

This is the Sanity Studio CMS for managing content for the Band Venue Review website.

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- A Sanity account

### Installation
```bash
cd cms
npm install
npm run dev
```

The Studio will be available at `http://localhost:3333`

## Schema Overview

### Content Types

#### 1. **Band**
- Band profiles with bio, photos, social links
- Gallery for multiple photos
- Location and formation year
- Verification status
- Social media integration

#### 2. **Venue**
- Venue information with address and capacity
- Hero image and photo gallery
- Technical specifications
- Contact information
- Facilities list

#### 3. **Review**
- Band reviews of venues
- Detailed rating system (sound, hospitality, payment, etc.)
- Rich text content with photos
- Gig details and performance information
- Published/featured status

#### 4. **Gig**
- Event management
- Links bands to venues with dates
- Ticket information
- Event posters
- Status tracking

#### 5. **Genre**
- Music genre taxonomy
- Color coding
- Hierarchical structure

## Content Management Features

### Photo Management
- **Image uploads** with hotspot cropping
- **Alt text** for accessibility
- **Captions** for context
- **Categorization** for review photos
- **Gallery support** for multiple images

### Rich Content Editing
- **Portable Text** for rich content
- **Block-level formatting** with headers and quotes
- **Photo integration** within content
- **Tag system** for categorization

### Relationships
- **Band ↔ Venue** connections through reviews
- **Genre associations** for bands and venues
- **Gig events** linking multiple bands
- **Featured content** highlighting

### Publishing Workflow
- **Draft/Published** status control
- **Featured content** promotion
- **Verification system** for bands and venues
- **Content moderation** capabilities

## Project Integration

### API Endpoints
The CMS content can be accessed via Sanity's APIs:
- **GROQ queries** for flexible data fetching
- **GraphQL** support
- **CDN delivery** for images
- **Real-time updates** with webhooks

### Frontend Integration
Content from this CMS should be integrated into your React frontend:
- Band profiles and galleries
- Venue information and photos
- Reviews with photos and ratings
- Upcoming gigs and events

### Database Sync
Consider syncing key data with your PostgreSQL database:
- Band and venue basic information
- Reviews and ratings
- Gig schedules

## Content Guidelines

### Image Requirements
- **Profile images**: 400x400px minimum, square aspect ratio
- **Banner images**: 1200x400px, landscape format
- **Gallery photos**: 800px minimum width
- **Review photos**: Various sizes accepted

### Content Standards
- **Bio text**: 150-500 words recommended
- **Review content**: Detailed, constructive feedback
- **Alt text**: Descriptive for accessibility
- **Tags**: Consistent vocabulary

## Development

### Schema Updates
To modify content types, edit files in `/schemaTypes/`:
- `band.ts` - Band profile schema
- `venue.ts` - Venue information schema
- `review.ts` - Review content schema
- `gig.ts` - Event management schema
- `genre.ts` - Genre taxonomy schema

### Deployment
```bash
npm run build
sanity deploy
```

Your Studio will be available at `https://your-project.sanity.studio/`

## Support

For questions about Sanity Studio:
- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Community](https://www.sanity.io/community)
- [GROQ Cheat Sheet](https://www.sanity.io/docs/groq-cheat-sheet)Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)
