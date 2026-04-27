# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a TypeScript challenge workspace for the AI Challenge 2026. Each task lives in its own directory (`task-1/` through `task-4/`). **Task 1** is delivered as a static web app under `task-1/leaderboard/` (no root `task-1.ts`); later tasks may add `task-N.ts` entry files as needed.

## Project State

No build tooling, package manager, or test runner has been set up yet. When initializing a task:

1. Add a `package.json` (or `tsconfig.json`) at the repo root or task level as needed.
2. Install dependencies with `npm install` (or `pnpm install` / `yarn`).
3. Use `ts-node` or `tsx` to run a task’s TypeScript entry when present, e.g. `npx tsx task-N/task-N.ts`.
4. Compile with:
   ```
   npx tsc
   ```

## Architecture

Each task is self-contained in its own subdirectory. There is no shared library layer yet — keep task-specific code inside its task folder unless explicitly building a shared utility.

**Task 1** ships a static leaderboard under `task-1/leaderboard/` (GitHub Pages via `.github/workflows/deploy-pages.yml`) plus `task-1/report.md`. Local SharePoint HTML exports in `task-1/` are gitignored.

## Git

The `.claude/` directory is gitignored. All other files (including generated build output if added) should be committed unless explicitly excluded in `.gitignore`.
