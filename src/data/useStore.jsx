import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext(null);


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
  const [clientes, setClientes] = useState([]);
  const [acuerdos, setAcuerdos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: cData, error: cErr },
        { data: aData, error: aErr },
        { data: pData, error: pErr },
      ] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('acuerdos_pago').select('*'),
        supabase.from('pagos').select('*').order('fecha', { ascending: false }),
      ]);

      if (cErr) console.error('Error fetching clientes:', cErr);
      if (aErr) console.error('Error fetching acuerdos:', aErr);
      if (pErr) console.error('Error fetching pagos:', pErr);

      setClientes(cData || []);
      setAcuerdos(aData || []);
      setPagos(pData || []);
    } catch (e) {
      console.error('Error in loadData:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----- Clientes CRUD -----
  const agregarCliente = useCallback(async (cliente) => {
    // We add fechaRegistro dynamically in the client, or let DB handle it. Assuming client.
    const nuevCliente = { 
      ...cliente, 
      fechaRegistro: new Date().toISOString().split('T')[0] 
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert([nuevCliente])
      .select()
      .single();

    if (error) {
      console.error('Error adding cliente:', error);
      return null;
    }
    setClientes((prev) => [...prev, data]);
    return data;
  }, []);

  const actualizarCliente = useCallback(async (id, dataObj) => {
    const { data, error } = await supabase
      .from('clientes')
      .update(dataObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cliente:', error);
      return null;
    }
    setClientes((prev) => prev.map((c) => (c.id === id ? data : c)));
    return data;
  }, []);

  const eliminarCliente = useCallback(async (id) => {
    // It's possible we need to delete agreements and payments first if there are no cascading deletes.
    await supabase.from('pagos').delete().eq('clienteId', id);
    await supabase.from('acuerdos_pago').delete().eq('clienteId', id);
    const { error } = await supabase.from('clientes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting cliente:', error);
      return false;
    }
    setClientes((prev) => prev.filter((c) => c.id !== id));
    setAcuerdos((prev) => prev.filter((a) => a.clienteId !== id));
    setPagos((prev) => prev.filter((p) => p.clienteId !== id));
    return true;
  }, []);

  // ----- Acuerdos CRUD -----
  const agregarAcuerdo = useCallback(async (acuerdo) => {
    const nuevoAcuerdo = { ...acuerdo, estado: 'Activo' };
    const { data, error } = await supabase
      .from('acuerdos_pago')
      .insert([nuevoAcuerdo])
      .select()
      .single();

    if (error) {
      console.error('Error adding acuerdo:', error);
      return null;
    }
    setAcuerdos((prev) => [...prev, data]);
    return data;
  }, []);

  const actualizarAcuerdo = useCallback(async (id, dataObj) => {
    const { data, error } = await supabase
      .from('acuerdos_pago')
      .update(dataObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating acuerdo:', error);
      return null;
    }
    setAcuerdos((prev) => prev.map((a) => (a.id === id ? data : a)));
    return data;
  }, []);

  // ----- Pagos -----
  const registrarPago = useCallback(async (pago) => {
    const nuevoPago = { ...pago, fecha: new Date().toISOString().split('T')[0] };
    
    const { data, error } = await supabase
      .from('pagos')
      .insert([nuevoPago])
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      return null;
    }
    
    // Refresh all data to ensure we have the correct balances if triggering logic exists on DB,
    // otherwise update local state optimistically.
    setPagos((prev) => [data, ...prev]);

    // Update client balance in DB
    const cliente = clientes.find((c) => c.id === pago.clienteId);
    if (cliente) {
      const newBalance = Math.max(0, cliente.montoAdeudado - pago.monto);
      await actualizarCliente(cliente.id, { montoAdeudado: newBalance });
    }

    // Advance next payment date on the agreement
    const acuerdo = acuerdos.find((a) => a.clienteId === pago.clienteId);
    if (acuerdo) {
      const next = new Date(acuerdo.fechaProximoPago + 'T12:00:00');
      if (acuerdo.frecuencia === 'Mensual') next.setMonth(next.getMonth() + 1);
      else if (acuerdo.frecuencia === 'Quincenal') next.setDate(next.getDate() + 15);
      else if (acuerdo.frecuencia === 'Semanal') next.setDate(next.getDate() + 7);
      
      await actualizarAcuerdo(acuerdo.id, { 
        fechaProximoPago: next.toISOString().split('T')[0] 
      });
    }

    return data;
  }, [clientes, acuerdos, actualizarCliente, actualizarAcuerdo]);

  // ----- Queries -----
  const getCliente = useCallback((id) => clientes.find((c) => c.id === id) || clientes.find((c) => c.id == id), [clientes]);
  const getAcuerdoByCliente = useCallback((clienteId) => acuerdos.find((a) => a.clienteId === clienteId) || acuerdos.find((a) => a.clienteId == clienteId), [acuerdos]);
  const getPagosByCliente = useCallback((clienteId) => pagos.filter((p) => p.clienteId === clienteId || p.clienteId == clienteId).sort((a, b) => a.fecha.localeCompare(b.fecha)), [pagos]);

  const value = {
    clientes,
    acuerdos,
    pagos,
    loading,
    refetch: loadData,
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
