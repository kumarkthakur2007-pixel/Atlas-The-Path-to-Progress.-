/* ============================================================
   SETTINGS (page orchestration)
   ============================================================
   Purpose:   The Settings page is composed entirely from three
              other single-responsibility modules:
                - theme.js    → "Appearance" card
                - pinlock.js  → "Security" card
                - backup.js   → "Data" card
              This file intentionally has no unique logic of its
              own. It exists as the designated extension point
              for any future Settings-only behavior (e.g. wiring
              up the notification toggles beyond their current
              inline this.classList.toggle('on')) without that
              logic having to live awkwardly inside theme.js,
              pinlock.js, or backup.js.
   Depends on: theme.js, pinlock.js, backup.js.
   ============================================================ */
