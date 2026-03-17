import { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Users,
  Building,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const emptyForm = {
  nombre: '',
  cedula: '',
  telefono: '',
  proyecto: '',
  numeroCasa: '',
  montoAdeudado: '',
  descripcionExtras: '',
};

export default function Clientes() {
  const { clientes, agregarCliente, getAcuerdoByCliente } = useStore();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    let list = clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.cedula.toLowerCase().includes(search.toLowerCase()) ||
        c.proyecto.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number') return sortDir === 'asc' ? valA - valB : valB - valA;
      return sortDir === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
    return list;
  }, [clientes, search, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    agregarCliente({
      ...form,
      montoOriginal: parseFloat(form.montoAdeudado) || 0,
      montoAdeudado: parseFloat(form.montoAdeudado) || 0,
    });
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gestión y registro de clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl hover:shadow-zen-600/30 transition-all hover:-translate-y-0.5"
        >
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slide-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserPlus size={20} className="text-zen-600" />
            Registrar Nuevo Cliente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField label="Nombre del Cliente" name="nombre" value={form.nombre} onChange={handleChange} icon={Users} required />
            <InputField label="Cédula o Pasaporte" name="cedula" value={form.cedula} onChange={handleChange} icon={CreditCard} required />
            <InputField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} icon={Phone} />
            <InputField label="Proyecto" name="proyecto" value={form.proyecto} onChange={handleChange} icon={Building} required />
            <InputField label="Número de Casa" name="numeroCasa" value={form.numeroCasa} onChange={handleChange} icon={Building} required />
            <InputField label="Monto Adeudado ($)" name="montoAdeudado" value={form.montoAdeudado} onChange={handleChange} icon={CreditCard} type="number" required />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Extras</label>
            <textarea
              name="descripcionExtras"
              value={form.descripcionExtras}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm resize-none"
              placeholder="Detalles de extras y modificaciones..."
            />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all text-sm"
            >
              Guardar Cliente
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o proyecto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                {[
                  { key: 'nombre', label: 'Cliente' },
                  { key: 'cedula', label: 'Cédula' },
                  { key: 'proyecto', label: 'Proyecto' },
                  { key: 'numeroCasa', label: 'Casa' },
                  { key: 'montoAdeudado', label: 'Saldo' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-5 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:bg-gray-100/60 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {label} <SortIcon field={key} />
                    </span>
                  </th>
                ))}
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Acuerdo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => {
                const acuerdo = getAcuerdoByCliente(c.id);
                return (
                  <tr key={c.id} className="hover:bg-zen-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{c.nombre}</p>
                      <p className="text-xs text-gray-400">{c.telefono}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.cedula}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.proyecto}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.numeroCasa}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${c.montoAdeudado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(c.montoAdeudado)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {acuerdo ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          {acuerdo.frecuencia}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          Sin acuerdo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/estados/${c.id}`)}
                        className="p-2 rounded-lg hover:bg-zen-50 text-zen-600 transition-colors"
                        title="Ver estado de cuenta"
                      >
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />}
        <input
          {...props}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm`}
        />
      </div>
    </div>
  );
}
