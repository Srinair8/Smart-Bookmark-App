import { createClient } from '@/lib/supabase/server'
import LoginButton from '@/components/LoginButton'
import BookmarkApp from '@/components/BookmarkApp'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900">Smart Bookmarks</h1>
          <p className="text-gray-500 text-lg">Save and organize your favourite links.</p>
          <LoginButton />
        </div>
      </main>
    )
  }

  return <BookmarkApp user={user} />
}