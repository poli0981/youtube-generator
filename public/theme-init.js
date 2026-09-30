// Applies the saved theme and UI language before the first paint, so a
// light-theme user never sees the dark default flash. A separate file rather
// than an inline <script> so the Content-Security-Policy needs no exception.
(function () {
  var root = document.documentElement;
  var theme = "dark";
  var lang = null;
  try {
    var raw = localStorage.getItem("ytdescgen-settings");
    var state = raw ? JSON.parse(raw).state : null;
    if (state && state.theme === "light") theme = "light";
    if (state && typeof state.appLanguage === "string") lang = state.appLanguage;
  } catch (e) {
    /* storage blocked or corrupt: keep the defaults */
  }
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
  if (lang) root.lang = lang;
})();
