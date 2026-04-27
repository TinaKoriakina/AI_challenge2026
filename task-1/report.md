# Task 1 — Company Leaderboard (“The Clone Wars”)

## What we built

A **static clone** of the internal **Company Leaderboard** web part: filter bar (year, calendar quarter, category), **search**, **podium** for ranks 1–3, **ranked rows** for everyone else, per-row **category icons with counts**, **TOTAL** score with star, **expand/collapse** with chevron, and an expanded **RECENT ACTIVITY** table (activity title, category badge, date, points).

The goal was **functional and visual parity** with the reference (layout, typography, colours, spacing, interactions) **without** inventing extra product features beyond what the original shows.

---

## Responsible AI & data (challenge requirement)

| Requirement | How we met it |
|-------------|----------------|
| **No real corporate data in AI or in the repo** | All people, roles, activity titles, and dates are **fabricated** in `task-1/leaderboard/data.js`. Nothing was transcribed from production systems into prompts or source files. |
| **No real names / titles / departments as factual records** | Names read like ordinary names but are **demo-only**; roles are generic engineering titles; departments are not used. |
| **Photos** | `photoUrl` values point to **public stock portraits** (`randomuser.me`) as **anonymous stand-ins**, not employee photos. |
| **Reference UI** | Layout and styling were aligned using **local DevTools** inspection of the product; we did **not** paste exports of real leaderboards into AI chats or commit them. |

---

## Tools & “vibe coding” workflow

- **Cursor** as the AI-assisted IDE: small, explicit prompts (“match this DevTools block”, “fix hover on table rows under `border-collapse`”) worked better than one-shot “rewrite everything”.
- **Chrome DevTools** for **computed styles**, colours, font sizes, padding, and hover states against the **SharePoint / Fluent** surface.
- **Plain HTML + CSS + JavaScript** for the **shipped** page so **GitHub Pages** serves a folder artifact **without** a production build pipeline for the UI itself.
- **Icon fidelity**: category row glyphs follow **`@fluentui/react-icons`** (Fluent *System* icons, 20×20); source-of-truth imports live in `task-1/leaderboard/components/CategoryStatFluentIcons.tsx`, while `app.js` **inlines the same SVG paths** so the site runs without a bundler. `@fluentui/font-icons-mdl2` stays in `package.json` for optional MDL2/font tooling.
- **CSS variables** in `styles.css` mirror a **subset of Fluent-style tokens** so theme tweaks stay traceable next to DevTools.
- **Deploy**: `.github/workflows/deploy-pages.yml` publishes the contents of **`task-1/leaderboard`** to **GitHub Pages** (enable **Settings → Pages → Build: GitHub Actions**). Static assets use a **query-string cache buster** (`?v=…` in `index.html`) so browsers pick up new `app.js` / `styles.css` after each deploy.

---

## Behaviour (parity checklist)

1. **Raw data** = flat list of activities (`data.js`). **Filters** (year, quarter, category) apply to **each activity’s date/category** before rows are aggregated **per person** (same mental model as filtering activities then rolling up scores).
2. **Search** filters the **ranked list** by **display name** or **role** (case-insensitive).
3. **Leaderboard order** = **total points** descending (sum of `points` on filtered activities).
4. **Podium** shows ranks **1–3** in the usual centre / left / right visual order.
5. **Category icons + number** under each icon = **count of qualifying activities (events)** in that category for that person **after** the same filters — **not** a per-category points subtotal. **TOTAL** and the activity table **Points** column still use **points**.
6. **Expanded activities** sorted **newest first** by ISO date string.
7. **Accessibility**: landmark section, expand `aria-expanded` / labels, keyboard-operable custom dropdown pattern, visible focus where it matters.

---

## Repository map (for reviewers)

| Deliverable | Path |
|-------------|------|
| Runnable app | `task-1/leaderboard/` — `index.html`, `styles.css`, `app.js`, `data.js` |
| Icon reference (TSX, not loaded at runtime) | `task-1/leaderboard/components/*.tsx` |
| This report | `task-1/report.md` |
| Pages workflow | `.github/workflows/deploy-pages.yml` |

`task-1/leaderboard/node_modules/` is **gitignored**; `package-lock.json` **is** committed for reproducible installs.

---

## Live URL (GitHub Pages)

After a successful run of **Deploy GitHub Pages** on branch **`main`**, copy the **environment URL** from the workflow run or from **Settings → Pages**.

Typical URL shape: `https://<your-username>.github.io/<repository>/`

Paste that URL into the **AI Challenge submission form** together with this repository link.

---

## What we’d do next with more time

- Optional **E2E** or visual regression tests for filters and expand/collapse.
- Tighter **pixel diff** pass on spacing tokens vs. the reference tenant.

---

## Takeaway

**Vibe coding** here meant: AI for speed on repetitive UI/CSS and wiring, **DevTools + browser** for truth checks, and **strict synthetic data** so the demo stays safe, reviewable, and deployable to **GitHub Pages** with a clear story for the challenge rubric.
