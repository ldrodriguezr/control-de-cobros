import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './data/useStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Acuerdos from './pages/Acuerdos';
import Pagos from './pages/Pagos';
import EstadoCuenta from './pages/EstadoCuenta';

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="acuerdos" element={<Acuerdos />} />
            <Route path="pagos" element={<Pagos />} />
            <Route path="estados" element={<EstadoCuenta />} />
            <Route path="estados/:id" element={<EstadoCuenta />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
