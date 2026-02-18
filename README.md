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

## 📁 Project Structure

Smart-Bookmark-App/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts       # OAuth callback handler
│   │   ├── layout.tsx             # Root layout with Toaster
│   │   └── page.tsx               # Home page
│   ├── components/
│   │   ├── BookmarkApp.tsx        # Main bookmark manager UI
│   │   └── LoginButton.tsx        # Google OAuth login button
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts          # Browser Supabase client
│   │       └── server.ts          # Server Supabase client
│   └── proxy.ts                   # Middleware for session refresh
├── .env.local                     # Environment variables (not committed)
├── next.config.mjs
├── tailwind.config.ts
└── package.json

## 🔑 Key Features Explained

### Real-time Synchronization

The app uses Supabase Realtime to sync bookmarks across all open tabs and devices instantly. When you add or delete a bookmark in one tab, it appears/disappears in all other tabs without refreshing.

### Optimistic UI

When you add a bookmark, it appears in the UI immediately before the database confirms the save. This makes the app feel incredibly fast and responsive.

### Row Level Security (RLS)

Supabase RLS policies ensure that:
- Users can only see their own bookmarks
- Users can only add bookmarks to their own account
- Users can only delete their own bookmarks

This is enforced at the database level, making it impossible to access other users' data even with direct database access.

## 🎨 Customization

### Change App Name

Edit the OAuth consent screen app name in Google Cloud Console to change what users see during sign-in.

### Modify Styling

All styles use Tailwind CSS utility classes. Customize colors, spacing, and layout in the component files.

### Add Features

Some ideas for extensions:
- Tags/categories for bookmarks
- Import/export bookmarks
- Browser extension
- Bookmark sharing
- Collections/folders
- Dark mode

## 🐛 Troubleshooting

**OAuth redirects to localhost in production:**
- Check Supabase URL Configuration has your Vercel URL
- Verify Google OAuth has your Vercel URL in Authorized JavaScript origins
- Clear browser cache and try in Incognito mode

**Realtime not working:**
- Ensure `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;` was run
- Check Database > Publications in Supabase shows the bookmarks table

**Bookmarks not appearing:**
- Check browser console for errors
- Verify RLS policies are created correctly
- Check Supabase logs in Dashboard > Logs

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
