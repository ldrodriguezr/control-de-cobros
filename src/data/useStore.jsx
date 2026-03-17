import { createContext, useContext, useState, useCallback } from 'react';
import { initialClientes, initialAcuerdos, initialPagos } from './mockData';

const StoreContext = createContext(null);

// Helper: generate unique IDs (replace with Supabase auto-IDs later)
let idCounter = 100;
const genId = (prefix) => `${prefix}${++idCounter}`;

// Helper: calculate next payment date based on frequency
export function calcularProximasFechas(fechaInicio, frecuencia, cantidad = 6) {
  const fechas = [];
  let fecha = new Date(fechaInicio + 'T12:00:00');
  for (let i = 0; i < cantidad; i++) {
    const nueva = new Date(fecha);
    if (frecuencia === 'Mensual') nueva.setMonth(nueva.getMonth() + i + 1);
    else if (frecuencia === 'Quincenal') nueva.setDate(nueva.getDate() + (i + 1) * 15);
    else if (frecuencia === 'Semanal') nueva.setDate(nueva.getDate() + (i + 1) * 7);
    fechas.push(nueva.toISOString().split('T')[0]);
  }
  return fechas;
}

export function StoreProvider({ children }) {
  const [clientes, setClientes] = useState(initialClientes);
  const [acuerdos, setAcuerdos] = useState(initialAcuerdos);
  const [pagos, setPagos] = useState(initialPagos);

  // ----- Clientes CRUD -----
  const agregarCliente = useCallback((cliente) => {
    const nuevo = { ...cliente, id: genId('c'), fechaRegistro: new Date().toISOString().split('T')[0] };
    setClientes((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const actualizarCliente = useCallback((id, data) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const eliminarCliente = useCallback((id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setAcuerdos((prev) => prev.filter((a) => a.clienteId !== id));
    setPagos((prev) => prev.filter((p) => p.clienteId !== id));
  }, []);

  // ----- Acuerdos CRUD -----
  const agregarAcuerdo = useCallback((acuerdo) => {
    const nuevo = { ...acuerdo, id: genId('a'), estado: 'Activo' };
    setAcuerdos((prev) => [...prev, nuevo]);
    return nuevo;
  }, []);

  const actualizarAcuerdo = useCallback((id, data) => {
    setAcuerdos((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  // ----- Pagos -----
  const registrarPago = useCallback((pago) => {
    const nuevo = { ...pago, id: genId('p'), fecha: new Date().toISOString().split('T')[0] };
    setPagos((prev) => [...prev, nuevo]);

    // Update client balance
    setClientes((prev) =>
      prev.map((c) =>
        c.id === pago.clienteId
          ? { ...c, montoAdeudado: Math.max(0, c.montoAdeudado - pago.monto) }
          : c
      )
    );

    // Advance next payment date on the agreement
    setAcuerdos((prev) =>
      prev.map((a) => {
        if (a.clienteId !== pago.clienteId) return a;
        const next = new Date(a.fechaProximoPago + 'T12:00:00');
        if (a.frecuencia === 'Mensual') next.setMonth(next.getMonth() + 1);
        else if (a.frecuencia === 'Quincenal') next.setDate(next.getDate() + 15);
        else if (a.frecuencia === 'Semanal') next.setDate(next.getDate() + 7);
        return { ...a, fechaProximoPago: next.toISOString().split('T')[0] };
      })
    );

    return nuevo;
  }, []);

  // ----- Queries -----
  const getCliente = useCallback((id) => clientes.find((c) => c.id === id), [clientes]);
  const getAcuerdoByCliente = useCallback((clienteId) => acuerdos.find((a) => a.clienteId === clienteId), [acuerdos]);
  const getPagosByCliente = useCallback((clienteId) => pagos.filter((p) => p.clienteId === clienteId).sort((a, b) => a.fecha.localeCompare(b.fecha)), [pagos]);

  const value = {
    clientes,
    acuerdos,
    pagos,
    agregarCliente,
    actualizarCliente,
    eliminarCliente,
    agregarAcuerdo,
    actualizarAcuerdo,
    registrarPago,
    getCliente,
    getAcuerdoByCliente,
    getPagosByCliente,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
