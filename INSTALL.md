# Download & install — CMO for Claude

[العربية](INSTALL.ar.md)

About **15 minutes**, no programming needed. You paste a few commands into a **terminal** (Windows: **PowerShell** or **Terminal** from the Start menu · Mac: **Terminal**).

## What you need
| | |
|---|---|
| A Claude plan | Pro, Max, Team, Enterprise or Claude Console |
| Node.js 18+ | free — step 1 |
| Google Forms or Microsoft Forms | for surveys (you probably have one already) |
| AI usage report access (optional) | Microsoft 365 admin center or your AI tool's admin analytics |

## Step 1 — Node.js
Install the **LTS** version from https://nodejs.org, close and reopen the terminal, then:
```bash
node --version
```
You should see v18 or higher.

## Step 2 — Claude Code
Windows (PowerShell):
```powershell
irm https://claude.ai/install.ps1 | iex
```
Mac / Linux:
```bash
curl -fsSL https://claude.ai/install.sh | bash
```
Run `claude` once, sign in in the browser, then `/exit`. Already installed? Skip.

## Step 3 — Install the plugin
```bash
claude plugin marketplace add Safaa-Albasha/cmo
```
```bash
claude plugin install cmo@cmo
```
Or inside Claude Code: `/plugin marketplace add Safaa-Albasha/cmo` then `/plugin install cmo@cmo`. **Restart Claude Code.**

Check: `claude plugin list` shows `cmo`.

## Step 4 — First change project
1. Create a folder (e.g. `Documents/AI-adoption`), open a terminal in it (Windows: right-click → **Open in Terminal**), run `claude`.
2. `/cmo:setup` — checks Node and explains connections.
3. `/cmo:new` — answer the questions.
4. `/cmo:assess` → `/cmo:survey` (baseline) → `/cmo:value` → `/cmo:plan`.

**Try the example first:** download the repository ZIP from https://github.com/Safaa-Albasha/cmo (**Code → Download ZIP**), copy `examples/ai-adoption` somewhere, open it in Claude Code, run `/cmo:status`. Open `examples/sample-report-ai-adoption.html` in a browser to see the report.

## Step 5 — Surveys in Forms
`/cmo:survey` writes three files to `.cmo/drafts/`:
- **Microsoft Forms:** forms.office.com → **Quick import** → upload `survey-<wave>-msforms.docx` → check questions → turn off name recording → share. Later: Responses → **Open in Excel** → `/cmo:import`.
- **Google Forms:** script.google.com → **New project** → paste `survey-<wave>-google.gs` → **Run** `createSurvey` → allow access → links appear in the log (form + responses sheet). Later: download the sheet as CSV → `/cmo:import`.

Do not remove the `[A1]`-style codes in question titles — they map answers exactly.

## Step 6 (optional) — Usage data
- **Microsoft 365 Copilot:** admin center → Reports → Usage → Microsoft 365 Copilot → export. Also export a roster (email + department) — the report has no department. `/cmo:import` with `--roster`.
- **Claude / ChatGPT Enterprise / Gemini:** admin analytics export (per user or per department).
No user identity is stored — only department totals.

## Back up the privacy salt
`.cmo/.salt` makes respondents anonymous yet comparable across waves. It is excluded from Git on purpose. **Back it up** with your project files (never share it).

## Claude Desktop (Cowork)
Plugins you add to your Claude account sync to Claude Desktop. In Cowork, open the project folder and run `/cmo:setup`: if it reports Node.js available, everything works there too; if not, use Claude Code for the calculations.

## Update / uninstall
```bash
claude plugin marketplace update cmo
```
```bash
claude plugin update cmo@cmo
```
```bash
claude plugin uninstall cmo@cmo
```
Uninstalling never deletes your `.cmo` data.

## Troubleshooting
| Problem | Fix |
|---|---|
| `node` not recognised | reinstall Node.js, reopen the terminal |
| `/cmo:...` missing | restart Claude Code; `claude plugin list`; `claude plugin enable cmo@cmo` |
| Import says department not recognised | department names in the file must match `groups.json` names (Arabic or English part) — fix and preview again |
| A group shows "hidden for privacy" | fewer than 5 people — by design |
| Approval asks for confirmation | the guard makes sure decisions are yours — by design |
| "salt is missing" | restore `.cmo/.salt` from backup; without it new answers can't be matched to earlier waves |

Help: https://github.com/Safaa-Albasha/cmo/issues
