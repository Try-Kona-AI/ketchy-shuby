# Kona / CYMBUL separation — runbook (ketchy-shuby first)

Goal: each project auto-uses the right account's credentials based on its folder,
so you never switch tokens by hand. We prove it on **ketchy-shuby** (Kona), then
replicate. Nothing here touches KJST or any CYMBUL project.

Two mechanisms:
- **direnv** auto-loads the right env file per folder (Supabase CLI token, Vercel
  token, Resend key, GitHub token, AI/data keys).
- **.mcp.json** points Claude Code's Supabase MCP at the right account, per folder.

Files already created for you:
- `~/.config/org/kona.env` — shared Kona secrets (chmod 600, outside git). Blanks to fill.
- `ketchy-shuby/.envrc` — loads kona.env + this project's Supabase ref.
- `ketchy-shuby/.mcp.json` — Kona Supabase MCP, reads token/ref from the env (no secrets in the file).
- All three are git-ignored.

---

## Step 1 — Install the tooling (one time)
```bash
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc && source ~/.zshrc
npm i -g vercel
```
(`gh` optional: `brew install gh`. Supabase MCP runs via `npx`, nothing to install.)

## Step 2 — Fill in Kona secrets
Open `~/.config/org/kona.env` and paste your **Kona** values:
- `SUPABASE_ACCESS_TOKEN` — from the **Kona** Supabase account (Account -> Access Tokens). NOT CYMBUL.
- `VERCEL_TOKEN` — from your **Kona** Vercel login (you confirmed Kona/CYMBUL are separate logins).
- `RESEND_API_KEY`, `GH_TOKEN`, AI keys — Kona values as available.

## Step 3 — Create the Kona Supabase project (confirm the account first)
> Precaution: before creating, double-check you're in the **Kona AI** Supabase
> account, not CYMBUL.
- New project named `ketchy-shuby` in the Kona account.
- Run `supabase/schema.sql` in its SQL editor.
- Copy the project **ref** (the `xxxx` in `xxxx.supabase.co`) into
  `ketchy-shuby/.envrc` -> `SUPABASE_PROJECT_REF="xxxx"`.
- Copy the Project URL + publishable key into `.env.local` (see `.env.example`).

## Step 4 — Activate direnv for this project
```bash
cd ~/Projects/ketchy-shuby
direnv allow
```
You should see it load the env. `echo $ORG` -> `kona`.

## Step 5 — Turn on the scoped Supabase MCP
- Launch Claude Code from inside `~/Projects/ketchy-shuby` (so the direnv env is
  present). The `supabase-kona` server in `.mcp.json` will use the Kona token/ref.
- Approve the new MCP server when prompted.
- Sanity check: it should list only the Kona `ketchy-shuby` project.

## Step 6 — GitHub + Vercel for this app (when you deploy)
- GitHub: create the repo under the **Try-Kona-AI** org, then add the remote via
  the Kona SSH alias:
  ```bash
  git init && git add -A && git commit -m "Initial commit"
  git remote add origin git@github-kona:Try-Kona-AI/ketchy-shuby.git
  git push -u origin main
  ```
- Vercel: deploy under your **Kona** login. Since logins are separate, either run
  `vercel login` as Kona in this shell, or `vercel --token "$VERCEL_TOKEN"`
  (the token is already loaded by direnv here).

---

## Replicate to the other projects (after ketchy-shuby is proven)

Kona projects (copy `.envrc` + `.mcp.json`, then `direnv allow`):
`kona-platform, kona-site, propiper-app, propiper-demo, hr-due-model, nrfi-model, mlbcore`

CYMBUL projects — mirror the setup with a **cymbul.env** file and `ORG=cymbul`:
`cymbul-deal-room` (and later kjst-rfp ONLY if/when you explicitly choose to).

### Do NOT touch KJST
`kjst-rfp` is LIVE. Leave it exactly as-is. Do not add `.envrc`, flip its git
remote, re-point Supabase, or redeploy it as part of this setup. Only revisit it
in a dedicated, deliberate session.

### GitHub remote flip (Kona + non-live CYMBUL repos)
Your remotes currently embed access tokens in the URL in plaintext. Switch them to
the SSH aliases you already have, e.g.:
```bash
# Kona repos:
git -C ~/Projects/kona-site       remote set-url origin git@github-kona:Try-Kona-AI/kona-site.git
git -C ~/Projects/propiper-app    remote set-url origin git@github-kona:Try-Kona-AI/pro-piper-consulting.git
git -C ~/Projects/american-capital-contracting remote set-url origin git@github-kona:Try-Kona-AI/american-capital-contracting.git
# CYMBUL (NOT kjst-rfp):
git -C ~/Projects/cymbul-deal-room remote set-url origin git@github-cymbul:TeamCYMBUL/cymbul-deal-room.git
```
Then **rotate both GitHub personal access tokens** — they were exposed in the old
remote URLs.
