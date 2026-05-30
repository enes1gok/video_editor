// Pre-paint theme application (avoids a flash of the wrong theme).
// Loaded as a blocking <script src> in index.html <head> so it runs before the
// body renders. Kept CSP-safe by being an external 'self' script (the page CSP
// disallows inline scripts). Mirror key matches src/app/theme/applyTheme.ts.
(function () {
  try {
    var t = localStorage.getItem('podcut-theme') || 'system';
    var dark =
      t === 'dark' ||
      (t === 'system' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    if (dark) root.classList.add('dark');
    root.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {
    /* localStorage/matchMedia unavailable — default to light */
  }
})();
