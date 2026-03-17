import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider, useStore } from './data/useStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Acuerdos from './pages/Acuerdos';
import Pagos from './pages/Pagos';
import EstadoCuenta from './pages/EstadoCuenta';
import Comisiones from './pages/Comisiones';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { loading } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-zen-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Cargando datos de Supabase...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="acuerdos" element={<Acuerdos />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="estados" element={<EstadoCuenta />} />
        <Route path="estados/:id" element={<EstadoCuenta />} />
        <Route path="comisiones" element={<Comisiones />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </StoreProvider>
  );
}
