---
name: release-readiness
description: Check whether the project is ready to release. Use before tagging a version or when asked if a release can go out.
allowed-tools: Read, Bash(git status *), Bash(git tag *), Bash(pnpm check)
---

Check that this project is ready to release the version in `package.json`. Run the three checks in order and report each as passed or failed, with its output:

1. **Clean tree:** `git status --porcelain` prints nothing.
2. **Checks pass:** `pnpm check` exits 0.
3. **Tag free:** `git tag --list v<version>` prints nothing.

If all three pass, end with "Ready to release <version>". Otherwise name what to fix first. Change no files and create no tag.
