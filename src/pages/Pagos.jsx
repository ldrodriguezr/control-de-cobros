import { useState, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  Search,
  Receipt,
  CheckCircle,
  X,
  Building2,
  User,
  FileText,
  Printer,
} from 'lucide-react';
import { useStore } from '../data/useStore';
import { formatCurrency, formatDate, formatDateEN } from '../utils/helpers';

export default function Pagos() {
  const { clientes, registrarPago, getPagosByCliente, getAcuerdoByCliente } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRecibo, setShowRecibo] = useState(null);
  const [payForm, setPayForm] = useState({ monto: '', metodo: 'Transferencia', notas: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = useMemo(() => {
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.cedula.toLowerCase().includes(search.toLowerCase())
    );
  }, [clientes, search]);

  const handleOpenPay = (cliente) => {
    setSelectedCliente(cliente);
    setPayForm({ monto: '', metodo: 'Transferencia', notas: '' });
    setShowPayModal(true);
  };

  const handlePay = (e) => {
    e.preventDefault();
    const monto = parseFloat(payForm.monto);
    if (!monto || monto <= 0) return;

    const saldoPosterior = Math.max(0, selectedCliente.montoAdeudado - monto);
    const pago = registrarPago({
      clienteId: selectedCliente.id,
      monto,
      saldoPosterior,
      metodo: payForm.metodo,
      notas: payForm.notas,
    });

    setShowPayModal(false);
    setShowRecibo({
      ...pago,
      clienteNombre: selectedCliente.nombre,
      clienteCedula: selectedCliente.cedula,
      proyecto: selectedCliente.proyecto,
      numeroCasa: selectedCliente.numeroCasa,
      descripcionExtras: selectedCliente.descripcionExtras,
      montoAnterior: selectedCliente.montoAdeudado,
      saldoPosterior,
    });

    setSuccessMsg(`Pago de ${formatCurrency(monto)} registrado exitosamente`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registro de Pagos</h1>
        <p className="text-gray-500 mt-1">Registrar abonos y cancelaciones de clientes</p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-slide-in">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-green-800 font-medium text-sm">{successMsg}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente para registrar pago..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Client cards for payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cliente) => {
          const acuerdo = getAcuerdoByCliente(cliente.id);
          const pagosRecientes = getPagosByCliente(cliente.id).slice(-3).reverse();
          return (
            <div key={cliente.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zen-600 to-zen-800 flex items-center justify-center text-white font-bold text-sm">
                  {cliente.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{cliente.nombre}</p>
                  <p className="text-xs text-gray-500">{cliente.proyecto} · Casa {cliente.numeroCasa}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-red-500 font-medium">Saldo Pendiente</p>
                  <p className="font-bold text-red-700">{formatCurrency(cliente.montoAdeudado)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-blue-500 font-medium">Cuota</p>
                  <p className="font-bold text-blue-700">{acuerdo ? formatCurrency(acuerdo.montoCuota) : '—'}</p>
                </div>
              </div>

              {/* Recent payments */}
              {pagosRecientes.length > 0 && (
                <div className="mb-4 space-y-1.5">
                  <p className="text-xs font-medium text-gray-500">Últimos pagos:</p>
                  {pagosRecientes.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5">
                      <span>{formatDate(p.fecha)}</span>
                      <span className="font-semibold text-green-600">{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleOpenPay(cliente)}
                disabled={cliente.montoAdeudado <= 0}
                className={`w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                  cliente.montoAdeudado <= 0
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-zen-600 to-zen-700 text-white shadow-lg shadow-zen-600/25 hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {cliente.montoAdeudado <= 0 ? (
                  <>
                    <CheckCircle size={16} /> Pagado en su totalidad
                  </>
                ) : (
                  <>
                    <DollarSign size={16} /> Registrar Pago
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPayModal && selectedCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard size={20} className="text-zen-600" />
                Registrar Pago
              </h3>
              <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handlePay} className="p-6 space-y-4">
              {/* Client info */}
              <div className="bg-zen-50 rounded-xl p-4 border border-zen-100">
                <p className="font-semibold text-gray-900">{selectedCliente.nombre}</p>
                <p className="text-sm text-gray-600">{selectedCliente.proyecto} · Casa {selectedCliente.numeroCasa}</p>
                <p className="text-sm font-semibold text-red-600 mt-1">
                  Saldo: {formatCurrency(selectedCliente.montoAdeudado)}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Abono ($)</label>
                <input
                  type="number"
                  value={payForm.monto}
                  onChange={(e) => setPayForm((f) => ({ ...f, monto: e.target.value }))}
                  required
                  min="0.01"
                  max={selectedCliente.montoAdeudado}
                  step="0.01"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm"
                  placeholder="0.00"
                />
                <div className="flex gap-2 mt-2">
                  {[
                    { label: 'Cuota', value: (() => { const a = getAcuerdoByCliente(selectedCliente.id); return a ? a.montoCuota : null; })() },
                    { label: 'Total', value: selectedCliente.montoAdeudado },
                  ].filter(b => b.value).map((b) => (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setPayForm((f) => ({ ...f, monto: String(b.value) }))}
                      className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-zen-100 hover:text-zen-700 transition-colors font-medium"
                    >
                      {b.label}: {formatCurrency(b.value)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={payForm.metodo}
                  onChange={(e) => setPayForm((f) => ({ ...f, metodo: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm bg-white"
                >
                  <option>Transferencia</option>
                  <option>Efectivo</option>
                  <option>Cheque</option>
                  <option>Tarjeta</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={payForm.notas}
                  onChange={(e) => setPayForm((f) => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-zen-500 focus:ring-2 focus:ring-zen-500/20 outline-none transition-all text-sm resize-none"
                  placeholder="Observaciones..."
                />
              </div>

              {/* Preview */}
              {payForm.monto && parseFloat(payForm.monto) > 0 && (
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-sm">
                  <p className="text-emerald-800">
                    Nuevo saldo: <span className="font-bold">{formatCurrency(Math.max(0, selectedCliente.montoAdeudado - parseFloat(payForm.monto)))}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors border border-gray-200">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all text-sm">
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            {/* Printable receipt */}
            <div className="print-area p-6 space-y-5">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Building2 size={28} className="text-zen-700" />
                  <h2 className="text-2xl font-bold text-zen-900">GRUPO ZEN</h2>
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Recibo de Pago / Receipt of Payment</h3>
                <p className="text-sm text-gray-500 mt-1">No. {showRecibo.id} · {formatDate(showRecibo.fecha)}</p>
              </div>

              {/* Client info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente / Client</p>
                  <p className="font-semibold text-gray-900">{showRecibo.clienteNombre}</p>
                </div>
                <div>
                  <p className="text-gray-500">Cédula / ID</p>
                  <p className="font-semibold text-gray-900">{showRecibo.clienteCedula}</p>
                </div>
                <div>
                  <p className="text-gray-500">Proyecto / Project</p>
                  <p className="font-semibold text-gray-900">{showRecibo.proyecto}</p>
                </div>
                <div>
                  <p className="text-gray-500">Casa / House No.</p>
                  <p className="font-semibold text-gray-900">{showRecibo.numeroCasa}</p>
                </div>
              </div>

              {/* Amount details */}
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

              {/* Extras */}
              {showRecibo.descripcionExtras && showRecibo.descripcionExtras !== 'Sin extras' && (
                <div className="text-sm">
                  <p className="text-gray-500 mb-1">Detalle de Extras y Cambios / Extras & Changes Detail</p>
                  <p className="text-gray-800 bg-amber-50 rounded-lg p-3 border border-amber-100">{showRecibo.descripcionExtras}</p>
                </div>
              )}

              {/* Method */}
              <div className="text-sm flex justify-between">
                <span className="text-gray-500">Método de Pago / Payment Method</span>
                <span className="font-medium text-gray-900">{showRecibo.metodo}</span>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
                <p>Este documento es un comprobante de pago oficial de GRUPO ZEN.</p>
                <p>This document is an official payment receipt from GRUPO ZEN.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 no-print">
              <button onClick={() => setShowRecibo(null)} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors border border-gray-200">
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Imprimir / Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
