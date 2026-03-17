import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StoreContext = createContext(null);

// ============================================================
// Mapping helpers: snake_case (DB) ↔ camelCase (UI)
// ============================================================

function mapClienteFromDb(c, pagadoTotal = 0) {
  const original = Number(c.monto_adeudado_inicial || 0);
  return {
    id: c.id,
    nombre: c.nombre_completo,
    cedula: c.cedula_pasaporte,
    telefono: c.telefono,
    correo: c.correo,
    proyecto: c.proyecto,
    numeroCasa: c.numero_casa,
    montoOriginal: original,
    montoAdeudado: Math.max(0, original - pagadoTotal),
    descripcionExtras: c.descripcion_extras,
    fechaRegistro: c.created_at || new Date().toISOString(),
  };
}

function mapClienteToDb(ui) {
  return {
    nombre_completo: ui.nombre,
    cedula_pasaporte: ui.cedula,
    telefono: ui.telefono,
    correo: ui.correo,
    proyecto: ui.proyecto,
    numero_casa: ui.numeroCasa,
    monto_adeudado_inicial: Number(ui.montoOriginal || ui.montoAdeudado || 0),
    descripcion_extras: ui.descripcionExtras,
  };
}

function mapAcuerdoFromDb(a) {
  return {
    id: a.id,
    clienteId: a.cliente_id,
    frecuencia: a.frecuencia,
    montoCuota: Number(a.monto_cuota || 0),
    diaCorte: a.dia_corte,
    fechaProximoPago: a.dia_corte, // use dia_corte as the "próximo pago" reference
    estado: a.estado || 'Activo',
    createdAt: a.created_at,
  };
}

function mapAcuerdoToDb(ui) {
  return {
    cliente_id: ui.clienteId,
    frecuencia: ui.frecuencia,
    monto_cuota: Number(ui.montoCuota || 0),
    dia_corte: ui.fechaInicio || ui.diaCorte || ui.fechaProximoPago,
  };
}

