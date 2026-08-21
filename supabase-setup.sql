-- À exécuter une seule fois dans Supabase : SQL Editor → New query → coller → Run

create table public.fermes (
  code text primary key,
  pin text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.fermes enable row level security;

-- Politique simple : l'accès réel est filtré par l'application via le code
-- et le PIN (voir src/sync.js). Ne partagez jamais votre URL Supabase et
-- votre clé "anon" publiquement — traitez-les comme un mot de passe.
create policy "acces_code_pin"
  on public.fermes
  for all
  using (true)
  with check (true);
