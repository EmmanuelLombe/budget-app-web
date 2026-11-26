import { NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from '../ThemeToggle'
import { navItems } from './nav'

export default function AppShell() {
  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar: laptops and up */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line p-4 md:flex">
        <p className="px-3 py-2 text-lg font-medium tracking-tight">Budget App</p>

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'border-line bg-card text-ink'
                    : 'border-transparent text-muted hover:text-ink'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </aside>

      {/* Page content */}
      <main className="min-w-0 flex-1 p-6 pb-24 md:p-10 md:pb-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar: phones */}
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-page/90 p-2 backdrop-blur md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-xs ${
                isActive ? 'text-ink' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}