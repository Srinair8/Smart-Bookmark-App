'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'

type Bookmark = {
  id: string
  title: string
  url: string
  created_at: string
}

export default function BookmarkApp({ user }: { user: User }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle]         = useState('')
  const [url, setUrl]             = useState('')
  const [loading, setLoading]     = useState(true)
  const [adding, setAdding]       = useState(false)
  const [search, setSearch]       = useState('')
  const supabase = createClient()

  // ── Fetch existing bookmarks ──────────────────────────
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })
      setBookmarks(data ?? [])
      setLoading(false)
    }
    load()
  }, [supabase]) 

  // ── Subscribe to realtime changes ─────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('bookmarks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks(prev => [payload.new as Bookmark, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setBookmarks(prev => prev.filter(b => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user.id, supabase])

  // ── Add bookmark ──────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setAdding(true)
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    await supabase.from('bookmarks').insert({
      title: title.trim(),
      url: fullUrl,
      user_id: user.id,
    })
    setTitle('')
    setUrl('')
    setAdding(false)
    toast.success('Bookmark added!')
  }

  // ── Delete bookmark ───────────────────────────────────
const handleDelete = async (id: string) => {
    // Ask for confirmation first
  if (!confirm('Delete this bookmark?')) return
  // Remove from UI instantly
  setBookmarks(prev => prev.filter(b => b.id !== id))
  toast.success('Bookmark deleted!')
  
  // Then delete from database
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Delete error:', error)
    // If delete failed, reload bookmarks to restore correct state
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
    setBookmarks(data ?? [])
  }
}

  // ── Sign out ──────────────────────────────────────────
  const handleSignOut = async () => {
    if (!confirm('Are you sure you want to sign out?')) {
      return
    }
    
    toast.success('Signed out successfully!')
    await supabase.auth.signOut()
    
    // Delay reload slightly so user sees the toast
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

// ── Filter bookmarks ──────────────────────────────────
  const filteredBookmarks = bookmarks.filter(bm =>
    bm.title.toLowerCase().includes(search.toLowerCase()) ||
    bm.url.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button onClick={handleSignOut}
          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 
            rounded-lg border border-red-200 hover:border-red-300 
            transition-colors font-medium">
          Sign Out
        </button>
      </div>

      {/* Add Bookmark Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Bookmark</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <input
            type="text"
            placeholder="Title (e.g. OpenAI Docs)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="url"
            placeholder="URL (e.g. https://platform.openai.com)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button type="submit" disabled={adding}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium
              hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm">
            {adding ? 'Adding...' : 'Add Bookmark'}
          </button>
        </form>
      </div>

      {/* Bookmark List */}
      <div className="space-y-3">
        {/* Bookmark count */}
        {!loading && bookmarks.length > 0 && (
          <p className="text-sm text-gray-500 font-medium">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} saved
          </p>
        )}

        {/* Search bar */}
        {bookmarks.length > 0 && (
          <input
            type="text"
            placeholder="🔍 Search bookmarks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm
              bg-white"
          />
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && filteredBookmarks.length === 0 && bookmarks.length > 0 && (
          <p className="text-center text-gray-400 py-8">
            No bookmarks match your search.
          </p>
        )}
        {!loading && bookmarks.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            No bookmarks yet. Add your first one above!
          </p>
        )}
        {filteredBookmarks.map(bm => (
          <div key={bm.id}
            className="flex items-center justify-between bg-white rounded-xl
              shadow-sm border border-gray-200 p-4 group hover:shadow-md
              transition-shadow">
          <div className="min-w-0 flex-1 flex items-start gap-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${new URL(bm.url).hostname}&sz=32`}
              alt=""
              className="w-5 h-5 shrink-0 mt-0.5"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className="min-w-0 flex-1">
              <a href={bm.url} target="_blank" rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline truncate block">
                {bm.title}
              </a>
              <p className="text-xs text-gray-400 truncate mt-0.5">{bm.url}</p>
            </div>
          </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(bm.id)
              }}
              className="ml-4 text-gray-400 hover:text-red-500 transition-colors text-xl font-light shrink-0">
              &times;
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}