function mapPagoFromDb(p) {
  return {
    id: p.id,
    clienteId: p.cliente_id,
    monto: Number(p.monto_abonado || 0),
    comisionGenerada: Number(p.comision_generada || 0),
    saldoPosterior: Number(p.saldo_restante_momento_pago || 0),
    metodo: p.metodo || '',
    notas: p.notas || '',
    fecha: p.created_at ? p.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

// ============================================================
// Helper: calculate next payment dates based on frequency
// ============================================================
export function calcularProximasFechas(fechaInicio, frecuencia, cantidad = 6) {
  if (!fechaInicio) return [];
  const fechas = [];
  let fecha = new Date(fechaInicio + 'T12:00:00');
  if (isNaN(fecha.getTime())) return [];
  for (let i = 0; i < cantidad; i++) {
    const nueva = new Date(fecha);
    if (frecuencia === 'Mensual') nueva.setMonth(nueva.getMonth() + i + 1);
    else if (frecuencia === 'Quincenal') nueva.setDate(nueva.getDate() + (i + 1) * 15);
    else if (frecuencia === 'Semanal') nueva.setDate(nueva.getDate() + (i + 1) * 7);
    fechas.push(nueva.toISOString().split('T')[0]);
  }
  return fechas;
}

// ============================================================
// Store Provider
// ============================================================
export function StoreProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [acuerdos, setAcuerdos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Load all data ----
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
        supabase.from('pagos').select('*').order('created_at', { ascending: false }),
      ]);

      if (cErr) console.error('Error fetching clientes:', cErr);
      if (aErr) console.error('Error fetching acuerdos:', aErr);
      if (pErr) console.error('Error fetching pagos:', pErr);

      // Map pagos
      const mappedPagos = (pData || []).map(mapPagoFromDb);

      // Calculate total paid per client
      const pagadoPorCliente = mappedPagos.reduce((acc, p) => {
        acc[p.clienteId] = (acc[p.clienteId] || 0) + p.monto;
        return acc;
      }, {});

      // Map clientes with balance
      const mappedClientes = (cData || []).map(c =>
        mapClienteFromDb(c, pagadoPorCliente[c.id] || 0)
      );

      // Map acuerdos
      const mappedAcuerdos = (aData || []).map(mapAcuerdoFromDb);

      setClientes(mappedClientes);
      setAcuerdos(mappedAcuerdos);
      setPagos(mappedPagos);
    } catch (e) {
      console.error('Error in loadData:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================
  // Clientes CRUD
  // ============================================================
  const agregarCliente = useCallback(async (cliente) => {
    const dbCliente = mapClienteToDb(cliente);

    const { data, error } = await supabase
      .from('clientes')
      .insert([dbCliente])
      .select()
      .single();

    if (error) {
      console.error('Error adding cliente:', error);
      return null;
    }

    const nuevoUi = mapClienteFromDb(data, 0);
    setClientes((prev) => [...prev, nuevoUi]);
    return nuevoUi;
  }, []);

  const actualizarCliente = useCallback(async (id, dataObj) => {
    // Build DB object only with changed fields
    const dbObj = {};
    if (dataObj.nombre !== undefined) dbObj.nombre_completo = dataObj.nombre;
    if (dataObj.cedula !== undefined) dbObj.cedula_pasaporte = dataObj.cedula;
    if (dataObj.telefono !== undefined) dbObj.telefono = dataObj.telefono;
    if (dataObj.correo !== undefined) dbObj.correo = dataObj.correo;
    if (dataObj.proyecto !== undefined) dbObj.proyecto = dataObj.proyecto;
    if (dataObj.numeroCasa !== undefined) dbObj.numero_casa = dataObj.numeroCasa;
    if (dataObj.montoOriginal !== undefined) dbObj.monto_adeudado_inicial = Number(dataObj.montoOriginal);
    if (dataObj.descripcionExtras !== undefined) dbObj.descripcion_extras = dataObj.descripcionExtras;

    // montoAdeudado is computed, not persisted
    if (Object.keys(dbObj).length === 0) {
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
    // Delete related records first (using snake_case column name)
    await supabase.from('pagos').delete().eq('cliente_id', id);
    await supabase.from('acuerdos_pago').delete().eq('cliente_id', id);
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

  // ============================================================
  // Acuerdos CRUD
  // ============================================================
  const agregarAcuerdo = useCallback(async (acuerdo) => {
    const dbAcuerdo = mapAcuerdoToDb(acuerdo);

    const { data, error } = await supabase
      .from('acuerdos_pago')
      .insert([dbAcuerdo])
      .select()
      .single();

    if (error) {
      console.error('Error adding acuerdo:', error);
      return null;
    }
    const nuevoUi = mapAcuerdoFromDb(data);
    setAcuerdos((prev) => [...prev, nuevoUi]);
    return nuevoUi;
  }, []);

  const actualizarAcuerdo = useCallback(async (id, dataObj) => {
    const dbObj = {};
    if (dataObj.clienteId !== undefined) dbObj.cliente_id = dataObj.clienteId;
    if (dataObj.frecuencia !== undefined) dbObj.frecuencia = dataObj.frecuencia;
    if (dataObj.montoCuota !== undefined) dbObj.monto_cuota = Number(dataObj.montoCuota);
    if (dataObj.fechaInicio !== undefined || dataObj.diaCorte !== undefined || dataObj.fechaProximoPago !== undefined) {
      dbObj.dia_corte = dataObj.fechaInicio || dataObj.diaCorte || dataObj.fechaProximoPago;
    }

    const { data, error } = await supabase
      .from('acuerdos_pago')
      .update(dbObj)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating acuerdo:', error);
      return null;
    }
    const updated = mapAcuerdoFromDb(data);
    setAcuerdos((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  // ============================================================
  // Pagos
  // ============================================================
  const registrarPago = useCallback(async (pago) => {
    const montoAbonado = Number(pago.monto);
    const comisionGenerada = montoAbonado * 0.005;
    const saldoRestante = Number(pago.saldoPosterior || 0);

    const dbPago = {
      cliente_id: pago.clienteId,
      monto_abonado: montoAbonado,
      comision_generada: comisionGenerada,
      saldo_restante_momento_pago: saldoRestante,
      metodo: pago.metodo || '',
      notas: pago.notas || '',
    };

    const { data, error } = await supabase
      .from('pagos')
      .insert([dbPago])
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      return null;
    }

    const nuevoUi = mapPagoFromDb(data);
    setPagos((prev) => [nuevoUi, ...prev]);

    // Update local client balance optimistically
    setClientes((prev) => prev.map((c) => {
      if (c.id !== pago.clienteId) return c;
      return { ...c, montoAdeudado: Math.max(0, c.montoAdeudado - montoAbonado) };
    }));

    // Advance next payment date on the agreement
    const acuerdo = acuerdos.find((a) => a.clienteId === pago.clienteId);
    if (acuerdo) {
      const next = new Date(acuerdo.fechaProximoPago + 'T12:00:00');
      if (acuerdo.frecuencia === 'Mensual') next.setMonth(next.getMonth() + 1);
      else if (acuerdo.frecuencia === 'Quincenal') next.setDate(next.getDate() + 15);
      else if (acuerdo.frecuencia === 'Semanal') next.setDate(next.getDate() + 7);

      await actualizarAcuerdo(acuerdo.id, {
        fechaProximoPago: next.toISOString().split('T')[0],
      });
    }

    return nuevoUi;
  }, [acuerdos, actualizarAcuerdo]);

  // ============================================================
  // Query helpers
  // ============================================================
  const getCliente = useCallback(
    (id) => clientes.find((c) => c.id === id) || clientes.find((c) => String(c.id) === String(id)),
    [clientes]
  );
  const getAcuerdoByCliente = useCallback(
    (clienteId) => acuerdos.find((a) => a.clienteId === clienteId) || acuerdos.find((a) => String(a.clienteId) === String(clienteId)),
    [acuerdos]
  );
  const getPagosByCliente = useCallback(
    (clienteId) =>
      pagos
        .filter((p) => p.clienteId === clienteId || String(p.clienteId) === String(clienteId))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [pagos]
  );

  // ============================================================
  // Context value
  // ============================================================
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
