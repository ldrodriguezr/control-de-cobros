import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate, isToday, isThisWeek, isOverdue, getDaysUntil } from '../utils/helpers';

export default function Dashboard() {
  const { clientes, acuerdos } = useStore();
  const [sentReminders, setSentReminders] = useState({});

  const alertas = useMemo(() => {
    return acuerdos
      .filter((a) => a.estado === 'Activo')
      .map((acuerdo) => {
        const cliente = clientes.find((c) => c.id === acuerdo.clienteId);
        if (!cliente) return null;
        let tipo = 'normal';
        let label = '';
        const dias = getDaysUntil(acuerdo.fechaProximoPago);
        if (isToday(acuerdo.fechaProximoPago)) {
          tipo = 'hoy';
          label = 'Pago Hoy';
        } else if (isOverdue(acuerdo.fechaProximoPago)) {
          tipo = 'atrasado';
          label = `Atrasado ${Math.abs(dias)} día(s)`;
        } else if (isThisWeek(acuerdo.fechaProximoPago)) {
          tipo = 'semana';
          label = `En ${dias} día(s)`;
        } else {
          label = `En ${dias} día(s)`;
        }
        return { acuerdo, cliente, tipo, label, dias };
      })
      .filter(Boolean)
      .sort((a, b) => a.dias - b.dias);
  }, [acuerdos, clientes]);

  const hoy = alertas.filter((a) => a.tipo === 'hoy');
  const semana = alertas.filter((a) => a.tipo === 'semana');
  const atrasados = alertas.filter((a) => a.tipo === 'atrasado');

  const totalAdeudado = clientes.reduce((s, c) => s + c.montoAdeudado, 0);
  const clientesActivos = clientes.length;
  const acuerdosActivos = acuerdos.filter((a) => a.estado === 'Activo').length;

  const buildMailtoLink = (cliente, acuerdo) => {
    const subject = encodeURIComponent('Recordatorio de Pago de Extras - Grupo Zen');
    const body = encodeURIComponent(
      `Estimado/a ${cliente.nombre},\n\n` +
      `Le escribimos de GRUPO ZEN para recordarle su próximo pago programado.\n\n` +
      `Detalle:\n` +
      `• Proyecto: ${cliente.proyecto}\n` +
      `• Casa: ${cliente.numeroCasa}\n` +
      `• Saldo Pendiente: ${formatCurrency(cliente.montoAdeudado)}\n` +
      `• Monto de Cuota: ${formatCurrency(acuerdo.montoCuota)}\n` +
      `• Fecha de Vencimiento: ${formatDate(acuerdo.fechaProximoPago)}\n\n` +
      `Por favor, realice su pago a la brevedad posible para mantener su cuenta al dia.\n` +
      `En caso de que haya sido gestionado el pago, le solicitamos amablemente enviarnos su comprobante para registrar su cancelacion.\n\n` +
      `Atentamente,\nGRUPO ZEN\nDepartamento de Cobro de Extras`
    );
    return `mailto:${cliente.correo || ''}?subject=${subject}&body=${body}`;
  };

  const handleEnviarRecordatorio = (cliente, acuerdo) => {
    window.open(buildMailtoLink(cliente, acuerdo), '_self');
    setSentReminders((prev) => ({ ...prev, [cliente.id]: true }));
    setTimeout(() => {
      setSentReminders((prev) => ({ ...prev, [cliente.id]: false }));
    }, 3000);
  };

  const tipoConfig = {
    hoy: { bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, iconColor: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    atrasado: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    semana: { bg: 'bg-blue-50', border: 'border-blue-200', icon: CalendarClock, iconColor: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
    normal: { bg: 'bg-gray-50', border: 'border-gray-200', icon: Bell, iconColor: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Panel de control y alertas de cobro</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clientes Registrados" value={clientesActivos} color="from-zen-600 to-zen-800" />
        <StatCard icon={DollarSign} label="Total Adeudado" value={formatCurrency(totalAdeudado)} color="from-emerald-500 to-emerald-700" />
        <StatCard icon={TrendingUp} label="Acuerdos Activos" value={acuerdosActivos} color="from-violet-500 to-violet-700" />
        <StatCard icon={AlertTriangle} label="Pagos Atrasados" value={atrasados.length} color="from-red-500 to-red-700" />
      </div>

      {/* Alert sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <AlertSection title="Pagos de Hoy" items={hoy} tipo="hoy" config={tipoConfig} sentReminders={sentReminders} onSend={handleEnviarRecordatorio} emptyText="No hay pagos programados para hoy" />
        <AlertSection title="Esta Semana" items={semana} tipo="semana" config={tipoConfig} sentReminders={sentReminders} onSend={handleEnviarRecordatorio} emptyText="No hay pagos esta semana" />
        <AlertSection title="Atrasados" items={atrasados} tipo="atrasado" config={tipoConfig} sentReminders={sentReminders} onSend={handleEnviarRecordatorio} emptyText="No hay pagos atrasados" />
      </div>

      {/* Full alert timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell size={20} className="text-zen-600" />
          <h2 className="text-lg font-semibold text-gray-900">Todas las Alertas</h2>
          <span className="ml-auto text-sm text-gray-400">{alertas.length} alertas</span>
        </div>
        <div className="divide-y divide-gray-50">
          {alertas.map((alerta) => {
            const cfg = tipoConfig[alerta.tipo];
            const Icon = cfg.icon;
            return (
              <div key={alerta.acuerdo.id} className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors`}>
                <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={20} className={cfg.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{alerta.cliente.nombre}</p>
                  <p className="text-sm text-gray-500">
                    {alerta.cliente.proyecto} · Casa {alerta.cliente.numeroCasa} · Cuota: {formatCurrency(alerta.acuerdo.montoCuota)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge} shrink-0`}>
                  {alerta.label}
                </span>
                <span className="text-sm text-gray-400 hidden sm:block shrink-0 w-28 text-right">{formatDate(alerta.acuerdo.fechaProximoPago)}</span>
                <button
                  onClick={() => handleEnviarRecordatorio(alerta.cliente, alerta.acuerdo)}
                  disabled={sentReminders[alerta.cliente.id]}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sentReminders[alerta.cliente.id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zen-600 text-white hover:bg-zen-700 shadow-sm'
                  }`}
                >
                  {sentReminders[alerta.cliente.id] ? (
                    <>
                      <CheckCircle2 size={14} /> Enviado
                    </>
                  ) : (
                    <>
                      <Mail size={14} /> Recordatorio
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function AlertSection({ title, items, tipo, config, sentReminders, onSend, emptyText }) {
  const cfg = config[tipo];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className="px-5 py-3 flex items-center gap-2 border-b border-black/5">
        <Icon size={18} className={cfg.iconColor} />
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>{items.length}</span>
      </div>
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{emptyText}</p>
        ) : (
          items.map((a) => (
            <div key={a.acuerdo.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{a.cliente.nombre}</p>
                <p className="text-xs text-gray-500">{formatCurrency(a.acuerdo.montoCuota)} · {formatDate(a.acuerdo.fechaProximoPago)}</p>
              </div>
              <button
                onClick={() => onSend(a.cliente, a.acuerdo)}
                disabled={sentReminders[a.cliente.id]}
                className={`p-2 rounded-lg transition-all ${
                  sentReminders[a.cliente.id]
                    ? 'bg-green-100 text-green-600'
                    : 'bg-zen-600 text-white hover:bg-zen-700'
                }`}
              >
                {sentReminders[a.cliente.id] ? <CheckCircle2 size={16} /> : <Mail size={16} />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
