# Concat

A CLI tool that concatenates the contents of specified files, directories, and
glob patterns into a single output. Files are wrapped with ASCII armor-style
headers and footers (`-----BEGIN FILE …-----` and `-----END FILE …-----`) to
clearly delimit them.

## Features

- Accepts multiple files, directories, and glob patterns.
- By default, if no paths are provided, all files (`**/*`) are included, except
  those in the ignore list.
- Automatically ignores:
  - `**/concat.txt`
  - `.git`, `.gitignore`
  - `.env*`
  - `node_modules`
  - Common binary/image/video extensions
    (`.pdf, .png, .jpg, .jpeg, .gif, .svg, .exe, .mp4, .mov, etc.`)
- Detects probable binary files by scanning for `NUL` bytes and skips them.
- Deduplicates paths (each file is only processed once).
- Supports `--ignore` or `-i` to add custom ignore globs; all subsequent
  arguments after `--ignore` or `-i` are treated as ignore patterns.
- Skips re-injecting the output file (if `--output` is used).
- Prints a summary after processing:
  - List of processed files
  - Count of total files
  - For each file: byte size and token count (using the `o1-preview` model)
  - Total token count in the final output

## Usage

```sh
concat [options] [file|folder|glob ...]

Options:
  --help
    Show this help message.

  --output FILE
    Write output to FILE. If omitted, output goes to stdout.

  --stdout
    Write output to stdout only (no summary messages).

  --ignore, -i [patterns...]
    Add custom ignore globs. All subsequent arguments after --ignore or -i
    are treated as patterns to ignore.

Examples:
  # Concatenate all .ts files into stdout
  concat "src/**/*.ts"

  # Concatenate everything, ignoring CSS and SCSS
  concat . --output out.txt -i "*.css" "*.scss"
```

> When using glob patterns, you may need to quote them to prevent shell
> expansion.

## Installation

Requires [Deno](https://deno.land) (latest stable). For file system operations,
you’ll need `--allow-read` and `--allow-write`; for version checks, add
`--allow-net=jsr.io`.

```sh
deno install --global --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat
```

After this, `concat` is available system-wide.

## Upgrading

```sh
deno install --global --reload --force --allow-read --allow-write --allow-net=jsr.io jsr:@dreamcatcher/concat
```
