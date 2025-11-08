import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {presentationTool} from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {deskStructure} from './deskStructure'
import {locations} from './resolve'

export default defineConfig({
  name: 'default',
  title: 'Blog',
  projectId: 'k5fsny25',
  dataset: 'production',
  apiVersion: '2022-06-30',
  plugins: [
    structureTool({ structure: deskStructure }), 
    visionTool(),
    media(),
    presentationTool({
      resolve: locations.resolve,
      previewUrl: {
        initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000',
        preview: '/',
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
