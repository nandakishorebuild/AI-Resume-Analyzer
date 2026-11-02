
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? "bg-amber-500/10 text-amber-400"
        : "text-stone-300 hover:bg-white/5 hover:text-amber-400"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#202020] shadow-lg shadow-black/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <NavLink
            to="/analyze"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 shadow-md shadow-amber-500/20 transition-colors group-hover:bg-amber-400">
              <svg
                className="h-5 w-5 text-[#171717]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 4h8l4 4v12H4V4h4zm0 0v5h8V4M8 14h8m-8 4h5"
                />
              </svg>
            </div>

            <span className="text-lg font-bold tracking-tight text-stone-100 sm:text-xl">
              Resume<span className="text-amber-400">Analyzer</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            <NavLink to="/analyze" className={linkClass}>
              Analyze
            </NavLink>

            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>

            {token && (
              <>
                <div className="mx-2 h-6 w-px bg-white/10" />

                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 bg-[#292929] px-4 py-2 text-sm font-semibold text-stone-300 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-200 transition-colors hover:bg-white/10 md:hidden"
          >
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="space-y-1 border-t border-white/10 py-3 md:hidden">
            <NavLink
              to="/analyze"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              Analyze
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={linkClass}
            >
              Dashboard
            </NavLink>

            {token && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
