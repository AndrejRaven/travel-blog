import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import { presentationTool } from 'sanity/presentation'
import {schemaTypes} from './schemaTypes'
import {deskStructure} from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'Blog',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'k5fsny25',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({ structure: deskStructure }), visionTool(),
    presentationTool({
      name: 'preview',
      title: 'Podgląd na żywo',
      previewUrl: {
        draftMode: {
          enable: '/api/draft',
        },
      },
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
