# HÖPPERS BEER EXPERIENCE · Carta digital

Carta pública responsive y panel privado (`/admin`) para HÖPPERS, construidos con **Next.js 16 (App Router)**, **React 19**, **TypeScript estricto** y **Supabase** (Auth, Postgres y Storage), listos para **Vercel**.

- **Carta pública (`/`)**: categorías con navegación sticky, tarjetas con foto o ilustración de respaldo, modal accesible con detalle (ficha técnica en cervezas), Happy Hour, contacto (WhatsApp e Instagram) y avisos legales. No muestra ningún enlace al panel.
- **Panel (`/admin`)**: edición de productos, precios, fotos, categorías, Happy Hour, datos del negocio y equipo (propietario + editores).
- **Contenido**: se guarda como un documento JSON validado en `public.site_content` (fila `id = 'menu'`). Si Supabase no está configurado o la fila todavía no existe, se muestra la carta transcrita del PDF (`lib/menu/default-menu.ts`). Las dudas de transcripción están en [`CONTENT_REVIEW.md`](CONTENT_REVIEW.md).

## Rutas

| Ruta | Uso |
| --- | --- |
| `/` | Carta pública (estática con ISR; se regenera al guardar desde el panel y como respaldo cada 5 minutos). |
| `/admin/login` | Inicio de sesión y “Olvidé mi contraseña”. |
| `/admin` | Panel (requiere una cuenta registrada en `public.admins`). |
| `/admin/password` | Crear, restablecer o cambiar la contraseña. |
| `/auth/confirm` | Destino de los enlaces de invitación y recuperación (`token_hash`). |

## 1. Instalar dependencias

Requiere Node.js 22 o superior.

```bash
npm install
```

## 2. Configurar `.env.local`

```bash
cp .env.example .env.local
```

Completá las cuatro variables (el archivo `.env.local` nunca se versiona; ver `.gitignore`):

| Variable | Valor | ¿Pública? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto, `https://<ref>.supabase.co` | Sí (va al navegador) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable `sb_publishable_…` (también funciona la clave `anon` heredada) | Sí: solo puede leer la carta, por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta `sb_secret_…` (o la `service_role` heredada) | **No. Solo servidor.** Nunca la pongas con prefijo `NEXT_PUBLIC_` |
| `OWNER_EMAIL` | Correo del propietario, por ejemplo `duenio@hoppers.com` | No |

La clave secreta solo se lee en `lib/supabase/admin.ts` (marcado `server-only`) y la usan únicamente las rutas de servidor autenticadas. Hay un test que falla si aparece en cualquier otro archivo.

## 3. Ejecutar en desarrollo

```bash
npm run dev        # http://localhost:3000
```

Sin variables de Supabase, la carta funciona con los datos predeterminados y el panel muestra que falta configuración.

Otros comandos:

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest
npm run build      # build de producción
```

## 4. Ejecutar la migración en Supabase

1. Abrí tu proyecto en [supabase.com](https://supabase.com) → **SQL Editor** → **New query**.
2. Pegá el contenido completo de `supabase/migrations/202610100001_hoppers_schema.sql` y presioná **Run**.

La migración es idempotente: se puede volver a ejecutar sin perder datos. Crea o ajusta:

- `public.site_content` (documento de la carta) y `public.admins` (roles `owner` y `editor`, con un único propietario).
- RLS habilitado en ambas tablas, con una sola política: lectura pública de la fila `menu`.
- Permisos explícitos: `anon` y `authenticated` solo tienen `SELECT` sobre `site_content`; `service_role` tiene `SELECT/INSERT/UPDATE/DELETE` sobre ambas tablas (así se evita `permission denied for table …`).
- El bucket público `product-images` (4 MB máximo; JPEG, PNG, WebP y AVIF), sin políticas de escritura para el público.

> Si el proyecto ya tenía políticas propias en `storage.objects` que permitan subir archivos a `anon` o `authenticated`, eliminalas: todas las subidas pasan por `/api/upload` en el servidor.

## 5. Obtener las claves sin exponerlas

En Supabase → **Project Settings** → **API Keys**:

- **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Secret keys** → **Create new secret key** (`sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY`. Se muestra completa una sola vez: copiala directo a `.env.local` y a Vercel. No la pegues en chats, issues ni capturas.
- La URL está en **Project Settings → Data API → Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.

Las claves heredadas (`anon` y `service_role`, en la pestaña **Legacy API Keys**) también funcionan con las mismas variables. Si una clave secreta se filtra, revocala desde la misma pantalla y creá otra.

## 6. Crear y configurar al propietario

1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Usá el mismo correo que `OWNER_EMAIL`, elegí una contraseña y marcá **Auto Confirm User**.
3. Ingresá en `/admin/login` con ese correo. El primer ingreso lo registra como `owner` en `public.admins`, siempre que todavía no exista otro propietario.

Después, el propietario invita editores desde **Equipo**. Cada editor recibe un correo para crear su contraseña. Solo el propietario puede invitar o quitar editores. Si la cuenta invitada ya existía, conserva su contraseña y solo gana acceso.

## 7. Site URL, Redirect URLs y plantillas de correo

En Supabase → **Authentication → URL Configuration**:

- **Site URL**: la URL de producción, por ejemplo `https://hoppers-cerveceria.vercel.app` (o el dominio propio).
- **Redirect URLs**: agregá
  - `https://<tu-dominio>/auth/confirm`
  - `https://<tu-dominio>/admin/password`
  - `http://localhost:3000/**` (para desarrollo)
  - Opcional, para previews de Vercel: `https://*-<tu-equipo>.vercel.app/**`

