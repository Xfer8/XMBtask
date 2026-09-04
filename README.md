# XMBtask

XMBtask is a private, shared weekly device timer. Members can check a device
out and back in, while the app records the session, calculates its duration,
and deducts it from a configurable weekly allowance.

## Commands

```bash
npm install
npm run dev              # production-mode app connected to Firebase
npm run prototype        # local-only redesign sandbox with sample data
npm run demo             # archived v1 task-management demo
npm run build            # production build
npm run build:prototype  # local prototype build
```

The local-only prototype is stored in browser `localStorage`. The production
app stores its clean shared state in Firestore at `xmbtask/state`.

## Access control

Production uses Google Sign-In and Firebase custom claims:

- `xmbtaskAccess: true` permits access to the shared workspace.
- `xmbtaskAdmin: true` permits writes and displays administrative controls.

Claims must be assigned through trusted Firebase administration; the app has no
public sign-up or access-request workflow. Firestore rules default to denying
all paths except the single XMBtask state document, and Cloud Storage remains
closed because this version does not use file uploads.

## Deployment

Firebase Hosting target `prod` serves the production build from `dist`.

```bash
npm run deploy:prod
```

The command builds the app and deploys production Hosting, Firestore Rules, and
the closed Storage Rules to the Firebase project configured in `.firebaserc`.

The previous task-management implementation and its sanitized sample data are
retained through `npm run demo` and the files under `demo/` and `archive/`.
