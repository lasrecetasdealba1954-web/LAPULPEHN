import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = getItemCount();

  const navigation = [
    { name: 'Inicio', href: '/', icon: HomeIcon },
    { name: 'Explorar', href: '/explorar', icon: MagnifyingGlassIcon },
    { name: 'Empleos', href: '/empleos', icon: BriefcaseIcon },
  ];

  const pulperiaNavigation = [
    { name: 'Panel', href: '/mi-pulperia', icon: BuildingStorefrontIcon },
    { name: 'Ordenes', href: '/mi-pulperia/ordenes', icon: ClipboardDocumentListIcon },
    { name: 'Productos', href: '/mi-pulperia/productos', icon: ArchiveBoxIcon },
    { name: 'Centro de Mando', href: '/mi-pulperia/centro-de-mando', icon: ChartBarIcon },
    { name: 'Empleos', href: '/mi-pulperia/empleos', icon: BriefcaseIcon },
    { name: 'Configuración', href: '/mi-pulperia/configuracion', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-pulpe-dark/80 backdrop-blur-md border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-pulpe-cream rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-3 bg-pulpe-red rounded-t-lg" />
                <div className="w-3 h-4 bg-pulpe-brown rounded-t-full mt-2" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-white">La</span>{' '}
                <span className="text-pulpe-red">Pulpería</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? 'text-pulpe-red'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Cart */}
              <Link to="/carrito" className="relative p-2 text-gray-300 hover:text-white">
                <ShoppingCartIcon className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pulpe-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center space-x-2 text-gray-300 hover:text-white">
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <UserCircleIcon className="w-8 h-8" />
                    )}
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 bg-pulpe-darker border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>

                      {user.userType === 'PULPERIA' ? (
                        <>
                          {pulperiaNavigation.map((item) => (
                            <Menu.Item key={item.href}>
                              {({ active }) => (
                                <Link
                                  to={item.href}
                                  className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                                    active ? 'bg-pulpe-red/10 text-pulpe-red' : 'text-gray-300'
                                  }`}
                                >
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.name}</span>
                                </Link>
                              )}
                            </Menu.Item>
                          ))}
                        </>
                      ) : (
                        <>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/mis-ordenes"
                                className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                                  active ? 'bg-pulpe-red/10 text-pulpe-red' : 'text-gray-300'
                                }`}
                              >
                                <ClipboardDocumentListIcon className="w-4 h-4" />
                                <span>Mis Ordenes</span>
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/mis-catalogos"
                                className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                                  active ? 'bg-pulpe-red/10 text-pulpe-red' : 'text-gray-300'
                                }`}
                              >
                                <FolderIcon className="w-4 h-4" />
                                <span>Mis Catálogos</span>
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/crear-pulperia"
                                className={`flex items-center space-x-2 px-4 py-2 text-sm ${
                                  active ? 'bg-pulpe-red/10 text-pulpe-red' : 'text-gray-300'
                                }`}
                              >
                                <BuildingStorefrontIcon className="w-4 h-4" />
                                <span>Crear Pulpería</span>
                              </Link>
                            )}
                          </Menu.Item>
                        </>
                      )}

                      <div className="border-t border-gray-700 mt-1">
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`flex items-center space-x-2 w-full px-4 py-2 text-sm ${
                                active ? 'bg-pulpe-red/10 text-pulpe-red' : 'text-gray-300'
                              }`}
                            >
                              <ArrowRightOnRectangleIcon className="w-4 h-4" />
                              <span>Cerrar Sesión</span>
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              ) : (
                <Link to="/login" className="btn-primary text-sm">
                  Iniciar Sesión
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-pulpe-darker border-t border-gray-800">
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    location.pathname === item.href
                      ? 'bg-pulpe-red/10 text-pulpe-red'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-pulpe-cream rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-pulpe-red rounded-t-lg" />
                <div className="w-2 h-3 bg-pulpe-brown rounded-t-full mt-1" />
              </div>
              <span className="text-sm text-gray-400">
                La Pulpería HN - Tu marketplace de confianza
              </span>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} La Pulpería. Hecho en Honduras.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
