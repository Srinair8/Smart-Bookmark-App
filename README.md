# 🔖 Smart Bookmarks

A modern, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS. Save, organize, and search your favorite links with instant synchronization across devices.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

- 🔐 **Google OAuth Authentication** - Secure, passwordless login
- ⚡ **Real-time Sync** - Changes instantly appear across all tabs and devices
- 🎯 **Optimistic UI** - Lightning-fast interactions with instant feedback
- 🔒 **Private Bookmarks** - Each user's bookmarks are completely private (Row Level Security)
- 🔍 **Search & Filter** - Quickly find bookmarks by title or URL
- 🎨 **Favicon Display** - Visual website icons for easy recognition
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎉 **Toast Notifications** - Clear success and error feedback
- ✅ **Confirmation Dialogs** - Prevents accidental deletions and sign-outs

## 🚀 Live Demo

[View Live App](https://smart-bookmark-app-mu-woad.vercel.app/) 

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel
- **Notifications**: React Hot Toast

### 🧩 Challenges & Solutions
Building this app presented several interesting technical challenges. Here's how I solved them:

1. OAuth Redirect Loop Issue
Problem: After Google authentication, users were being redirected to localhost instead of the production Vercel URL, causing "This site can't be reached" errors.
Root Cause:

Google OAuth cached the redirect URL based on the first authentication environment
Supabase's Site URL configuration was still pointing to localhost
The callback route was using relative redirects that weren't domain-aware

Solution:

Updated the auth callback to use the request's origin explicitly:

typescript   const { searchParams, origin } = new URL(request.url)
   return NextResponse.redirect(`${origin}/`)

Configured Supabase URL Configuration with both localhost and production URLs
Added prompt: 'consent' to force Google to show the consent screen and ignore cached redirects
Properly configured Google Cloud Console with both Authorized JavaScript Origins and Redirect URIs

Key Takeaway: Always test OAuth flows in production early, and ensure all redirect URLs are explicitly configured in both the OAuth provider and your backend service.

2. Realtime Subscription Not Working in Production
Problem: Bookmarks added in one tab weren't appearing in other tabs without a page refresh. Realtime worked locally but failed in production.
Root Cause:

The bookmarks table wasn't added to the Supabase Realtime publication
Missing REPLICA IDENTITY FULL on the table, which is required for DELETE events

Solution:

Enabled Realtime for the bookmarks table:

sql   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

Set proper replica identity:

sql   ALTER TABLE bookmarks REPLICA IDENTITY FULL;

Verified in Supabase Dashboard: Database → Publications → supabase_realtime

Key Takeaway: Supabase Realtime requires explicit table configuration in the Publications settings. Always verify in the dashboard after running SQL commands.

3. Duplicate Bookmarks with Optimistic UI
Problem: When implementing optimistic UI for instant feedback, bookmarks appeared twice - once from the optimistic update and once from the Realtime INSERT event.
Root Cause:

Optimistic update added bookmark immediately to state
Database insert triggered Realtime event
Realtime listener added the same bookmark again

Solution:
Implemented duplicate prevention in the Realtime subscription:
typescriptif (payload.eventType === 'INSERT') {
  const newBookmark = payload.new as Bookmark
  setBookmarks(prev => {
    const exists = prev.some(b => b.id === newBookmark.id)
    if (exists) return prev // Skip duplicate
    return [newBookmark, ...prev]
  })
}
Also replaced the temporary bookmark with the real database record:
typescript// After successful insert
setBookmarks(prev => 
  prev.map(b => b.id === tempBookmark.id ? data : b)
)
Key Takeaway: When combining optimistic updates with real-time subscriptions, always implement deduplication logic and replace temporary records with authoritative database records.

4. Row Level Security (RLS) Blocking All Queries
Problem: After enabling RLS, no bookmarks appeared even though data existed in the database. Console showed "permission denied" errors.
Root Cause:

RLS was enabled on the table but policies weren't created
Without policies, RLS blocks ALL access by default

Solution:
Created comprehensive RLS policies for all CRUD operations:
sql-- SELECT policy
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT policy  
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
Key Takeaway: RLS is deny-by-default. Always create policies immediately after enabling RLS, or users won't be able to access any data. Test each CRUD operation after creating policies.

5. Slow UI Updates Despite Working Code
Problem: Bookmarks took 1-3 seconds to appear after clicking "Add Bookmark", making the app feel sluggish even though everything worked correctly.
Root Cause:

Waiting for database INSERT to complete before updating UI
Network latency to Supabase servers
Additional delay for Realtime event propagation

Solution:
Implemented optimistic UI pattern:
typescript// 1. Add to UI immediately
const tempBookmark = { id: `temp-${Date.now()}`, title, url, created_at: new Date() }
setBookmarks(prev => [tempBookmark, ...prev])

// 2. Clear form instantly
setTitle('')
setUrl('')

// 3. Save to database in background
const { data } = await supabase.from('bookmarks').insert({...})

// 4. Replace temp with real record
setBookmarks(prev => prev.map(b => b.id === tempBookmark.id ? data : b))
Key Takeaway: Perceived performance is as important as actual performance. Optimistic UI makes apps feel instant even when backend operations take time. Always provide immediate feedback to users.

6. Environment Variables Not Working in Production
Problem: App worked perfectly locally but crashed on Vercel with "undefined" errors for Supabase URL and keys.
Root Cause:

Environment variables in .env.local are only for local development
Vercel needs variables configured separately in the dashboard

Solution:

Added environment variables in Vercel Dashboard: Settings → Environment Variables
Set both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
Redeployed to pick up the new variables

Key Takeaway: .env.local is never committed to Git and doesn't deploy to production. Always configure environment variables separately in your hosting platform.

7. Delete Button Not Working (Event Bubbling Issue)
Problem: Clicking the delete button (×) on a bookmark didn't delete it, and sometimes triggered the bookmark link instead.
Root Cause:

Click event was bubbling up to parent elements
Parent container had cursor styles that made the whole card clickable

Solution:
Added event propagation prevention:
typescript<button
  onClick={(e) => {
    e.stopPropagation() // Prevent event bubbling
    handleDelete(bm.id)
  }}
>
  &times;
</button>
Key Takeaway: When nesting interactive elements, always use e.stopPropagation() to prevent click events from triggering parent handlers.

8. Middleware Deprecation Warning
Problem: Console showed warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
Root Cause:

Next.js is transitioning from middleware.ts to proxy.ts naming convention
Using the old convention triggered deprecation warnings

Solution:
Simply renamed the file:
bashmv src/middleware.ts src/proxy.ts
No code changes needed - just the filename.
Key Takeaway: Stay updated with framework conventions. Deprecation warnings are early signals to update code before breaking changes occur.


## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Cloud Console account (for OAuth)
- A Vercel account ([vercel.com](https://vercel.com)) - for deployment

## 🏁 Getting Started

### 1. Clone the Repository

git clone repository_url

### 2. Install Dependencies

npm install

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run this SQL:

-- Create bookmarks table
CREATE TABLE bookmarks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for private bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

3. Go to **Authentication > URL Configuration**:
   - Set **Site URL** to `http://localhost:3000` (for development)
   - Add redirect URLs:
     - `http://localhost:3000/**`
     - `https://your-vercel-url.vercel.app/**` (add after deployment)

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Go to **APIs & Services > OAuth consent screen**
4. Fill in app name and email
5. Go to **Credentials > Create Credentials > OAuth client ID**
6. Add authorized redirect URI:
   https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback
7. Add authorized JavaScript origin:
   http://localhost:3000
8. Copy the **Client ID** and **Client Secret**

9. In Supabase Dashboard:
   - Go to **Authentication > Providers**
   - Enable **Google**
   - Paste your Client ID and Client Secret
   - Save

### 5. Environment Variables

Create a `.env.local` file in the root directory:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

Get these values from **Supabase Dashboard > Settings > API**

### 6. Run Development Server

npm run dev

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **"Deploy"**

### Post-Deployment Setup

1. **Update Supabase URL Configuration**:
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Update Site URL to your Vercel URL
   - Add your Vercel URL to Redirect URLs: `https://your-app.vercel.app/**`

2. **Update Google OAuth**:
   - Go to Google Cloud Console > Credentials
   - Add your Vercel URL to Authorized JavaScript origins

### 🔑 Key Features Explained

1) Real-time Synchronization
   
The app uses Supabase Realtime to sync bookmarks across all open tabs and devices instantly. When you add or delete a bookmark in one tab, it appears/disappears in all other tabs without refreshing.

2) Optimistic UI
When you add a bookmark, it appears in the UI immediately before the database confirms the save. This makes the app feel incredibly fast and responsive.

3) Row Level Security (RLS)
Supabase RLS policies ensure that:

