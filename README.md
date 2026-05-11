# M&M FITNESS ARENA
Una app de fitness competitivo en tiempo real donde tú y tu pareja se retan mutuamente a través de arenas, puntos y rachas de entrenamiento.

## Features

- **Arenas** — Crea o únete a arenas privadas/públicas con código de invitación
- **Log de workouts** — Registra entrenamientos con fotos de prueba y puntos automáticos
- **Competencia en tiempo real** — Ve los puntos de tu rival actualizarse al instante
- **Rachas** — Mantén consistencia 6 días seguidos para bonus de +20 pts
- **Historial** — Feed de actividad con kudos entre compañeros
- **Stats** — Gráficas de progreso semanal vs tu rival

## Tech Stack

- React + TypeScript + Vite
- Supabase (Auth, Postgres, Realtime, Storage)
- Tailwind CSS + shadcn/ui
- Motion (animaciones)

## Setup Local

1. Clona el repo y instala dependencias:
   ```bash
   npm install
   ```

2. Crea un archivo `.env` con tus credenciales de Supabase:
   ```
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

3. Corre la app:
   ```bash
   npm run dev
   ```

## Deploy (Vercel)

Variables de entorno requeridas en Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
