import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {colorInput} from '@sanity/color-input'
import {schemaTypes} from './schemaTypes'

const structure = (S: any) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Bands')
        .icon(() => '🎸')
        .child(S.documentTypeList('band').title('Bands')),
      S.listItem()
        .title('Venues')
        .icon(() => '🏛️')
        .child(S.documentTypeList('venue').title('Venues')),
      S.listItem()
        .title('Reviews')
        .icon(() => '⭐')
        .child(S.documentTypeList('review').title('Reviews')),
      S.listItem()
        .title('Gigs')
        .icon(() => '🎵')
        .child(S.documentTypeList('gig').title('Gigs')),
      S.divider(),
      S.listItem()
        .title('Genres')
        .icon(() => '🎭')
        .child(S.documentTypeList('genre').title('Genres')),
    ])

export default defineConfig({
  name: 'default',
  title: 'Band Venue Review CMS',

  projectId: 'sy7ko2cx',
  dataset: 'production',

  plugins: [
    structureTool({
      structure
    }), 
    visionTool(),
    colorInput()
  ],

  schema: {
    types: schemaTypes,
  },
})
