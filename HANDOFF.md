# Ketchy Shuby · Client & Outreach CRM

A Kona AI client app for tracking outreach to table clients and their spend over time.
Built by forking the Kona platform shell (React + Vite + Tailwind + Supabase).

**Isolation rule:** this must run on the **Kona AI Supabase account — never CYMBUL.**
Do not use any CYMBUL project URL/keys here.

---

## Switch-over: getting it live (about 5 minutes)

### 1. Create the Supabase project (in your Kona AI account)
- Log into Supabase **as the Kona AI account** (the same account that owns the
  project `kona-platform` points at — `iswutjgctsilblzfjhbg`). NOT the CYMBUL account.
- New project -> name it `ketchy-shuby`, pick a US region, save the DB password.

### 2. Create the schema
- Open the project's **SQL Editor**.
- Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and Run.
  (Creates `tenants`, `clients`, `outreach`, `purchases` + row-level security.)

### 3. Wire the app to the project
- In Supabase: **Project Settings -> API**. Copy the **Project URL** and a
  **publishable key** (`sb_publishable_...`).
- In this repo, copy `.env.example` to `.env.local` and paste both values:
  ```
  VITE_SUPABASE_URL=https://<your-ketchy-project>.supabase.co
  VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
  ```

### 4. Set up the team logins
Several logins all share ONE workspace (the Ketchy Shuby book). The **first**
person to sign in creates and owns the workspace; **everyone after joins it**
automatically and sees the same clients, outreach, and spend.

- Supabase -> **Authentication -> Providers -> Email**: turn **Confirm email OFF**
  so people can sign in immediately.
- Recommended: keep it invite-only. In **Authentication -> Sign In / Providers**,
  turn **Allow new users to sign up OFF** after you've created the accounts, so
  only the people you add can get in. Add each person under
  **Authentication -> Users -> Add user** (or let them sign up once, then turn it off).
- Have the OWNER (Alex, or whoever should own it) sign in FIRST so they create the
  workspace. Order only matters for who holds the "owner" role.

### 5. Run it
```
npm install
npm run dev
```
- Open the app and sign in. First sign-in creates the "Ketchy Shuby" workspace;
  each additional login joins the same book automatically.

### 6. (Optional) Load sample data to see it populated
- After signing in once, open the SQL Editor and run
  [`supabase/seed.sql`](supabase/seed.sql). It adds 6 realistic sample clients with
  outreach + purchase history, attached to the workspace you just created.
- Delete them from the Clients page before real use, or uncomment the CLEAR block
  at the bottom of `seed.sql`.

### 7. Deploy (when ready)
- Push to a Git repo, import to Vercel **under the Kona AI Vercel/account** (not
  CYMBUL), and set the same two env vars in Vercel's project settings.

---

## What it does
- **Dashboard** — follow-ups due (overdue/today), outreach this week, spend this
  month + all-time, spend-by-month, top clients, recent outreach.
- **Clients** — searchable list by status (Prospect / Active / VIP / Dormant).
  Click a client for a detail panel: contact info, lifetime spend, outreach
  timeline, and purchase history. Add/edit clients, log outreach, record purchases.
- **Outreach** — a running log of every touch across all clients, filterable.
- **Settings** — rename the workspace.
- **Guide** — a short how-it-works for Alex/Viscount.

## Data model
- `clients` — a person/group who buys tables (status, rep, next follow-up, notes).
- `outreach` — every touch (check-in / pitch / follow-up), channel, outcome, notes.
- `purchases` — spend history (event, table, party size, amount, date).
- Lifetime spend, last purchase, and last touch are computed from these.

## Notes for whoever picks this up next
- Multi-user, single shared workspace: all logins see the same book. Membership
  is handled by `tenant_members` + the `join_workspace()` function (see
  `supabase/schema.sql`). Row-level security scopes every row to workspace members.
- `rep` on each client is a free-text field (default "Viscount") so you can see who
  owns which client; add a "my clients" filter later if the team grows.
- The `tenants` layer is kept from the shell, so a second Kona client could be run
  as its own separate workspace/deploy later without a rebuild.
