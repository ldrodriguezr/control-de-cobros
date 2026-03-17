import { useState, useMemo } from 'react';
import {
  CalendarDays,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  Plus,
  Repeat,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import { useStore, calcularProximasFechas } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function Acuerdos() {
  const { clientes, acuerdos, agregarAcuerdo, actualizarAcuerdo, getAcuerdoByCliente } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [frecuencia, setFrecuencia] = useState('Mensual');
  const [montoCuota, setMontoCuota] = useState('');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechasPersonalizadas, setFechasPersonalizadas] = useState(['']);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const clientesSinAcuerdo = useMemo(() => {
    const conAcuerdo = new Set(acuerdos.map((a) => a.clienteId));
    return clientes.filter((c) => !conAcuerdo.has(c.id));
  }, [clientes, acuerdos]);

  const proximasFechas = useMemo(() => {
    if (!fechaInicio || !frecuencia) return [];
    return calcularProximasFechas(fechaInicio, frecuencia, 6);
  }, [fechaInicio, frecuencia]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isCustom = frecuencia === 'Personalizado';
    const cleanFechas = fechasPersonalizadas.filter(f => f.trim() !== '');
    const data = {
      clienteId: selectedCliente,
      frecuencia,
      montoCuota: parseFloat(montoCuota),
      fechaInicio: isCustom ? undefined : fechaInicio,
      fechaProximoPago: isCustom ? undefined : (proximasFechas[0] || fechaInicio),
      fechasEspecificas: isCustom ? cleanFechas : null,
    };
    if (editingId) {
      actualizarAcuerdo(editingId, data);
    } else {
      agregarAcuerdo(data);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedCliente('');
    setFrecuencia('Mensual');
    setMontoCuota('');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechasPersonalizadas(['']);
    setEditingId(null);
  };

  const handleEdit = (acuerdo) => {
    setEditingId(acuerdo.id);
    setSelectedCliente(acuerdo.clienteId);
    setFrecuencia(acuerdo.frecuencia);
    setMontoCuota(String(acuerdo.montoCuota));
    if (acuerdo.frecuencia === 'Personalizado') {
      setFechasPersonalizadas(acuerdo.fechasEspecificas && acuerdo.fechasEspecificas.length > 0 ? [...acuerdo.fechasEspecificas] : ['']);
    } else {
      setFechaInicio(acuerdo.fechaProximoPago || new Date().toISOString().split('T')[0]);
    }
    setShowForm(true);
  };

  const addFechaPersonalizada = () => setFechasPersonalizadas(prev => [...prev, '']);
  const removeFechaPersonalizada = (index) => setFechasPersonalizadas(prev => prev.filter((_, i) => i !== index));
  const updateFechaPersonalizada = (index, value) => setFechasPersonalizadas(prev => prev.map((f, i) => i === index ? value : f));

  const freqConfig = {
    Mensual: { color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', icon: CalendarDays },
    Quincenal: { color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', icon: CalendarClock },
    Semanal: { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', icon: Repeat },
    Personalizado: { color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', icon: CalendarPlus },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Acuerdos de Pago</h1>
          <p className="text-gray-500 mt-1">Asignación y gestión de planes de pago</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={16} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl hover:shadow-zen-600/30 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nuevo Acuerdo
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-zen-600" />
            {editingId ? 'Editar Acuerdo' : 'Nuevo Acuerdo de Pago'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm bg-white"
              >
                <option value="">Seleccionar cliente...</option>
                {(editingId ? clientes : clientesSinAcuerdo).map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre} — {c.proyecto}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
              <select
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm bg-white"
              >
                <option value="Mensual">Mensual</option>
                <option value="Quincenal">Quincenal</option>
                <option value="Semanal">Semanal</option>
                <option value="Personalizado">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto de Cuota ($)</label>
              <input
                type="number"
                value={montoCuota}
                onChange={(e) => setMontoCuota(e.target.value)}
                required
                min="1"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
                placeholder="0.00"
              />
            </div>
            {frecuencia !== 'Personalizado' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
                />
              </div>
            )}
          </div>

          {/* Custom dates for Personalizado */}
          {frecuencia === 'Personalizado' && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                <CalendarPlus size={16} />
                Fechas de Pago Personalizadas
              </p>
              <div className="space-y-2">
                {fechasPersonalizadas.map((fecha, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => updateFechaPersonalizada(index, e.target.value)}
                      required
                      className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm bg-white"
                    />
                    {fechasPersonalizadas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFechaPersonalizada(index)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                        title="Eliminar fecha"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFechaPersonalizada}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-700 bg-white hover:bg-amber-50 rounded-xl border border-amber-200 transition-colors"
              >
                <Plus size={16} />
                Agregar otra fecha
              </button>
            </div>
          )}

          {frecuencia !== 'Personalizado' && proximasFechas.length > 0 && (
            <div className="mt-4 p-4 bg-zen-50 rounded-xl border border-zen-100">
              <p className="text-sm font-medium text-zen-800 mb-2 flex items-center gap-2">
                <CalendarClock size={16} />
                Próximas fechas de pago:
              </p>
              <div className="flex flex-wrap gap-2">
                {proximasFechas.map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-white rounded-lg text-sm text-zen-700 shadow-sm border border-zen-100 font-medium">
                    {formatDate(f)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all text-sm">
              {editingId ? 'Actualizar' : 'Crear Acuerdo'}
            </button>
          </div>
        </form>
      )}

      {/* ===== GRID VIEW ===== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {acuerdos.map((acuerdo) => {
            const cliente = clientes.find((c) => c.id === acuerdo.clienteId);
            if (!cliente) return null;
            const cfg = freqConfig[acuerdo.frecuencia] || freqConfig.Mensual;
            const FreqIcon = cfg.icon;
            const proximas = acuerdo.frecuencia === 'Personalizado'
              ? (acuerdo.fechasEspecificas || []).sort()
              : calcularProximasFechas(acuerdo.fechaProximoPago, acuerdo.frecuencia, 3);

            return (
              <div key={acuerdo.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zen-600 to-zen-800 flex items-center justify-center text-white font-bold text-sm">
                      {cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      <p className="text-xs text-gray-500">{cliente.proyecto} · Casa {cliente.numeroCasa}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${cfg.color}`}>
                    <FreqIcon size={14} />
                    {acuerdo.frecuencia}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Cuota</p>
                    <p className="font-bold text-gray-900">{formatCurrency(acuerdo.montoCuota)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Saldo</p>
                    <p className="font-bold text-red-600">{formatCurrency(cliente.montoAdeudado)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Próx. Pago</p>
                    <p className="font-bold text-zen-700 text-xs">{formatDate(acuerdo.fechaProximoPago)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {proximas.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 bg-zen-50 border border-zen-100 rounded text-[11px] text-zen-600 font-medium">
                      {formatDate(f)}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleEdit(acuerdo)}
                  className="w-full py-2 text-sm font-medium text-zen-600 bg-zen-50 hover:bg-zen-100 rounded-xl transition-colors"
                >
                  Editar Acuerdo
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Proyecto</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Frecuencia</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Cuota</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Saldo</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Próx. Pago</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Siguientes Fechas</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {acuerdos.map((acuerdo) => {
                  const cliente = clientes.find((c) => c.id === acuerdo.clienteId);
                  if (!cliente) return null;
                  const cfg = freqConfig[acuerdo.frecuencia] || freqConfig.Mensual;
                  const proximas = acuerdo.frecuencia === 'Personalizado'
                    ? (acuerdo.fechasEspecificas || []).sort()
                    : calcularProximasFechas(acuerdo.fechaProximoPago, acuerdo.frecuencia, 3);

                  return (
                    <tr key={acuerdo.id} className="hover:bg-zen-50/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zen-600 to-zen-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {cliente.proyecto}<br />
                        <span className="text-xs text-gray-400">Casa {cliente.numeroCasa}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                          {acuerdo.frecuencia}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(acuerdo.montoCuota)}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-red-600">{formatCurrency(cliente.montoAdeudado)}</td>
                      <td className="px-5 py-3.5 font-medium text-zen-700">{formatDate(acuerdo.fechaProximoPago)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-1 flex-wrap">
                          {proximas.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zen-50 border border-zen-100 rounded text-[10px] text-zen-600 font-medium">
                              {formatDate(f)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleEdit(acuerdo)}
                          className="text-xs font-medium text-zen-600 hover:text-zen-800 hover:underline whitespace-nowrap"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {acuerdos.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
          <p>No hay acuerdos de pago registrados</p>
        </div>
      )}
    </div>
  );
}
