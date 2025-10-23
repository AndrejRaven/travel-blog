import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'
import {deskStructure} from './deskStructure'

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
  ],
  schema: {
    types: schemaTypes,
  },
})
