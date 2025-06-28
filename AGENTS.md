# Agent Guide

This repository uses Deno workspaces with multiple modules. Each module lives in
its own folder under the repo root and contains a `deno.json` file that defines
exports and local tasks.

## Repository Layout

- `chats/`
- `concat/`
- `crm/`

These paths are also listed in the `workspace` field of the root `deno.json`.

## Running Tasks

- Use `deno task` from the repository root to run global tasks. Important tasks
  include:
  - `test` – execute all tests
  - `ok` – run `lint`, `deno fmt --check`, and `test`
  - `typos` – spell check
- To run tasks for a specific module, in the root, run
  `deno task test [path/to/the.test.ts]`
- Alternatively, `cd` into that module's folder and run `deno task <task>`. Each
  module's `deno.json` should define its own `test`, `watch`, and other helper
  tasks.
- Add or update tests for the code you change, even if nobody asked.

## Style and Conventions

- TypeScript only with strict type checking. Avoid `any` and use interfaces and
  type aliases for clarity.
- Avoid type casting with `as` or angle-bracket syntax whenever possible. Use
  type guards or refactor code to maintain type safety instead of casting.
- Use `as const` and the `satisfies` operator when they help express literal
  types more clearly. Extra effort should be taken to keep typings as simple as
  possible.
- Formatting rules match the root `deno.json`: no semicolons, single quotes, and
  a line width of 80 characters.
- Prefer camelCase naming. Group imports by origin (@std, npm, local) and keep
  them alphabetized.
- Use object destructuring for cleaner function parameters.
- Write descriptive error messages and prefer async/await.
- Tests should use `Deno.test` and the `expect` helpers from @std.
- The only comments should be JSDoc on public APIs.
- Due to a package publishing quirk, only test files can end in .tsx otherwise a
  file cannot have the .tsx extension, or else it will not be published.
- Never modify the `deno.lock` file.
- Never run `deno task bump`.
- Never double export - any given file should be part of a package level export
  exactly once.
- If you move or break apart a file, be sure to move or break apart any tests
  that focused on that file accordingly.
- the names of test files should match the names of the files they target.
- if you are working with a vite project, to test if everything is ok in the
  module, attempt to build it, where a pass is that it can build without error.
- Always consolidate imports - there should never be two lines that import from
  the same place, except in the case where one line is importing types.
- Always prefer to import from the mod.ts file if one is present, so that
  internal refactoring doesn't break dependent code.
- Do not add directories or in any way change the directory structure unless
  explicitly directed.
- Never edit anything in node_modules or any other folder ignored by .gitignore.
- Never edit anything inside of a vendor-docs folder.
- Filenames are always kebab case.
- Tests always end in .test.ts
- To generate coverage for this repo, run `deno task test --coverage --clean`
  and the coverage will appear in the `coverage/` directory at the base of the
  workspace.

## Required Checks

Before committing changes or submitting results:

1. Run `deno task ok` from the repository root. All tests and lints must pass.
2. Ensure formatting with `deno fmt` (checked automatically by `ok`).

Always verify a clean `git status` before finishing.

## Release workflow

Each package must have its own `CHANGELOG.md`.

- Find the commit where a package's `CHANGELOG.md` was last updated.
- Identify which packages (modules listed in the workspace) have changed since
  their most recent changelog entry.
- For each affected package, increment the patch `version` in its `deno.json` so
  CI publishes the new release.
- Add a new entry to that package's changelog, keeping higher version numbers
  closer to the top of the file.
- Do not modify package versions or changelogs unless specifically requested in
  the instructions.
