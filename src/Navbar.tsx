import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, KanbanSquare } from "lucide-react"; // lucide-react 아이콘

export default function Navbar() {
  const links = [
    { to: "/kanban", label: "Kanban", icon: KanbanSquare },
    { to: "/stats", label: "Stats", icon: LayoutDashboard },
  ];

  return (
    <header className="border-b bg-white/70 backdrop-blur dark:bg-slate-900/70 sticky top-0 z-50">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "relative flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "text-white bg-slate-900 dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4" />
                {label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-0 rounded-lg ring-2 ring-slate-900/60 dark:ring-white/60"
                    transition={{ type: "spring", stiffness: 350, damping: 24 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
