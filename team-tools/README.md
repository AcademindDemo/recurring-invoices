# team-tools

The Fernbill team's Claude Code plugins.

- `release-readiness`: checks a clean tree, `pnpm check` and a free `v<version>` tag before a release, and rejects edits that leave a JSON file invalid.

Projects list this marketplace in their `.claude/settings.json`, so trusting the project is enough. To install it yourself:

```sh
/plugin install release-readiness --marketplace fernbill/team-tools
```
