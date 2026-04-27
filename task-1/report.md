# Task 1 — Company Leaderboard (Clone)

## Task summary

We rebuilt the internal **Company Leaderboard** as a **static web application** that mirrors the original experience: filter bar (year, quarter, category), search, podium for ranks 1–3, ranked list rows with category breakdown and expandable **Recent activity** table. Behaviour matches the reference (filter logic on activities, aggregation per person, sort order, expand/collapse), without adding unrelated features.

## Responsible AI and data hygiene

- **No corporate or personal data** from the real leaderboard was pasted into AI prompts or committed to the repository.
- A **local browser reference** (saved page / DevTools) was used only on the author’s machine to infer layout, typography, and component behaviour. Any sensitive exports stay **out of git** (see `.gitignore`).
- **Synthetic dataset** (`task-1/leaderboard/data.js`): invented display names, generic engineering-style job titles, and neutral stock portrait URLs (`randomuser.me`) used solely as **anonymous placeholders** — they do not represent real employees of any organisation.
- Activity titles and dates are **fictional**; categories follow the same three labels as in the product (**Education**, **Public Speaking**, **University Partnership**) so filters and badges stay meaningful for a leaderboard demo.

## Tools and techniques

| Area | What we used |
|------|----------------|
| IDE & assistance | **Cursor** with agent-style editing: incremental prompts, file-wide search, and small targeted diffs instead of rewriting the whole app by hand. |
| UI fidelity | **Chrome DevTools** (Computed styles, box model, colour pickers) to align spacing, fonts, borders, and hover states with the reference **SharePoint / Fluent** look. |
| Markup & behaviour | **Plain HTML + CSS + JavaScript** (no React runtime on the live page) for predictable **GitHub Pages** hosting without a build step for the shipped UI. |
| Icons | **SVG paths** aligned with **`@fluentui/react-icons`** (Fluent *System* icons, 20×20): category row icons are documented in `components/CategoryStatFluentIcons.tsx`; the static bundle inlines the same paths in `app.js` so the page works without a bundler. **`@fluentui/font-icons-mdl2`** remains listed for optional tooling / parity with MDL2 hybrid font names. |
| Theme tokens | A **subset of CSS custom properties** (Fluent-style naming) in `styles.css` keeps colours, radii, and motion tokens consistent and easier to diff against DevTools. |
| Deployment | **GitHub Actions** (`/.github/workflows/deploy-pages.yml`) uploads `task-1/leaderboard` as the **GitHub Pages** artifact (source: *GitHub Actions* in repository Settings → Pages). |

## Implementation overview

- **Entry point:** `task-1/leaderboard/index.html` loads `styles.css`, `data.js` (raw activities), then `app.js` (aggregation, filters, render).
- **Filtering:** Year and **calendar quarter** apply to each activity’s ISO date; **category** filters activities before scores are summed per person (same mental model as the web part).
- **Search:** Case-insensitive match on **display name** or **role** within the ranked list.
- **Sorting:** Leaderboard ordered by **total points descending**; expanded activity rows are **newest first**.
- **Category row (icons + numbers):** The value under each category icon is the **number of qualifying activities (events)** in that category for the person after filters — **not** category XP. **TOTAL** and the activity table **Points** column still reflect **points**.
- **Accessibility:** Semantic regions, `aria-expanded` / labels on expand controls, keyboard-friendly custom dropdowns, focus-visible styles where relevant.

## Repository layout (submission checklist)

| Requirement | Location |
|-------------|----------|
| Application source | `task-1/leaderboard/` (`index.html`, `styles.css`, `app.js`, `data.js`, optional `components/*.tsx`, `assets/`, `package.json` / `package-lock.json` for icon packages — `node_modules/` is **not** committed) |
| This write-up | `task-1/report.md` (this file) |
| Pages deploy | `.github/workflows/deploy-pages.yml` |

## Live site (GitHub Pages)

After pushing to **`main`**, open **Actions** → workflow **Deploy GitHub Pages** → successful run → **page URL** in the job summary, or **Settings → Pages** (build source: **GitHub Actions**).

Typical pattern: `https://<your-username>.github.io/<repository>/`

*(Replace with your actual URL once the first deploy finishes.)*

## Lessons learned

- **Vibe coding** worked best when prompts were scoped (e.g. “match this DevTools block”, “hover row on `td` not `tr` under `border-collapse`”) rather than “rewrite everything”.
- **Parity without real data** meant replicating **structure and tokens**, not copying names or photos from production.
- Keeping the shipped page **static** avoided extra build complexity for Pages while still referencing **Fluent** icon geometry via the official npm packages for accuracy.
