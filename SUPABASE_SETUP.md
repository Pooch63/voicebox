# Supabase Authentication Setup

This guide will help you set up Supabase authentication for the VoiceBack application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update your `.env` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   ```

## Step 3: Set Up Database Table

Run the following SQL in your Supabase SQL Editor to create the users table:

```sql
-- Create users table
create table public.users (
  user_id uuid not null,
  name text null,
  age integer null,
  gender text null,
  year_of_stroke integer null,
  other_info jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint users_pkey primary key (user_id),
  constraint users_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint users_age_check check (((age is null) or (age >= 0))),
  constraint users_year_of_stroke_check check (((year_of_stroke is null) or (year_of_stroke >= 1900)))
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create RLS policies
-- Users can read their own data
create policy "Users can read own data"
  on public.users
  for select
  using (auth.uid() = user_id);

-- Users can insert their own data
create policy "Users can insert own data"
  on public.users
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own data
create policy "Users can update own data"
  on public.users
  for update
  using (auth.uid() = user_id);

-- Users can delete their own data
create policy "Users can delete own data"
  on public.users
  for delete
  using (auth.uid() = user_id);
```

## Step 4: Configure Email Authentication (Optional)

By default, Supabase requires email confirmation. For development, you can disable this:

1. Go to **Authentication** > **Settings** in your Supabase dashboard
2. Under **Email Auth**, toggle off "Enable email confirmations"
3. Save changes

For production, keep email confirmations enabled and configure your email templates.

## Step 5: Run the Application

```bash
npm run dev
```

Visit http://localhost:3000 and you should see the application. Try:
- Creating a new account at `/auth/signup`
- Signing in at `/auth/login`
- Completing onboarding at `/onboarding`

## Authentication Flow

1. **New User**: Sign Up → Onboarding → Home
2. **Returning User**: Sign In → Home (or Onboarding if incomplete)
3. **Protected Routes**: `/conversation`, `/order-food`, `/therapy`, `/caregiver-call`, `/admin`

## Features Implemented

- ✅ User authentication (login/signup)
- ✅ Protected routes with middleware
- ✅ Onboarding flow for new users
- ✅ User profile management
- ✅ Row Level Security (RLS) policies
- ✅ Session management
- ✅ Logout functionality

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure your `.env` file exists and contains the correct variables
- Restart your dev server after updating `.env`

### "User not found in users table"
- The onboarding flow creates the user record in the `users` table
- Make sure to complete onboarding after signup

### Email confirmation issues
- For development, disable email confirmations in Supabase settings
- For production, configure SMTP settings in Supabase

## Next Steps

- Customize the onboarding form fields
- Add password reset functionality
- Configure social auth providers (Google, GitHub, etc.)
- Set up email templates in Supabase
