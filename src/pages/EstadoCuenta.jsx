import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Printer,
  Building,
  Calendar,
  CreditCard,
  TrendingDown,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Trash2,
  Receipt,
  X,
  Building2,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function EstadoCuenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientes, getCliente, getPagosByCliente, getAcuerdoByCliente, eliminarPago } = useStore();

  const [showRecibo, setShowRecibo] = useState(null);

  if (!id) {
    return <ClientSelector clientes={clientes} />;
  }

  const cliente = getCliente(id);
  if (!cliente) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">Cliente no encontrado</p>
        <button onClick={() => navigate('/estados')} className="text-zen-600 font-medium hover:underline">
          Volver a la lista
        </button>
      </div>
    );
  }

  const pagos = getPagosByCliente(id);
  const acuerdo = getAcuerdoByCliente(id);
  const totalAbonado = cliente.montoOriginal - cliente.montoAdeudado;
  const porcentajePagado = cliente.montoOriginal > 0 ? (totalAbonado / cliente.montoOriginal) * 100 : 0;

  const handleEliminarPago = async (pago) => {
    if (!window.confirm(`¿Eliminar este pago de ${formatCurrency(pago.monto)} del ${formatDate(pago.fecha)}? Esta acción recalculará el saldo del cliente.`)) return;
    await eliminarPago(pago.id);
  };

  const handleVerRecibo = (pago) => {
    setShowRecibo({
      id: pago.id,
      monto: pago.monto,
      fecha: pago.fecha,
      saldoPosterior: pago.saldoPosterior,
      metodo: pago.metodo,
      clienteNombre: cliente.nombre,
      clienteCedula: cliente.cedula,
      proyecto: cliente.proyecto,
      numeroCasa: cliente.numeroCasa,
      descripcionExtras: cliente.descripcionExtras,
      montoAnterior: pago.saldoPosterior + pago.monto,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 no-print">
        <button onClick={() => navigate('/estados')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={22} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estado de Cuenta</h1>
          <p className="text-gray-500 mt-0.5">Account Statement</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          <Printer size={18} />
          <span className="hidden sm:inline">Imprimir / Exportar</span>
        </button>
      </div>

      <div className="print-area space-y-6">
        {/* Client header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-zen-800 to-zen-900 p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-xl font-bold">
                {cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{cliente.nombre}</h2>
                <p className="text-zen-200 text-sm">{cliente.cedula} · {cliente.telefono}</p>
                {cliente.correo && <p className="text-zen-300 text-sm">{cliente.correo}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoPill icon={Building} label="Proyecto" value={cliente.proyecto} />
              <InfoPill icon={Building} label="Casa" value={cliente.numeroCasa} />
              <InfoPill icon={Calendar} label="Registro" value={formatDate(cliente.fechaRegistro)} />
              <InfoPill icon={CreditCard} label="Frecuencia" value={acuerdo?.frecuencia || 'N/A'} />
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-500 font-medium">Monto Original</p>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(cliente.montoOriginal)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-xs text-green-500 font-medium">Total Abonado</p>
              <p className="text-xl font-bold text-green-700">{formatCurrency(totalAbonado)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-xs text-red-500 font-medium">Saldo Pendiente</p>
              <p className="text-xl font-bold text-red-700">{formatCurrency(cliente.montoAdeudado)}</p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-600">Progreso de Pago</span>
              <span className="font-semibold text-zen-700">{porcentajePagado.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-zen-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${porcentajePagado}%` }}
              />
            </div>
          </div>
        </div>

        {cliente.descripcionExtras && cliente.descripcionExtras !== 'Sin extras' && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <p className="text-sm font-semibold text-amber-800 mb-1">Detalle de Extras y Cambios / Extras &amp; Changes</p>
            <p className="text-sm text-amber-700">{cliente.descripcionExtras}</p>
          </div>
        )}

        {/* Payment history */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingDown size={20} className="text-zen-600" />
            <h3 className="text-lg font-semibold text-gray-900">Historial de Abonos / Payment History</h3>
            <span className="ml-auto text-sm text-gray-400">{pagos.length} pagos</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Fecha / Date</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Monto Abonado</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Saldo Posterior</th>
                  <th className="px-5 py-3 text-center font-semibold text-gray-600 no-print">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map((pago, i) => (
                  <tr key={pago.id} className="hover:bg-zen-50/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{formatDate(pago.fecha)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-green-600">{formatCurrency(pago.monto)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(pago.saldoPosterior)}</td>
                    <td className="px-5 py-3 no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleVerRecibo(pago)}
                          className="p-1.5 rounded-lg hover:bg-zen-50 text-zen-600 transition-colors"
                          title="Ver recibo / PDF"
                        >
                          <Receipt size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminarPago(pago)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Eliminar pago"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400">No se han registrado pagos</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          <p>GRUPO ZEN — Estado de Cuenta generado el {formatDate(new Date().toISOString().split('T')[0])}</p>
          <p>Account Statement generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Receipt Modal */}
      {showRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowRecibo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between no-print">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt size={20} className="text-zen-600" />
                Recibo de Pago / Receipt of Payment
              </h3>
              <button onClick={() => setShowRecibo(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="print-area p-6 space-y-5">
              <div className="text-center border-b border-gray-200 pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 size={28} className="text-zen-700" />
                  <h2 className="text-2xl font-bold text-zen-900">GRUPO ZEN</h2>
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Recibo de Pago / Receipt of Payment</h3>
                <p className="text-sm text-gray-500 mt-1">No. {showRecibo.id} · {formatDate(showRecibo.fecha)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Cliente / Client</p><p className="font-semibold text-gray-900">{showRecibo.clienteNombre}</p></div>
                <div><p className="text-gray-500">Cédula / ID</p><p className="font-semibold text-gray-900">{showRecibo.clienteCedula}</p></div>
                <div><p className="text-gray-500">Proyecto / Project</p><p className="font-semibold text-gray-900">{showRecibo.proyecto}</p></div>
                <div><p className="text-gray-500">Casa / House No.</p><p className="font-semibold text-gray-900">{showRecibo.numeroCasa}</p></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saldo Anterior / Previous Balance</span>
                  <span className="font-semibold">{formatCurrency(showRecibo.montoAnterior)}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-gray-200 pb-3">
                  <span className="text-gray-600">Monto Abonado / Amount Paid</span>
                  <span className="font-bold text-green-600">{formatCurrency(showRecibo.monto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Saldo Pendiente / Remaining Balance</span>
                  <span className="text-lg font-bold text-zen-700">{formatCurrency(showRecibo.saldoPosterior)}</span>
                </div>
              </div>
              {showRecibo.descripcionExtras && showRecibo.descripcionExtras !== 'Sin extras' && (
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Detalle de Extras / Extras Detail</p>
                  <p className="text-gray-800 bg-amber-50 rounded-lg p-3 border border-amber-100">{showRecibo.descripcionExtras}</p>
                </div>
              )}
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                <p>Este documento es un comprobante de pago oficial de GRUPO ZEN.</p>
                <p>This document is an official payment receipt from GRUPO ZEN.</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 no-print">
              <button onClick={() => setShowRecibo(null)} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors border border-gray-200">
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2">
      <p className="text-[11px] text-zen-300 flex items-center gap-1"><Icon size={12} />{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function ClientSelector({ clientes }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.cedula.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estados de Cuenta</h1>
          <p className="text-gray-500 mt-1">Seleccione un cliente para ver su estado de cuenta</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'grid' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={16} /><span className="hidden sm:inline">Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} /><span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o cédula..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
        />
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/estados/${c.id}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-zen-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zen-600 to-zen-800 flex items-center justify-center text-white font-bold text-sm">
                  {c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-zen-700 transition-colors">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.cedula}</p>
                  <p className="text-xs text-gray-400">{c.proyecto} · Casa {c.numeroCasa}</p>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-zen-600 transition-colors shrink-0" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">Saldo:</span>
                <span className={`font-bold ${c.montoAdeudado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(c.montoAdeudado)}
                </span>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <Search size={36} className="mx-auto mb-2 opacity-40" />
              <p>No se encontraron clientes con "{search}"</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Cliente</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Proyecto</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Saldo</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-zen-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-400">{c.cedula}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{c.proyecto} · Casa {c.numeroCasa}</td>
                  <td className={`px-5 py-3.5 text-right font-bold ${c.montoAdeudado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(c.montoAdeudado)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link to={`/estados/${c.id}`} className="flex items-center gap-1 text-xs font-medium text-zen-600 hover:text-zen-800 hover:underline whitespace-nowrap">
                      Ver estado <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
