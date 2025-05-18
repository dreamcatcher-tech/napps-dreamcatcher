# CHANGELOG

## v0.0.7

- Deduplicates file paths to avoid processing the same file multiple times.
- Automatically skips the output file (so it’s never re-injected into itself).
- Ignores common binary/image/video extensions
  (`.pdf, .png, .jpg, .jpeg, .gif, .svg, .exe, .mp4, .mov`, etc.).
- Detects probable binary files by scanning for `NUL` bytes.
- Supports multiple ignore patterns after `--ignore` or `-i`.
- Prints per-file token counts, byte sizes, and a total token count.
- Retains previous behavior of ignoring `.git`, `.env*`, and `concat.txt` by
  default.

## v0.0.6

- Empty version bump to test the version check feature.

## v0.0.5

- Added version check feature that notifies users when a newer version is
  available on JSR.

## v0.0.4

- Changed default behavior to write output to `concat.txt` if `--output` is not
  specified.
- Added `--stdout` mode to produce raw output without info messages.
- Expanded default ignore list to include
  `.lock, .git, .gitignore, LICENSE, concat.txt`.
- By default, now only includes `*.ts, *.tsx, *.js, *.jsx, *.md, *.txt` files.
- Added `--ignore` option to specify additional globs to ignore.
- Improved token counting output and message indicating if the file was created
  or updated.