En **Authentication → Emails → Templates**, reemplazá el enlace de estas dos plantillas para que funcionen aunque el correo se abra en otro navegador o en otro dispositivo:

**Invite user**

```html
<h2>Te invitaron a editar la carta de HÖPPERS</h2>
<p>Creá tu contraseña para ingresar al panel:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/password">Aceptar invitación</a></p>
```

**Reset password**

```html
<h2>Restablecer contraseña · HÖPPERS</h2>
<p>Para elegir una nueva contraseña, abrí este enlace:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/password">Restablecer contraseña</a></p>
<p>Si no lo pediste, ignorá este correo.</p>
```

Si se mantienen las plantillas originales, el flujo también funciona: `/admin/password` acepta `?code=…` (abriéndolo en el mismo navegador donde se pidió) y `#access_token=…`. Si una Redirect URL no está permitida, Supabase envía a la Site URL y la carta reenvía automáticamente a `/admin/password`.

> El servidor de correo incluido en Supabase tiene un límite bajo de envíos por hora. En producción conviene configurar SMTP propio en **Authentication → Emails → SMTP Settings**.

## 8. Variables en Vercel

En Vercel → proyecto → **Settings → Environment Variables**, cargá las cuatro variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OWNER_EMAIL`) para **Production** y **Preview**. Marcá `SUPABASE_SERVICE_ROLE_KEY` como **Sensitive**.

Las variables `NEXT_PUBLIC_*` se incorporan al compilar: si las cambiás, hacé un **Redeploy**.

## 9. Desplegar con GitHub y Vercel

1. Subí el repositorio a GitHub (`pulibass/hoppers_cerveceria`).
2. En Vercel: **Add New → Project → Import** el repositorio. El framework se detecta como Next.js, sin configuración extra.
3. Cargá las variables (paso 8) y presioná **Deploy**.
4. Actualizá en Supabase la **Site URL** y las **Redirect URLs** con el dominio final (paso 7).

Cada push a la rama principal despliega a producción; las demás ramas generan previews.

## 10. Verificación después del despliegue

- [ ] **Carta**: abre en el teléfono, la navegación por categorías se desplaza y resalta la sección actual, y los precios aparecen como `$ 14.000`.
- [ ] **Modal**: al tocar un producto se abre el detalle; se cierra con ✕, tocando afuera o con Escape, y el foco vuelve al producto.
- [ ] **WhatsApp e Instagram**: abren `https://wa.me/543518063069` y `https://www.instagram.com/hoppers_cerveceria/`.
- [ ] **Panel**: `OWNER_EMAIL` ingresa en `/admin/login` y queda como propietario (*Equipo* visible).
- [ ] **Guardar**: cambiar un precio y presionar *Guardar cambios* → el cambio aparece en `/` al recargar.
- [ ] **Imágenes**: subir una foto JPG/WebP de menos de 4 MB, guardar y ver la foto en la tarjeta y en el modal. Un archivo que no es imagen o que pesa más de 4 MB se rechaza.
- [ ] **Equipo**: invitar un editor; el correo llega y el enlace permite crear la contraseña y entrar. El editor no ve *Equipo*.
- [ ] **Recuperación**: “Olvidé mi contraseña” envía el correo y el enlace permite elegir una nueva.
- [ ] **Seguridad**: una cuenta de Supabase que no está en `admins` recibe “Tu cuenta no está autorizada”.

## Arquitectura y seguridad

- `lib/menu/` — tipos, contenido predeterminado, validación estricta para escritura (`schema.ts`, con Zod), lector tolerante para datos antiguos o incompletos (`normalize.ts`) y formato de precios.
- `lib/server/` — autorización de administradores, roles, almacenamiento, validación de imágenes y helpers HTTP.
- `lib/supabase/` — clientes: público (lectura con clave publicable), sesión (cookies) y admin (clave secreta, `server-only`).
- `app/api/*` — rutas de servidor. Todas las escrituras verifican sesión, rol y origen (protección CSRF), y validan tamaño y forma del JSON. Las imágenes se validan por sus bytes reales (no por la extensión), con un máximo de 4 MB y nombres aleatorios.
- Guardado con **control de concurrencia**: si otra persona guardó mientras editabas, el servidor responde 409 y el panel ofrece recargar, en lugar de pisar los cambios.
- `proxy.ts` solo actúa en `/admin`, `/api` y `/auth`, así la carta pública puede servirse desde caché.
- Si Supabase falla durante una regeneración ISR, se sigue sirviendo la última carta válida, nunca los precios predeterminados.

## Pruebas

`npm test` cubre: formato de precios, contenido completo del PDF, validación estricta y lectura tolerante, ubicación del Happy Hour, detección real de imágenes, CSRF y redirecciones seguras, el arranque del propietario (un solo owner), las rutas `/api/menu`, `/api/upload` y `/api/admin/team` (401/403/400/409/413/415), el aislamiento de la clave secreta y las garantías de la migración SQL.
