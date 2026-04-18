-- T2.3 Profiles model (run in Supabase SQL Editor)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  date_of_birth date,
  phone_number text,
  gender text,
  avatar_url text,
  quiz_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profile_updated_at();

-- Only owner can read profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Only owner can update profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Intentionally no INSERT/DELETE policies for API clients.

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  meta_full_name text := nullif(trim(coalesce(user_meta->>'full_name', user_meta->>'name')), '');
  meta_given_name text := nullif(trim(coalesce(user_meta->>'given_name', split_part(meta_full_name, ' ', 1))), '');
  derived_family_name text :=
    case
      when meta_full_name is not null and strpos(meta_full_name, ' ') > 0 then trim(substr(meta_full_name, strpos(meta_full_name, ' ') + 1))
      else null
    end;
  meta_family_name text := nullif(trim(coalesce(user_meta->>'family_name', derived_family_name)), '');
  meta_phone text := nullif(trim(coalesce(user_meta->>'phone', user_meta->>'phone_number')), '');
  meta_gender text := nullif(trim(user_meta->>'gender'), '');
  meta_avatar_url text := nullif(trim(coalesce(user_meta->>'avatar_url', user_meta->>'picture')), '');
  meta_birthdate_text text := nullif(trim(coalesce(user_meta->>'birthdate', user_meta->>'date_of_birth')), '');
  meta_birthdate date;
begin
  if meta_birthdate_text ~ '^\d{4}-\d{2}-\d{2}$' then
    meta_birthdate := meta_birthdate_text::date;
  end if;

  insert into public.profiles (id, first_name, last_name, date_of_birth, phone_number, gender, avatar_url)
  values (new.id, meta_given_name, meta_family_name, meta_birthdate, meta_phone, meta_gender, meta_avatar_url)
  on conflict (id) do update
  set
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name),
    date_of_birth = coalesce(public.profiles.date_of_birth, excluded.date_of_birth),
    phone_number = coalesce(public.profiles.phone_number, excluded.phone_number),
    gender = coalesce(public.profiles.gender, excluded.gender),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();
