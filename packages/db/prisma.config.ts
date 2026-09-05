import { defineConfig } from '@prisma/config'
import { config } from 'dotenv'

config({ path: '../../.env' })

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
