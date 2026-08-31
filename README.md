# Beevia Admin

Internal admin dashboard for the Beevia fintech chat application. Used by three
roles — **Support**, **Compliance**, and **Super Admin** — to search and manage user
accounts, review case notes, and (Super Admin only) manage other admin accounts.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router, TypeScript strict mode, Turbopack)
- Tailwind CSS v4 (CSS-first `@theme` configuration)
- [shadcn/ui](https://ui.shadcn.com) components
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- [socket.io-client](https://socket.io) behind a small transport abstraction
- ESLint (flat config) + Prettier, Husky + lint-staged for pre-commit checks
- Vitest + React Testing Library

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

The app runs at http://localhost:3000. Sign-in redirects to `/login`; an
authenticated session lands on `/users`.

## Previewing without a backend

The real backend doesn't exist yet, so `/login` and the dashboard pages have
nothing to talk to out of the box. Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`
to serve fixture data from `src/mocks/` instead (see `src/mocks/adapter.ts`) — every
page becomes clickable with realistic sample users, case notes, and admin accounts.

With mocks on, sign in with any password using one of:

| Email                   | Role        |
| ----------------------- | ----------- |
| `support@beevia.dev`    | Support     |
| `compliance@beevia.dev` | Compliance  |
| `admin@beevia.dev`      | Super Admin |

The login page also shows this list whenever mocks are enabled. Logging in sets a
couple of non-httpOnly cookies (`admin_session`, `admin_role`) purely so
`src/proxy.ts` has something to check — a real backend would set these via
`Set-Cookie` on `/auth/login` instead (see `src/app/(auth)/login/page.tsx`). Delete
`src/mocks/` and flip the flag off once the real API exists.

## Environment variables

See `.env.example`. The first two are required for the app to talk to a real
backend; the third is for local preview only (see above):

| Variable                 | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `API_BASE_URL`           | Base URL of the separately-hosted backend API.                |
| `NEXT_PUBLIC_SOCKET_URL` | Real-time transport endpoint (assumed Socket.IO — see below). |
| `NEXT_PUBLIC_USE_MOCKS`  | `true` to serve fixture data instead of a real backend.       |

## Folder structure

```
src/
  app/
    (auth)/login/           # public login page
    (dashboard)/            # authenticated shell: nav, role-aware sidebar, bell icon
      users/                # AD3 User Search, AD4 Account Detail
      admin-accounts/       # AD2 Manage Admin Accounts & Roles (Super Admin only)
      settings/
  proxy.ts                  # route protection + role gating (Next.js 16 "proxy", formerly middleware)
  components/
    ui/                     # shadcn components (generated, avoid hand-editing)
    shared/                 # RoleGate, DataTable, NotificationBell, ConnectionStatus
  features/
    users/                  # search, account detail, suspend/reactivate, case notes
    admin-accounts/         # admin account list + role management
  lib/
    api-client.ts           # axios instance: Bearer header + refresh-on-401 interceptor
    token-store.ts          # in-memory access-token holder
    socket.ts                # socket transport abstraction
    roles.ts                 # ROLE_ROUTE_MAP shared by proxy.ts and RoleGate
  hooks/
    use-current-admin.ts    # TanStack Query wrapper around GET /me
    use-socket-status.ts
    use-notifications.ts
  providers/
    app-providers.tsx       # composes QueryProvider + SocketProvider + Toaster
  types/
```

## Known placeholders — pending backend confirmation

The backend API is a separate service and several integration points are stubbed
with clearly marked `TODO(backend)` comments in the code:

- **API base URL / socket URL** — `.env.example` placeholders; swap once the real
  hosts are known.
- **Refresh endpoint path** — assumed `POST /auth/refresh` in `src/lib/api-client.ts`.
- **Login endpoint** — assumed `POST /auth/login` returning `{ accessToken }` and
  setting httpOnly session/refresh cookies, in `src/app/(auth)/login/page.tsx`.
- **Current-admin endpoint** — assumed `GET /me` in `src/hooks/use-current-admin.ts`.
- **Session/role cookies read by `src/proxy.ts`** — assumed an `admin_session`
  httpOnly cookie (presence-only check) and a non-httpOnly `admin_role` cookie for
  optimistic route gating. This needs backend coordination: proxy/middleware can't
  read httpOnly cookie contents or call the API without slowing every request down,
  so the authoritative role check always happens via `useCurrentAdmin` (`/me`) and
  backend-side authorization on the API itself.
- **Real-time protocol** — `src/lib/socket.ts` assumes Socket.IO but is hidden
  behind a `SocketTransport` interface so it can be swapped for raw WebSockets or
  SSE without touching `SocketProvider` or feature code. Confirm the protocol,
  auth handshake, and notification event name/payload with the backend developer
  before wiring this to production.
- **Cross-origin cookies** — since the API is a different origin, the refresh
  cookie will only be sent automatically if the backend enables CORS with
  credentials and `SameSite=None; Secure` cookies.

## Available scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Start the dev server (Turbopack).  |
| `pnpm build`        | Production build.                  |
| `pnpm start`        | Run the production build.          |
| `pnpm lint`         | Run ESLint.                        |
| `pnpm lint:fix`     | Run ESLint with `--fix`.           |
| `pnpm format`       | Format the codebase with Prettier. |
| `pnpm format:check` | Check formatting without writing.  |
| `pnpm typecheck`    | Run `tsc --noEmit`.                |
| `pnpm test`         | Run the Vitest suite.              |
