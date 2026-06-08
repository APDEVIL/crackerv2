'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { authClient } from '@/server/better-auth/client'

export default function AuthRedirectPage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return

    if (!session) {
      router.replace('/login')
      return
    }

    if (session.user?.role === 'admin') {
      router.replace('/admin/dashboard')
    } else {
      router.replace('/')
    }
  }, [session, isPending, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4380D]" />
        <p className="text-sm text-gray-500">Signing you in...</p>
      </div>
    </div>
  )
}
