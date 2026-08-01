# Sistema de Registro y Asistencia Vacacional con QR

Sistema web para inscripción de niños y control de asistencia diaria mediante
códigos QR, con roles de Público, Voluntario y Administrador.

## 🧱 Stack
- Next.js 14 (App Router) + React + Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage + RLS)
- qrcode.react, html5-qrcode, xlsx (SheetJS), jspdf + html2canvas

---

## 1️⃣ Configurar Supabase

1. Crea una cuenta en https://supabase.com y un **New Project** (elige una
   contraseña de base de datos y guárdala).
2. En el panel del proyecto, ve a **SQL Editor → New query**, pega todo el
   contenido de `supabase/schema.sql` de este repositorio y dale **Run**.
   Esto crea las 6 tablas, los roles y toda la seguridad (RLS).
3. Ve a **Storage → Create a new bucket**:
   - Nombre: `logos`
   - Marca la opción **Public bucket** (para que los logos se vean en la web).
4. Ve a **Authentication → Users → Add user** y crea tu primer usuario
   administrador (correo + contraseña).
5. Ve a **Table Editor → perfiles**, busca ese usuario recién creado y
   cambia su columna `rol` de `voluntario` a `admin`. Este será tu login
   de administrador.
6. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

---

## 2️⃣ Configurar el proyecto en tu computadora

1. Instala [Node.js 18+](https://nodejs.org).
2. Descomprime este proyecto y abre una terminal dentro de la carpeta.
3. Crea el archivo de variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Edita `.env.local` y pega tu `Project URL` y `anon key` de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   ```
4. Instala dependencias:
   ```bash
   npm install
   ```
5. Corre el proyecto localmente:
   ```bash
   npm run dev
   ```
   Ábrelo en http://localhost:3000

---

## 3️⃣ Primer uso (orden recomendado)

1. Entra a `http://localhost:3000/login` con tu usuario admin.
2. Ve a **Configuración** (`/admin/configuracion`):
   - Crea tu primera edición (ej. Año 2026, título, teléfono).
   - Márcala como **edición activa** (es la que se muestra en la landing pública).
   - Sube el logo.
   - Crea los **grupos** por edad (nombre, edad mínima, edad máxima, color).
   - Crea los **días** del vacacional (fecha + nombre del día).
3. Ve a la página principal `/` e inscribe un niño de prueba — verás cómo
   se le asigna grupo automáticamente y se genera su pase con QR.
4. Ve a `/voluntario/asistencia` y prueba el escáner de cámara o el
   buscador manual para marcar asistencia.
5. Ve a `/admin/dashboard` para ver la matriz completa y exportar a
   Excel/PDF.

Para crear cuentas de **voluntarios**: Supabase Dashboard → Authentication →
Users → Add user. Se les asigna automáticamente el rol "voluntario". Desde
`/admin/usuarios` puedes ascender a alguien a "admin" si lo necesitas.

---

## 4️⃣ Publicarlo en internet (gratis)

1. Crea una cuenta en https://github.com y sube este proyecto a un
   repositorio nuevo (puedes arrastrar los archivos desde la web de GitHub,
   o usar `git init / git add . / git commit / git push`).
2. Crea una cuenta en https://vercel.com (puedes entrar con tu cuenta de
   GitHub) → **Add New Project** → selecciona tu repositorio.
3. En **Environment Variables**, agrega las mismas dos variables de tu
   `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Dale **Deploy**. En un par de minutos tendrás una URL pública tipo
   `https://tu-vacacional.vercel.app` lista para compartir con los padres.

---

## 📂 Estructura del proyecto

```
src/
  app/                     # Páginas (App Router de Next.js)
    page.js                # Landing pública + formulario de inscripción
    pase-confirmacion/     # Pases con QR descargables
    login/                 # Login de staff
    voluntario/
      asistencia/          # Escáner QR + buscador manual
      registro-puerta/     # Registro rápido de emergencia
    admin/
      dashboard/           # Matriz de asistencia + exportación
      configuracion/       # CMS: años, grupos, días, logo
      usuarios/            # Gestión de roles
  components/              # Header, Footer, PassCard, QRScanner, etc.
  lib/supabase.js          # Cliente de Supabase
  utils/                   # assignGroup, exportToExcel, generatePDF
supabase/schema.sql        # Script SQL completo (tablas + RLS)
```

## 🔐 Roles
- **Público**: solo puede inscribir niños, no ve datos de otros.
- **Voluntario**: escanea QR, marca asistencia manual, registra en puerta.
- **Admin**: control total — configuración, usuarios, exportaciones.

## ❓Problemas comunes
- **"No hay ninguna edición activa"**: entra a `/admin/configuracion` y
  marca una edición como activa.
- **La cámara no abre**: los navegadores solo permiten cámara en `https://`
  o en `localhost`. Una vez publicado en Vercel funcionará normalmente.
- **Error al subir logo**: verifica que el bucket `logos` en Supabase
  Storage exista y esté marcado como público.
