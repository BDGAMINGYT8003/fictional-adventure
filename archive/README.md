# Archive note

The previous implementation is intentionally not stored as a binary tarball in this branch because the pull-request system rejects binary files.

To inspect the archived implementation, use Git history instead:

```bash
git show HEAD~1:package.json
git ls-tree -r --name-only HEAD~1
```

`llms-full.txt` remains available at the repository root as the primary Discord API and Gateway reference for this rewrite.
