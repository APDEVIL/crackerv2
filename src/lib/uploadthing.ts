'use client'

// Drop-in components for the frontend
// Usage:
//   <UploadButton endpoint="productImages" onClientUploadComplete={...} />
//   <UploadDropzone endpoint="slideImage" onClientUploadComplete={...} />

import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from '@uploadthing/react'

import type { OurFileRouter } from '@/server/uploadthing/core'

// Pre-built UI components — typed to your router
export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

// Low-level hook for custom upload UI
// Usage: const { startUpload, isUploading } = useUploadThing("productImages")
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()
