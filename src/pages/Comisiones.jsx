import { useMemo } from 'react';
import {
  Percent,
  DollarSign,
  Calendar,
  TrendingUp,
  Home,
  Star,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate } from '../utils/helpers';

const COMISION_RATE = 0.005; // 0.5%

export default function Comisiones() {
  const { pagos, clientes } = useStore();

  const now = new Date();
  const mesActual = now.getMonth();
  const anioActual = now.getFullYear();

  // Enrich all current-month payments with client name + category
  const pagosMes = useMemo(() => {
    return pagos
      .filter((p) => {
        const d = new Date(p.fecha + 'T12:00:00');
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      })
      .map((p) => {
        const cliente = clientes.find((c) => c.id === p.clienteId);
        return {
          ...p,
          comision: p.monto * COMISION_RATE,
          clienteNombre: cliente?.nombre || '—',
          categoria: cliente?.categoria || 'Smart Living',
        };
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [pagos, clientes, mesActual, anioActual]);

  const smartLiving = pagosMes.filter((p) => p.categoria === 'Smart Living');
  const extras      = pagosMes.filter((p) => p.categoria === 'Extras');

  const totalRecaudado  = pagosMes.reduce((s, p) => s + p.monto, 0);
  const totalComisiones = pagosMes.reduce((s, p) => s + p.comision, 0);

  const mesLabel = now.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Control de Comisiones</h1>
        <p className="text-gray-500 mt-1 capitalize">{mesLabel} · Tasa: 0.5% por pago</p>
      </div>

      {/* Global summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total Recaudado (Mes)"
          value={formatCurrency(totalRecaudado)}
          color="from-emerald-500 to-emerald-700"
          sub={`${pagosMes.length} pago(s) en total`}
        />
        <SummaryCard
          icon={Percent}
          label="Total Comisiones Generadas"
          value={formatCurrency(totalComisiones)}
          color="from-violet-500 to-violet-700"
          sub="@ 0.5% por pago"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Promedio por Pago"
          value={pagosMes.length > 0 ? formatCurrency(totalComisiones / pagosMes.length) : formatCurrency(0)}
          color="from-zen-600 to-zen-800"
          sub="Comisión promedio"
        />
      </div>

      {/* SMART LIVING section */}
      <CategorySection
        title="Smart Living"
        icon={Home}
        iconColor="text-zen-600"
        badgeColor="bg-zen-100 text-zen-700"
        pagos={smartLiving}
      />

      {/* EXTRAS section */}
      <CategorySection
        title="Extras"
        icon={Star}
        iconColor="text-amber-600"
        badgeColor="bg-amber-100 text-amber-700"
        pagos={extras}
      />

      {/* Info note */}
      <div className="bg-zen-50 border border-zen-100 rounded-2xl p-4 text-sm text-zen-800">
        <strong>Nota:</strong> La comisión se calcula automáticamente como el <strong>0.5%</strong> del monto de cada
        pago registrado en el mes actual. Los datos se agrupan según la categoría asignada al cliente.
      </div>
    </div>
  );
}

// ─── Category Section ────────────────────────────────────────────────────────
function CategorySection({ title, icon: Icon, iconColor, badgeColor, pagos }) {
  const totalMonto    = pagos.reduce((s, p) => s + p.monto, 0);
  const totalComision = pagos.reduce((s, p) => s + p.comision, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Section header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Icon size={20} className={iconColor} />
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}>
          {pagos.length} pago(s)
        </span>
        <div className="ml-auto flex items-center gap-6 text-sm">
          <span className="text-gray-500">
            Recaudado: <strong className="text-gray-900">{formatCurrency(totalMonto)}</strong>
          </span>
          <span className="text-gray-500">
            Comisión: <strong className="text-violet-700">{formatCurrency(totalComision)}</strong>
          </span>
        </div>
      </div>

      {pagos.length === 0 ? (
        <div className="text-center py-10">
          <Calendar size={36} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 text-sm">No hay pagos de {title} este mes</p>
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
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Comisión (0.5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagos.map((p) => (
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
                <td colSpan={3} className="px-5 py-3.5 text-gray-700">SUBTOTAL {title.toUpperCase()}</td>
                <td className="px-5 py-3.5 text-right text-gray-900">{formatCurrency(totalMonto)}</td>
                <td className="px-5 py-3.5 text-right text-violet-700">{formatCurrency(totalComision)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
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
