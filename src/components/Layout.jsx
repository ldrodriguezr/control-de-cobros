import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  ClipboardList,
  Menu,
  X,
  Building2,
  Percent,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/acuerdos', label: 'Acuerdos de Pago', icon: ClipboardList },
  { to: '/pagos', label: 'Registro de Pagos', icon: CreditCard },
  { to: '/estados', label: 'Estados de Cuenta', icon: FileText },
  { to: '/comisiones', label: 'Control de Comisiones', icon: Percent },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex print:block print:min-h-0 print:bg-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-gradient-to-b from-zen-950 via-zen-900 to-zen-800 text-white flex flex-col transition-transform duration-300 ease-in-out print:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zen-400 to-zen-600 flex items-center justify-center shadow-lg">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">GRUPO ZEN</h1>
              <p className="text-xs text-zen-300 font-medium">Control de Cobros</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-lg shadow-white/5 backdrop-blur-sm'
                    : 'text-zen-200 hover:bg-white/8 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 rounded-xl bg-white/5 text-center">
            <p className="text-xs text-zen-300">© 2026 Grupo Zen</p>
            <p className="text-[10px] text-zen-400 mt-1">Sistema de Cobros v1.0</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-w-0 print:block print:min-h-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-4 sm:px-6 py-3 flex items-center gap-4 print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={22} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {session?.user?.email && (
              <span className="hidden sm:inline text-sm text-gray-500 max-w-[180px] truncate">
                {session.user.email}
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zen-600 to-zen-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
              GZ
            </div>
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto print:overflow-visible print:p-0 print:flex-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
