/* ============================================================
   API (reserved — future backend integration)
   ============================================================
   Purpose:   Not yet built. Atlas is currently fully local
              (localStorage + IndexedDB, no server). This file is
              the reserved entry point for any future network
              calls — Cloud Sync, an AI Assistant, or Team
              Collaboration, all listed on the public roadmap in
              the About page.
   When implemented, this file should be the ONLY place that
   calls fetch()/XMLHttpRequest for app data (mirroring how
   storage.js is the only place allowed to touch localStorage),
   so every network call is easy to find, mock, and secure.
   Depends on (once implemented): storage.js (to merge synced
              data back into DB), auth.js (to attach the
              session/token to requests).
   ============================================================ */
