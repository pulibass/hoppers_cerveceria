-- HÖPPERS BEER EXPERIENCE · carta digital
-- Tablas de contenido y administradores, RLS, permisos explícitos y bucket de imágenes.
--
-- Modelo de seguridad:
--   * La carta pública se lee con la clave publicable (roles anon/authenticated) y solo
--     puede leer la fila id = 'menu' de public.site_content.
--   * Ninguna escritura pública: anon/authenticated no tienen INSERT/UPDATE/DELETE y no
--     existen políticas de escritura. Todas las escrituras (carta, equipo, imágenes) se hacen
--     desde rutas de servidor de Next.js autenticadas, con la clave secreta (service_role).
--   * service_role omite RLS, pero igual necesita GRANT sobre las tablas: se otorgan
--     explícitamente para evitar "permission denied for table ...".
--
-- Idempotente: se puede ejecutar más de una vez sin perder datos.

begin;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- El documento debe ser un objeto JSON y de tamaño razonable (el servidor valida el detalle).
alter table public.site_content drop constraint if exists site_content_data_is_object;
alter table public.site_content add constraint site_content_data_is_object check (jsonb_typeof(data) = 'object');
alter table public.site_content drop constraint if exists site_content_data_size;
alter table public.site_content add constraint site_content_data_size check (pg_column_size(data) < 1048576);

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null,
  created_at timestamptz not null default now()
);

alter table public.admins drop constraint if exists admins_role_check;
alter table public.admins add constraint admins_role_check check (role in ('owner', 'editor'));
alter table public.admins drop constraint if exists admins_email_lowercase;
alter table public.admins add constraint admins_email_lowercase check (email = lower(email));

create unique index if not exists admins_email_key on public.admins (email);
-- Un único propietario.
create unique index if not exists admins_single_owner on public.admins (role) where role = 'owner';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.site_content enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Public can read menu" on public.site_content;
create policy "Public can read menu"
  on public.site_content
  for select
  to anon, authenticated
  using (id = 'menu');

-- public.admins no tiene políticas: anon/authenticated no pueden leerla ni escribirla.

-- ---------------------------------------------------------------------------
-- Permisos explícitos (no depender de la exposición automática de tablas)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

revoke all on table public.site_content from public, anon, authenticated;
revoke all on table public.admins from public, anon, authenticated;

grant select on table public.site_content to anon, authenticated;

grant select, insert, update, delete on table public.site_content to service_role;
grant select, insert, update, delete on table public.admins to service_role;

-- ---------------------------------------------------------------------------
-- Storage: bucket público para fotos de productos
-- ---------------------------------------------------------------------------
-- Lectura pública por URL (bucket público). Sin políticas de escritura en storage.objects
-- para anon/authenticated: solo el servidor (service_role) sube archivos.
-- 4 MB máximo: las subidas pasan por una Vercel Function, cuyo cuerpo máximo es 4,5 MB.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
