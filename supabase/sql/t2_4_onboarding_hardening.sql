-- T2.4 Onboarding security hardening (run in Supabase SQL Editor)

-- Ensure RLS is always enabled on profiles.
alter table public.profiles enable row level security;

-- Principle of least privilege: anonymous users must have no table privileges.
revoke all on table public.profiles from anon;

-- Authenticated users may only read/update their own row (guarded by RLS policies).
grant select, update on table public.profiles to authenticated;
revoke insert, delete on table public.profiles from authenticated;

-- Keep explicit owner-only policies idempotent.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Optional data-shape hardening for onboarding fields.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_gender_allowed_values'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gender_allowed_values
      check (gender is null or gender in ('male', 'female', 'other'));
  end if;
end $$;

-- Defensive validation against tampered client payloads.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_first_name_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_first_name_valid
      check (
        first_name is null
        or (
          char_length(btrim(first_name)) between 2 and 60
          and btrim(first_name) ~ '^[[:alpha:]][[:alpha:] ''-]{1,59}$'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_last_name_valid'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_last_name_valid
      check (
        last_name is null
        or (
          char_length(btrim(last_name)) between 2 and 60
          and btrim(last_name) ~ '^[[:alpha:]][[:alpha:] ''-]{1,59}$'
        )
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_date_of_birth_adult'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_date_of_birth_adult
      check (
        date_of_birth is null
        or date_of_birth <= ((current_date - interval '18 years')::date)
      ) not valid;
  end if;
end $$;

-- NOTE:
-- The constraint above is created as NOT VALID to avoid failing on legacy rows.
-- It is still enforced for new/updated rows.
-- After cleaning historical data, run:
-- alter table public.profiles validate constraint profiles_date_of_birth_adult;
