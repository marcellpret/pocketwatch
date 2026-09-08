# Implementation Rules

## Do not stop early

When given an implementation task, continue working until the requested functionality is fully implemented.

Do not stop merely because:
- one part of the feature works
- the code compiles
- you have explained the remaining work
- the task is large
- the current response is getting long

Use the available tools to inspect files, edit code, run tests, and verify the result.

## Large tasks

For large implementations, work incrementally.

After completing a meaningful piece:
1. Save the changes.
2. Check the current implementation.
3. Continue with the remaining requirements.

If the conversation context becomes large, rely on the repository, git diff, tests, and existing files as the source of truth.

If context compaction occurs, immediately reassess the original task and continue from the current repository state.

Do not restart completed work.

## Before finishing

Before declaring the task complete:

1. Review the original requirements.
2. Inspect git diff/status.
3. Search for unfinished TODOs/placeholders related to the task.
4. Run relevant tests.
5. Run typecheck/build/lint where applicable.
6. Fix any failures.
7. Confirm every requested requirement has been implemented.

Only declare completion when the implementation is actually complete.

# Versioning & Changelog

Releases follow **Semantic Versioning** (`major.minor.patch`) and are recorded in `CHANGELOG.md` (Keep a Changelog format). The `version` field in `package.json` is the source of truth for the current release.

## Process

1. Work is done on feature branches and merged to `main` only after testing.
2. Every feature branch adds its own entry under the `## [Unreleased]` section of `CHANGELOG.md`, in the applicable subheading (`Added`, `Changed`, `Fixed`, `Removed`, etc.). Merge the feature to `main`; the entry stays under Unreleased.
3. When cutting a release:
   - Create a new dated `## [x.y.z]` section at the top and move the accumulated Unreleased changes into it (replacing Unreleased with a fresh empty section).
   - Bump `version` in `package.json` to `x.y.z`.
   - Do not create git tags unless explicitly asked.
4. Keep entries short, user-facing, and grouped by heading.