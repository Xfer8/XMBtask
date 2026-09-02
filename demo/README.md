# XMBtask sanitized demo data

`demo-data.xmbtask` is a synthetic, import-compatible snapshot for demonstrating the retired XMBtask interface. It preserves only the former owner's aggregate data shape and feature distribution; it does not preserve production task content.

The dataset contains:

- 8 synthetic projects
- 67 synthetic tasks with the same aggregate status and priority counts as the retired owner dataset
- representative subtasks, updates, and typed links
- 9 synthetic reminders and an empty completions array
- no user IDs, email addresses, real names, attachment references, or Firebase Storage paths
- only `example.com` placeholder URLs

## Generate a fresh copy

Run this from the repository root:

```powershell
node demo/generate-demo-data.mjs
```

The generator refreshes dates relative to the current day and validates the privacy and feature-count invariants before overwriting `demo-data.xmbtask`.

## Restore notes

The legacy app's **Import full backup** action can import the `projects` and `tasks` arrays from this file. The current importer ignores the additional `reminders`, `completions`, and sanitization metadata fields. Do not import it into the live Firebase project until the decommissioning plan and the destination demo account are finalized.

This file is intentionally a demo artifact, not a backup of the retired production data.
