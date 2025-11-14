(function () {
  try {
    const theme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    // Fallback do light theme jeśli localStorage nie jest dostępny
    document.documentElement.classList.remove("dark");
  }
})();

