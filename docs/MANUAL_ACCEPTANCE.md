# Manual acceptance runbook

**Purpose:** complete the physical-browser checks that automated Chromium CI cannot perform. The automated coverage is already merged in PRs #42 and #43; this runbook records the remaining hands-on checks. Do not mark a manual check complete based on CI alone.

## Test environment

Use synthetic learner data only. Never use a real learner profile, private recording or personal learning history for release testing.

### Desktop preview

From the repository root:

```bash
npm ci
npm run db:setup:local
npm run build
npm run preview -- --ip 127.0.0.1 --port 8787
```

Open `http://127.0.0.1:8787` in a desktop browser. The preview uses a local-only D1 binding for the Worker runtime; learner profile and learning activity remain in browser-local IndexedDB.

### Physical mobile device

Service workers require a secure context. A phone visiting a plain `http://<computer-lan-ip>` address will generally not be able to run the service worker, so that is not a valid offline acceptance environment.

For iOS Safari or Android Chrome, use an approved HTTPS preview URL or a trusted local HTTPS development setup. The public Cloudflare preview deployment is intentionally deferred until the GitHub `preview` environment and credentials are configured. Do not deploy to production for this test.

## Desktop and mobile acceptance

Run the applicable checks on desktop Chrome/Edge and on physical iOS Safari and Android Chrome when an HTTPS test environment is available.

### 1. Fresh learner and persistence

- [ ] Open GuitarLab with a fresh browser profile.
- [ ] Confirm no lesson completion, mastery, practice history or assumed learner preferences appear.
- [ ] Set synthetic instrument, handedness, tuning, goals and practice duration.
- [ ] Reload the page and confirm the selected preferences remain.
- [ ] Close the tab/browser and reopen GuitarLab; confirm the same profile remains.
- [ ] Confirm no learner profile or progress is sent to a server.

### 2. IndexedDB upgrade

- [ ] If a pre-v2 local GuitarLab profile exists, open the app and allow the v1-to-v2 upgrade to complete.
- [ ] Confirm the active learner and preferences are unchanged.
- [ ] Confirm existing practice-session records remain available.
- [ ] Confirm the app loads without a storage warning or uncaught browser error.
- [ ] If there is no pre-v2 database on the device, record this check as **not applicable**; do not manufacture real learner data to simulate it. The seeded v1-to-v2 migration is covered by Chromium CI.

### 3. Offline app shell

- [ ] While online, open the dashboard and at least one lesson; wait for the service worker to become active.
- [ ] Put the device/browser into airplane mode or use its offline network control.
- [ ] Reload the previously visited lesson and confirm the page loads.
- [ ] Navigate to a lesson that has never been visited on that device; confirm the explicit offline fallback appears instead of a blank page.
- [ ] Confirm the locally saved lesson progress is still present.
- [ ] Restore network connectivity and reload; confirm normal navigation resumes.
- [ ] Repeat in portrait and landscape on mobile; check for horizontal overflow.

The current offline slice caches app assets and previously visited public pages. It does not promise that every lesson, audio asset or arbitrary route is available offline.

### 4. Backup, restore and reset

- [ ] Set synthetic learner preferences and create a small amount of lesson progress.
- [ ] Export a learner backup and confirm the downloaded file is JSON.
- [ ] Change a preference, then import the backup.
- [ ] Confirm the restore preview describes replacement and requires explicit confirmation.
- [ ] Confirm the restored preferences and lesson progress match the exported state.
- [ ] Try malformed JSON and an unsupported backup version; confirm both are rejected without a restore preview.
- [ ] Start reset, enter the required phrase, then cancel the browser confirmation; confirm the learner profile remains.
- [ ] Repeat and accept the confirmation; confirm a fresh empty profile is created.
- [ ] Restore the exported backup into that clean profile and confirm the learner data returns.

The forced IndexedDB transaction-abort/rollback case is intentionally covered by automated CI; do not attempt to corrupt a real learner database manually.

### 5. Storage durability

- [ ] Open Settings → Data & backups.
- [ ] Confirm storage persistence status and usage/quota estimates are shown when the browser supports those APIs.
- [ ] If the browser offers the persistent-storage request, invoke it explicitly and confirm the UI reports the returned result accurately.
- [ ] If the browser declines or does not support the request, confirm the UI does not claim that data is guaranteed against eviction.
- [ ] Confirm export/restore remains available regardless of the persistence result.

## Record results

For each device/browser, record:

- Device model and OS version
- Browser name and exact version
- GuitarLab commit SHA and preview URL
- Date/time and timezone
- Checks passed, failed or not applicable
- Console errors, screenshots and reproduction steps (with synthetic data only)

Do not close Issues #9, #10 or #18 until their applicable manual acceptance criteria have evidence. A successful automated CI run is not physical-device sign-off.
