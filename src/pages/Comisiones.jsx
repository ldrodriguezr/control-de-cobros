import { useMemo } from 'react';
import {
  Percent,
  DollarSign,
  Calendar,
  TrendingUp,
  Receipt,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const COMISION_RATE = 0.00005; // 0.005% = monto * 0.00005

export default function Comisiones() {
  const { pagos, clientes } = useStore();

  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();

  // Filter payments from the current month
  const pagosMes = useMemo(() => {
    return pagos
      .filter((p) => {
        const d = new Date(p.fecha + 'T12:00:00');
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      })
      .map((p) => ({
        ...p,
        comision: p.monto * COMISION_RATE,
        clienteNombre: clientes.find((c) => c.id === p.clienteId)?.nombre || '—',
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [pagos, clientes, mesActual, anioActual]);

  const totalRecaudado = pagosMes.reduce((s, p) => s + p.monto, 0);
  const totalComisiones = pagosMes.reduce((s, p) => s + p.comision, 0);

  const mesLabel = now.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Control de Comisiones</h1>
        <p className="text-gray-500 mt-1 capitalize">{mesLabel} · Tasa: 0.005% por pago</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total de Pagos Recaudados (Mes)"
          value={formatCurrency(totalRecaudado)}
          color="from-emerald-500 to-emerald-700"
          sub={`${pagosMes.length} pago(s) este mes`}
        />
        <SummaryCard
          icon={Percent}
          label="Total de Comisiones Generadas"
          value={formatCurrency(totalComisiones)}
          color="from-violet-500 to-violet-700"
          sub="@ 0.005% por pago"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Promedio por Pago"
          value={pagosMes.length > 0 ? formatCurrency(totalComisiones / pagosMes.length) : formatCurrency(0)}
          color="from-zen-600 to-zen-800"
          sub="Comisión promedio"
        />
      </div>

      {/* Breakdown table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Receipt size={20} className="text-zen-600" />
          <h2 className="text-lg font-semibold text-gray-900">Detalle de Pagos del Mes</h2>
          <span className="ml-auto text-sm text-gray-400">{pagosMes.length} registros</span>
        </div>

        {pagosMes.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">No hay pagos registrados este mes</p>
            <p className="text-sm text-gray-300 mt-1">Dirígase a "Registro de Pagos" para añadir abonos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Fecha</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Método</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Monto del Pago</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-600">Comisión (0.005%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagosMes.map((p, i) => (
                  <tr key={p.id} className="hover:bg-zen-50/30 transition-colors">
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{formatDate(p.fecha)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{p.clienteNombre}</p>
                      {p.notas && <p className="text-xs text-gray-400">{p.notas}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {p.metodo}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(p.monto)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-bold text-violet-700">{formatCurrency(p.comision)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50/80 font-semibold">
                  <td colSpan={3} className="px-5 py-3.5 text-gray-700">TOTAL</td>
                  <td className="px-5 py-3.5 text-right text-gray-900">{formatCurrency(totalRecaudado)}</td>
                  <td className="px-5 py-3.5 text-right text-violet-700">{formatCurrency(totalComisiones)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="bg-zen-50 border border-zen-100 rounded-2xl p-4 text-sm text-zen-800">
        <strong>Nota:</strong> La comisión se calcula automáticamente como el <strong>0.005%</strong> del monto de cada pago registrado
        en el mes actual (monto × 0.00005). Los datos se actualizan en tiempo real al registrar nuevos pagos.
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-sm text-gray-600 leading-tight">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
