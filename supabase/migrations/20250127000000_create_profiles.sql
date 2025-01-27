-- Create profiles table
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    username text unique,
    full_name text,
    avatar_url text,
    constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on public.profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on public.profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on public.profiles for update
    using ( auth.uid() = id );
