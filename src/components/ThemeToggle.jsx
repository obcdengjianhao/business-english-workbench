export function ThemeToggle({ darkMode, setDarkMode }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setDarkMode((prev) => !prev)}
      title={darkMode ? '切换浅色模式' : '切换深色模式'}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
}
