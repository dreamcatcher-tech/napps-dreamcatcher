# MoneyWorks Sync via Artifact

This folder contains a Deno-based CLI and supporting modules for performing a
**two-way** synchronization between a MoneyWorks Datacentre server and an
[Artifact](https://github.com/dreamcatcher-tech/napps) repository. It monitors
new or updated records in MoneyWorks (pulling them into a local branch) and also
pushes local changes back to MoneyWorks, keeping both sides in sync.

## Overview of the Sync Flow

1. **Provisioning**
   - Creates (if needed) a repository dedicated to MoneyWorks syncing on your
     Artifact server.
   - Sets up two branches:
     - A `moneyworks` branch (the primary mirror of MoneyWorks data).
     - A `changes` branch (where local edits can be made, which get pushed back
       to MoneyWorks).
   - Persists a simple JSON config (`config.json`) in the `moneyworks` branch
     that tracks which tables to sync and their latest pull timestamps.

2. **Update**
   - Compares the `changes` branch to the `moneyworks` branch.
     - Any new or modified files on `changes` get bundled into XML and sent to
       MoneyWorks (import).
   - Pulls fresh data from MoneyWorks for each table (export), storing each
     record as JSON in the `moneyworks` branch.
   - Merges the updated `moneyworks` branch back into `changes` so both branches
     match.

3. **Continuous Watch**
   - Optionally, you can run in watch mode (`--watch`) to:
     - Periodically poll MoneyWorks for newly modified records.
     - Push any local edits found on the `changes` branch to MoneyWorks.
     - Keep repeating on an interval.

## Installation

Make sure you have [Deno](https://deno.land/) installed. Then install this CLI
globally:

```bash
deno install --allow-env --allow-net "jsr:@dreamcatcher/moneyworks-sync"
```

> **Note**: You can learn more about Artifact at
> [its homepage](https://github.com/dreamcatcher-tech/napps).

## Usage

Run `moneyworks-sync --help` to see all options. Common examples:

```bash
# 1) Clear any locally stored env variables (prompts will reappear next time):
moneyworks-sync --clear

# 2) Provision the Artifact repository for the first time:
#    This sets up "moneyworks" and "changes" branches if they don't exist,
#    commits a config.json, and ensures we can sync the specified tables.
moneyworks-sync --provision

# 3) Perform a one-time sync (push local changes, pull MoneyWorks updates):
moneyworks-sync

# 4) Run in continuous watch mode, polling for changes every 10 seconds:
moneyworks-sync --watch
```

### Customizing Time Ranges

- `--since=1h`, `--since=2d`, etc., can set the earliest “last modified” time
  for scanning changes.
- `--since-forever` starts from time zero (pulling all historical data).

## Required Environment Variables

The CLI prompts for these if they are not set:

1. **`MONEYWORKS_SECURE_URL`**\
   URL to the MoneyWorks document, including user/password (Basic Auth).\
   Example:
   `https://user:pass@your.moneyworks-host:6710/REST/YourDoc.moneyworks`
2. **`ARTIFACT_SERVER_URL`**\
   Endpoint for your Artifact server.\
   Example: `https://artifact.example.com`
3. **`ARTIFACT_KEY`**\
   40-digit hexadecimal token for authenticating with your Artifact server.
4. **`ARTIFACT_REPO`** (optional)\
   Name of the repository to host the mirror and changes branches.\
   Defaults to `mw-sync` if not provided.

## Development & Testing

- **Test**:
  ```bash
  deno task test
  ```
- **Watch** (auto-retest on changes):
  ```bash
  deno task watch
  ```
- **Mocking**:\
  The file `mock.test.ts` demonstrates a mock MoneyWorks server so you can test
  sync logic without a real server.

## Notes

- The default poll interval is defined in the config passed to `watch()`,
  typically `10000` ms.
- Each table is tracked in `config.json` with a `lastModified` timestamp to
  avoid duplicating records.
- Deletions are not fully handled by default; see `issues.md` for open questions
  on that and other complexities (e.g., archiving or ignoring removed records).
