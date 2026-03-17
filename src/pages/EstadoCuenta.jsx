import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Printer,
  User,
  Building,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';

export default function EstadoCuenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientes, getCliente, getPagosByCliente, getAcuerdoByCliente } = useStore();

  // If no ID, show the client selector
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl hover:shadow-zen-600/30 transition-all hover:-translate-y-0.5"
        >
          <Printer size={18} />
          <span className="hidden sm:inline">Imprimir / Exportar</span>
        </button>
      </div>

      {/* Printable area */}
      <div className="print-area space-y-6">
        {/* Client header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-zen-800 to-zen-900 p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-xl font-bold">
                {cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 className="text-xl font-bold">{cliente.nombre}</h2>
                <p className="text-zen-200 text-sm">{cliente.cedula} · {cliente.telefono}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoPill icon={Building} label="Proyecto" value={cliente.proyecto} />
              <InfoPill icon={Building} label="Casa" value={cliente.numeroCasa} />
              <InfoPill icon={Calendar} label="Registro" value={formatDate(cliente.fechaRegistro)} />
              <InfoPill icon={CreditCard} label="Frecuencia" value={acuerdo?.frecuencia || 'N/A'} />
            </div>
          </div>

          {/* Financial summary */}
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

          {/* Progress bar */}
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

        {/* Extras */}
        {cliente.descripcionExtras && cliente.descripcionExtras !== 'Sin extras' && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
            <p className="text-sm font-semibold text-amber-800 mb-1">Detalle de Extras y Cambios / Extras & Changes</p>
            <p className="text-sm text-amber-700">{cliente.descripcionExtras}</p>
          </div>
        )}

        {/* Payment history table */}
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
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Método</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Monto Abonado / Amount Paid</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Saldo Posterior / Balance After</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagos.map((pago, i) => (
                  <tr key={pago.id} className="hover:bg-zen-50/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{formatDate(pago.fecha)}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {pago.metodo}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-green-600">{formatCurrency(pago.monto)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(pago.saldoPosterior)}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{pago.notas || '—'}</td>
                  </tr>
                ))}
                {pagos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      No se han registrado pagos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
          <p>GRUPO ZEN — Estado de Cuenta generado el {formatDate(new Date().toISOString().split('T')[0])}</p>
          <p>Account Statement generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-white/10 rounded-xl px-3 py-2">
      <p className="text-[11px] text-zen-300 flex items-center gap-1">
        <Icon size={12} />
        {label}
      </p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function ClientSelector({ clientes }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Estados de Cuenta</h1>
        <p className="text-gray-500 mt-1">Seleccione un cliente para ver su estado de cuenta</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((c) => (
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
                <p className="text-xs text-gray-500">{c.proyecto} · Casa {c.numeroCasa}</p>
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
      </div>
    </div>
  );
}
