/* ============================================================
   NOTIFICATIONS (reserved — Local Notifications)
   ============================================================
   Purpose:   Not yet built. Reserved for local reminder
              notifications (task, study, habit, water, goal,
              birthday) using the browser Notification API,
              plus the future-ready hooks for Push Notifications
              and Background Sync once a backend exists.
   When implemented, this file should:
     1. Request Notification permission from a clear, explicit
        user action (never on page load).
     2. Schedule reminders client-side (setTimeout/setInterval
        while the tab/app is open is the realistic baseline for
        a backend-less PWA; true background delivery needs a
        push server, which is why Push/Background Sync are
        listed as future-ready rather than implemented today).
     3. Read user preferences from ud.settings (the toggles
        already present on the Settings page today are inert
        placeholders — wire them up here).
   Depends on (once implemented): storage.js, service-worker.js
              (for the Push/Background Sync future path).
   ============================================================ */
