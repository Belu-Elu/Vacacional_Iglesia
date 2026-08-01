-- ============================================================
-- SISTEMA DE REGISTRO Y ASISTENCIA VACACIONAL CON QR
-- Script de creación de base de datos para Supabase (PostgreSQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================

-- Extensión necesaria para generar UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. TABLA: ediciones
-- ============================================================
create table if not exists ediciones (
  id uuid primary key default gen_random_uuid(),
  anio integer unique not null,
  titulo varchar not null,
  logo_url text,
  contacto_telefono varchar,
  activo boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 2. TABLA: grupos
-- ============================================================
create table if not exists grupos (
  id uuid primary key default gen_random_uuid(),
  edicion_id uuid references ediciones(id) on delete cascade,
  nombre_grupo varchar not null,
  edad_min integer not null,
  edad_max integer not null,
  color_hex varchar not null default '#6366f1'
);

-- ============================================================
-- 3. TABLA: dias_vacacional
-- ============================================================
create table if not exists dias_vacacional (
  id uuid primary key default gen_random_uuid(),
  edicion_id uuid references ediciones(id) on delete cascade,
  fecha date not null,
  nombre_dia varchar not null
);

-- ============================================================
-- 4. TABLA: inscripciones
-- ============================================================
create table if not exists inscripciones (
  id uuid primary key default gen_random_uuid(),
  edicion_id uuid references ediciones(id) on delete cascade,
  grupo_id uuid references grupos(id),
  nombres_nino varchar not null,
  apellidos_nino varchar not null,
  edad integer not null,
  alergias_medicas text,
  nombre_representante varchar not null,
  telefono_representante varchar not null,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 5. TABLA: asistencias
-- ============================================================
create table if not exists asistencias (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid references inscripciones(id) on delete cascade,
  dia_id uuid references dias_vacacional(id) on delete cascade,
  hora_ingreso timestamp with time zone default now(),
  registrado_por uuid references auth.users(id),
  unique (inscripcion_id, dia_id)
);

-- ============================================================
-- 6. TABLA: perfiles (para diferenciar admin vs voluntario)
-- Supabase Auth solo guarda email/password; guardamos el rol aquí.
-- ============================================================
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre_completo varchar,
  rol varchar not null default 'voluntario' check (rol in ('admin','voluntario')),
  created_at timestamp with time zone default now()
);

-- Trigger: cuando se crea un usuario en auth.users, crear su perfil automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre_completo, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre_completo', new.email), 'voluntario');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCIONES AUXILIARES DE ROL (usadas dentro de las políticas RLS)
-- ============================================================
create or replace function public.es_admin()
returns boolean as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol = 'admin'
  );
$$ language sql security definer stable;

create or replace function public.es_staff()
returns boolean as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol in ('admin','voluntario')
  );
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table ediciones enable row level security;
alter table grupos enable row level security;
alter table dias_vacacional enable row level security;
alter table inscripciones enable row level security;
alter table asistencias enable row level security;
alter table perfiles enable row level security;

-- ---------- ediciones ----------
-- Público puede ver solo la edición activa
create policy "publico_ve_edicion_activa" on ediciones
  for select using (activo = true or public.es_staff());

-- Solo admin puede crear/editar/borrar ediciones
create policy "admin_gestiona_ediciones" on ediciones
  for insert with check (public.es_admin());
create policy "admin_actualiza_ediciones" on ediciones
  for update using (public.es_admin());
create policy "admin_borra_ediciones" on ediciones
  for delete using (public.es_admin());

-- ---------- grupos ----------
create policy "publico_ve_grupos" on grupos
  for select using (true);
create policy "admin_gestiona_grupos_insert" on grupos
  for insert with check (public.es_admin());
create policy "admin_gestiona_grupos_update" on grupos
  for update using (public.es_admin());
create policy "admin_gestiona_grupos_delete" on grupos
  for delete using (public.es_admin());

-- ---------- dias_vacacional ----------
create policy "publico_ve_dias" on dias_vacacional
  for select using (true);
create policy "admin_gestiona_dias_insert" on dias_vacacional
  for insert with check (public.es_admin());
create policy "admin_gestiona_dias_update" on dias_vacacional
  for update using (public.es_admin());
create policy "admin_gestiona_dias_delete" on dias_vacacional
  for delete using (public.es_admin());

-- ---------- inscripciones ----------
-- Cualquier persona (incluso sin login) puede inscribir niños
create policy "publico_inscribe" on inscripciones
  for insert with check (true);

-- Solo staff (admin o voluntario) puede leer inscripciones (los padres NO pueden listar niños)
create policy "staff_lee_inscripciones" on inscripciones
  for select using (public.es_staff());

-- Solo admin puede editar/borrar inscripciones
create policy "admin_actualiza_inscripciones" on inscripciones
  for update using (public.es_admin());
create policy "admin_borra_inscripciones" on inscripciones
  for delete using (public.es_admin());

-- ---------- asistencias ----------
create policy "staff_lee_asistencias" on asistencias
  for select using (public.es_staff());
create policy "staff_registra_asistencias" on asistencias
  for insert with check (public.es_staff());
create policy "admin_borra_asistencias" on asistencias
  for delete using (public.es_admin());

-- ---------- perfiles ----------
create policy "usuario_ve_su_perfil" on perfiles
  for select using (auth.uid() = id or public.es_admin());
create policy "admin_gestiona_perfiles" on perfiles
  for update using (public.es_admin());

-- ============================================================
-- IMPORTANTE: Para crear el primer usuario ADMIN:
-- 1. Ve a Supabase Dashboard -> Authentication -> Users -> Add user
-- 2. Crea el usuario con su email y contraseña
-- 3. Ve a Table Editor -> perfiles -> busca ese usuario
-- 4. Cambia su columna "rol" de 'voluntario' a 'admin'
-- ============================================================
