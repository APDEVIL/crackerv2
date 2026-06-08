// Server-side UploadThing API instance
// Import utapi anywhere on the server to manage files:
//   utapi.deleteFiles(key)
//   utapi.listFiles()
//   utapi.renameFiles(...)

import { UTApi } from 'uploadthing/server'

export const utapi = new UTApi()

// Re-export the file router type so other server files
// can reference it without importing from core directly
export type { OurFileRouter } from './core'
