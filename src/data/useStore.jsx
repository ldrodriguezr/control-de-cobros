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

      // Calcular saldo pendiente en base a los pagos
      const pagosList = pData || [];
      const pagosPorCliente = pagosList.reduce((acc, p) => {
        // Asumiendo que p.clienteId mapea a la columna en la db (o ajustamos si se llama cliente_id)
        const cId = p.clienteId || p.cliente_id; 
        acc[cId] = (acc[cId] || 0) + Number(p.monto);
        return acc;
      }, {});

      const mappedClientes = (cData || []).map(c => {
        const original = Number(c.monto_adeudado_inicial || 0);
        const pagado = pagosPorCliente[c.id] || 0;
        return {
          id: c.id,
          nombre: c.nombre_completo,
          cedula: c.cedula_pasaporte,
          telefono: c.telefono,
          correo: c.correo,
          proyecto: c.proyecto,
          numeroCasa: c.numero_casa,
          montoOriginal: original,
          montoAdeudado: Math.max(0, original - pagado),
          descripcionExtras: c.descripcion_extras,
          fechaRegistro: c.created_at || new Date().toISOString()
        };
      });

      setClientes(mappedClientes);
      setAcuerdos(aData || []);
      setPagos(pagosList);
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
    const dbCliente = {
      nombre_completo: cliente.nombre,
      cedula_pasaporte: cliente.cedula,
      telefono: cliente.telefono,
      correo: cliente.correo,
      proyecto: cliente.proyecto,
      numero_casa: cliente.numeroCasa,
      monto_adeudado_inicial: Number(cliente.montoOriginal || cliente.montoAdeudado || 0),
      descripcion_extras: cliente.descripcionExtras,
    };

    const { data, error } = await supabase
      .from('clientes')
      .insert([dbCliente])
      .select()
      .single();

    if (error) {
      console.error('Error adding cliente:', error);
      return null;
    }
    
    const nuevoUi = {
      id: data.id,
      nombre: data.nombre_completo,
      cedula: data.cedula_pasaporte,
      telefono: data.telefono,
      correo: data.correo,
      proyecto: data.proyecto,
      numeroCasa: data.numero_casa,
      montoOriginal: Number(data.monto_adeudado_inicial || 0),
      montoAdeudado: Number(data.monto_adeudado_inicial || 0),
      descripcionExtras: data.descripcion_extras,
      fechaRegistro: data.created_at || new Date().toISOString()
    };
    
    setClientes((prev) => [...prev, nuevoUi]);
    return nuevoUi;
  }, []);

  const actualizarCliente = useCallback(async (id, dataObj) => {
    const dbObj = {};
    if (dataObj.nombre !== undefined) dbObj.nombre_completo = dataObj.nombre;
    if (dataObj.cedula !== undefined) dbObj.cedula_pasaporte = dataObj.cedula;
    if (dataObj.telefono !== undefined) dbObj.telefono = dataObj.telefono;
    if (dataObj.correo !== undefined) dbObj.correo = dataObj.correo;
    if (dataObj.proyecto !== undefined) dbObj.proyecto = dataObj.proyecto;
    if (dataObj.numeroCasa !== undefined) dbObj.numero_casa = dataObj.numeroCasa;
    if (dataObj.montoOriginal !== undefined) dbObj.monto_adeudado_inicial = Number(dataObj.montoOriginal);
    if (dataObj.descripcionExtras !== undefined) dbObj.descripcion_extras = dataObj.descripcionExtras;

    // We don't persist montoAdeudado (current balance) anymore, it is computed dynamically
    if (Object.keys(dbObj).length === 0) {
      // If we only passed montoAdeudado (e.g. from registrarPago), we just update local state
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...dataObj } : c)));
      return;
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(dbObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cliente:', error);
      return null;
    }
    
    setClientes((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      return {
        ...c,
        nombre: data.nombre_completo,
        cedula: data.cedula_pasaporte,
        telefono: data.telefono,
        correo: data.correo,
        proyecto: data.proyecto,
        numeroCasa: data.numero_casa,
        montoOriginal: Number(data.monto_adeudado_inicial),
        descripcionExtras: data.descripcion_extras,
      };
    }));
    return data;
  }, []);

  const eliminarCliente = useCallback(async (id) => {
    // Si tus tablas de pagos y acuerdos_pago no tienen la columna como 'clienteId', 
    // podrías necesitar ajustar esto también. Asumo 'clienteId' para pagos y acuerdos_pago.
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