Users can only see their own bookmarks
Users can only add bookmarks to their own account
Users can only delete their own bookmarks

This is enforced at the database level, making it impossible to access other users' data even with direct database access.
🎨 Customization
Change App Name
Edit the OAuth consent screen app name in Google Cloud Console to change what users see during sign-in.
Modify Styling
All styles use Tailwind CSS utility classes. Customize colors, spacing, and layout in the component files.
Add Features
Some ideas for extensions:

Tags/categories for bookmarks
Import/export bookmarks
Browser extension
Bookmark sharing
Collections/folders
Dark mode
Edit bookmark feature
Bulk operations (select multiple, delete all, etc.)

### 🐛 Troubleshooting
OAuth redirects to localhost in production:

Check Supabase URL Configuration has your Vercel URL
Verify Google OAuth has your Vercel URL in Authorized JavaScript origins
Clear browser cache and cookies, or test in Incognito mode
Revoke app access at myaccount.google.com/permissions and re-authenticate

Realtime not working:

Ensure ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks; was run
Check Database > Publications in Supabase shows the bookmarks table
Verify ALTER TABLE bookmarks REPLICA IDENTITY FULL; was executed

Bookmarks not appearing:

Check browser console for errors
Verify all three RLS policies are created correctly
Test database access by running SELECT * FROM bookmarks in SQL Editor
Check Supabase logs in Dashboard > Logs

Environment variables not found:

Ensure .env.local is in the project root
Variable names must start with NEXT_PUBLIC_ to be accessible in browser
Restart dev server after changing environment variables
For production, verify variables are set in Vercel Dashboard

📚 What I Learned

Next.js App Router: Worked with Server and Client Components, understanding when to use each
Supabase Realtime: Implemented real-time data synchronization with PostgreSQL change events
Row Level Security: Applied database-level security policies for multi-tenant data isolation
Optimistic UI Patterns: Improved perceived performance with immediate UI updates
OAuth Flows: Debugged complex redirect issues and learned proper OAuth configuration
State Management: Handled complex state with optimistic updates, real-time events, and deduplication
TypeScript: Leveraged type safety for better developer experience and fewer runtime errors
Vercel Deployment: Managed environment variables and production deployments

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
