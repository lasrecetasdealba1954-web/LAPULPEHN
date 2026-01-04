import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';

// Layout
import Layout from './components/Layout';
import StarBackground from './components/StarBackground';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Explore from './pages/Explore';
import PulperiaDetail from './pages/PulperiaDetail';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import MyCatalogs from './pages/MyCatalogs';

// Pulperia Pages
import PulperiaDashboard from './pages/pulperia/Dashboard';
import PulperiaOrders from './pages/pulperia/Orders';
import PulperiaProducts from './pages/pulperia/Products';
import PulperiaStats from './pages/pulperia/Stats';
import PulperiaJobs from './pages/pulperia/Jobs';
import PulperiaSettings from './pages/pulperia/Settings';
import CreatePulperia from './pages/pulperia/Create';

// Protected Route Component
function ProtectedRoute({ children, requirePulperia = false }: { children: React.ReactNode; requirePulperia?: boolean }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requirePulperia && user.userType !== 'PULPERIA') {
    return <Navigate to="/crear-pulperia" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <StarBackground />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #e63946',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#e63946', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explorar" element={<Explore />} />
          <Route path="pulperia/:id" element={<PulperiaDetail />} />
          <Route path="producto/:id" element={<ProductDetail />} />
          <Route path="empleos" element={<Jobs />} />
          <Route path="empleo/:id" element={<JobDetail />} />

          {/* Protected Customer Routes */}
          <Route path="carrito" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="mis-ordenes" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
          <Route path="mis-catalogos" element={<ProtectedRoute><MyCatalogs /></ProtectedRoute>} />

          {/* Pulperia Creation */}
          <Route path="crear-pulperia" element={<ProtectedRoute><CreatePulperia /></ProtectedRoute>} />

          {/* Protected Pulperia Routes */}
          <Route path="mi-pulperia" element={<ProtectedRoute requirePulperia><PulperiaDashboard /></ProtectedRoute>} />
          <Route path="mi-pulperia/ordenes" element={<ProtectedRoute requirePulperia><PulperiaOrders /></ProtectedRoute>} />
          <Route path="mi-pulperia/productos" element={<ProtectedRoute requirePulperia><PulperiaProducts /></ProtectedRoute>} />
          <Route path="mi-pulperia/centro-de-mando" element={<ProtectedRoute requirePulperia><PulperiaStats /></ProtectedRoute>} />
          <Route path="mi-pulperia/empleos" element={<ProtectedRoute requirePulperia><PulperiaJobs /></ProtectedRoute>} />
          <Route path="mi-pulperia/configuracion" element={<ProtectedRoute requirePulperia><PulperiaSettings /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
