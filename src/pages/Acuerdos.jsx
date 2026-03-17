import { useState, useMemo } from 'react';
import {
  CalendarDays,
  CalendarClock,
  ClipboardList,
  Plus,
  Repeat,
  DollarSign,
  Check,
  User,
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
  const [editingId, setEditingId] = useState(null);

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
    const data = {
      clienteId: selectedCliente,
      frecuencia,
      montoCuota: parseFloat(montoCuota),
      fechaInicio,
      fechaProximoPago: proximasFechas[0] || fechaInicio,
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
    setEditingId(null);
  };

  const handleEdit = (acuerdo) => {
    setEditingId(acuerdo.id);
    setSelectedCliente(acuerdo.clienteId);
    setFrecuencia(acuerdo.frecuencia);
    setMontoCuota(String(acuerdo.montoCuota));
    setFechaInicio(acuerdo.fechaInicio);
    setShowForm(true);
  };

  const freqConfig = {
    Mensual: { color: 'bg-blue-100 text-blue-700', icon: CalendarDays },
    Quincenal: { color: 'bg-violet-100 text-violet-700', icon: CalendarClock },
    Semanal: { color: 'bg-emerald-100 text-emerald-700', icon: Repeat },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Acuerdos de Pago</h1>
          <p className="text-gray-500 mt-1">Asignación y gestión de planes de pago</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl hover:shadow-zen-600/30 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} />
          Nuevo Acuerdo
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-zen-600" />
            {editingId ? 'Editar Acuerdo' : 'Nuevo Acuerdo de Pago'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Client selector */}
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
                  <option key={c.id} value={c.id}>
                    {c.nombre} — {c.proyecto}
                  </option>
                ))}
              </select>
            </div>

            {/* Frequency */}
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
              </select>
            </div>

            {/* Amount */}
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

            {/* Start date */}
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
          </div>

          {/* Preview next dates */}
          {proximasFechas.length > 0 && (
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

      {/* Agreements list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {acuerdos.map((acuerdo) => {
          const cliente = clientes.find((c) => c.id === acuerdo.clienteId);
          if (!cliente) return null;
          const cfg = freqConfig[acuerdo.frecuencia] || freqConfig.Mensual;
          const FreqIcon = cfg.icon;
          const proximas = calcularProximasFechas(acuerdo.fechaProximoPago, acuerdo.frecuencia, 3);

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

      {acuerdos.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
          <p>No hay acuerdos de pago registrados</p>
        </div>
      )}
    </div>
  );
}
