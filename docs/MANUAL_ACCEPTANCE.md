# Manual acceptance runbook

**Purpose:** repeatable procedures for physical-browser checks that automated Chromium CI cannot perform. This is a runbook, not a progress tracker. Run these steps with synthetic data and record each outcome, date, commit, device/browser and reviewer against the corresponding task in [ENGINEERING_QUALITY_TRACKER.md](ENGINEERING_QUALITY_TRACKER.md), Sections 3 and 7. Do not mark a manual check complete based on CI alone.

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

For iOS Safari or Android Chrome, use a trusted local HTTPS development setup that serves the local Wrangler Worker to the device over your private network. The Preview Worker/environment has been removed and is not part of this test path. Do not deploy to production for physical-device acceptance.

One supported approach is to create a local certificate with a subject alternative name for the exact LAN hostname or IP address used by the phone, using a local CA such as `mkcert`. The phone must trust that CA certificate before opening the site; never copy or install the CA private key on the phone or share it. Keep the phone and development computer on the same trusted network, and allow the local Worker port through the computer's firewall.

After the certificate is trusted, run the built local Worker with Wrangler's HTTPS listener (replace the certificate paths with the files generated for the chosen LAN hostname/IP):

```bash
npm run db:setup:local
npm run build
npm run preview -- --ip 0.0.0.0 --port 8787 --local-protocol https \
  --https-cert-path /path/to/local-cert.pem \
  --https-key-path /path/to/local-cert-key.pem
```

Open the exact `https://` LAN hostname/IP covered by the certificate on the phone. Do not bypass certificate warnings: an untrusted certificate is not valid service-worker acceptance.

## Desktop and mobile acceptance

Run the applicable checks on desktop Chrome/Edge and on physical iOS Safari and Android Chrome when an HTTPS test environment is available.

### 1. Fresh learner and persistence

- Open GuitarLab with a fresh browser profile.
- Confirm no lesson completion, mastery, practice history or assumed learner preferences appear.
- Set synthetic instrument, handedness, tuning, goals and practice duration.
- Reload the page and confirm the selected preferences remain.
- Close the tab/browser and reopen GuitarLab; confirm the same profile remains.
- Confirm no learner profile or progress is sent to a server.

### 2. IndexedDB upgrade

- If a pre-v3 local GuitarLab profile exists, open the app and allow the v1-to-v3 upgrade to complete.
- Confirm the active learner and preferences are unchanged.
- Confirm existing practice-session records remain available.
- Confirm the app loads without a storage warning or uncaught browser error.
- If there is no pre-v3 database on the device, record this check as **not applicable**; do not manufacture real learner data to simulate it. The seeded v1-to-v3 migration is covered by Chromium CI.

### 3. Offline app shell

- While online, open the dashboard and at least one lesson; wait for the service worker to become active.
- Put the device/browser into airplane mode or use its offline network control.
- Reload the previously visited lesson and confirm the page loads.
- Navigate to a lesson that has never been visited on that device; confirm the explicit offline fallback appears instead of a blank page.
- Confirm the locally saved lesson progress is still present.
- Restore network connectivity and reload; confirm normal navigation resumes.
- Repeat in portrait and landscape on mobile; check for horizontal overflow.

The current offline slice caches app assets and previously visited public pages. It does not promise that every lesson, audio asset or arbitrary route is available offline.

### 4. Backup, restore and reset

- Set synthetic learner preferences and create a small amount of lesson progress.
- Export a learner backup and confirm the downloaded file is JSON.
- Change a preference, then import the backup.
- Confirm the restore preview describes replacement and requires explicit confirmation.
- Confirm the restored preferences and lesson progress match the exported state.
- Try malformed JSON and an unsupported backup version; confirm both are rejected without a restore preview.
- Start reset, enter the required phrase, then cancel the browser confirmation; confirm the learner profile remains.
- Repeat and accept the confirmation; confirm a fresh empty profile is created.
- Restore the exported backup into that clean profile and confirm the learner data returns.

The forced IndexedDB transaction-abort/rollback case is intentionally covered by automated CI; do not attempt to corrupt a real learner database manually.

### 5. Storage durability

- Open Settings → Data & backups.
- Confirm storage persistence status and usage/quota estimates are shown when the browser supports those APIs.
- If the browser offers the persistent-storage request, invoke it explicitly and confirm the UI reports the returned result accurately.
- If the browser declines or does not support the request, confirm the UI does not claim that data is guaranteed against eviction.
- Confirm export/restore remains available regardless of the persistence result.

## Record results

For each device/browser, capture the device model and OS version, exact browser version, GuitarLab commit SHA, preview URL, date/time and timezone, steps/results, console errors, screenshots and reproduction details. Enter the outcome in the matching task row in [ENGINEERING_QUALITY_TRACKER.md](ENGINEERING_QUALITY_TRACKER.md); do not maintain pass/fail status only in this runbook.

Do not close Issues #9, #10 or #18 until their applicable manual acceptance criteria have evidence. A successful automated CI run is not physical-device sign-off.
