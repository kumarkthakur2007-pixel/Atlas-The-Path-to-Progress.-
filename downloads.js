/* ============================================================
   DOWNLOADS (reserved — Study Material Manager)
   ============================================================
   Purpose:   Not yet built. Reserved for the future Study
              Material Manager: students search/filter/preview/
              bookmark/download materials; admins upload PDFs,
              notes, question papers, assignments, practical
              files, and images.
   When implemented, this file should:
     1. Store file blobs via database.js's AtlasDB (put/get/
        getAll/delete on a 'files' or 'downloads' store) —
        never localStorage, these files can be large.
     2. Store each file's *metadata* (title, subject, uploader,
        date, size, tags) via storage.js, same as every other
        feature's data.
     3. Add a #page-downloads section to index.html and a
        `downloads` entry to ROUTES in router.js (the hash route
        '#/downloads' is already reserved and documented there).
     4. Add a nav link in the sidebar, following the existing
        pattern in the other nav groups.
   Depends on (once implemented): database.js, storage.js,
              modal.js, router.js.
   ============================================================ */
