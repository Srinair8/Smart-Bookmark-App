import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('🔗 Callback - Request URL:', request.url)
  console.log('🌍 Callback - Origin:', origin)
  console.log('🔑 Callback - Code:', code ? 'present' : 'missing')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('❌ Auth error:', error)
    } else {
      console.log('✅ Session exchanged successfully')
    }
  }

  const redirectUrl = `${origin}/`
  console.log('↩️ Redirecting to:', redirectUrl)
  
  return NextResponse.redirect(redirectUrl)
}