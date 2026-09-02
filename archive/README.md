# XMBtask legacy archive

The final legacy application is identified by the annotated Git tag `xmbtask-v1-final`.

`xmbtask-v1-final.bundle` is a self-contained local Git bundle generated from that tag. Bundle files are intentionally ignored by Git because they duplicate repository history and are intended for offline recovery.

Verify the bundle from the repository root with:

```powershell
git bundle verify archive/xmbtask-v1-final.bundle
```

The sanitized, import-compatible demo dataset is stored separately in `demo/demo-data.xmbtask` and contains no production content or attachment references.
