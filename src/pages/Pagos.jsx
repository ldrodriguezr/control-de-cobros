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
  LayoutGrid,
  List,
  ChevronRight,
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
  const [viewMode, setViewMode] = useState('grid');

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

  const handlePay = async (e) => {
    e.preventDefault();
    const monto = parseFloat(payForm.monto);
    if (!monto || monto <= 0) return;

    const saldoPosterior = Math.max(0, selectedCliente.montoAdeudado - monto);
    const nuevoPago = await registrarPago({
      clienteId: selectedCliente.id,
      monto,
      saldoPosterior,
      metodo: payForm.metodo,
      notas: payForm.notas,
    });

    if (!nuevoPago) return; // Fail safe

    setShowPayModal(false);
    setShowRecibo({
      id: nuevoPago.id,
      fecha: nuevoPago.fecha,
      monto: nuevoPago.monto,
      saldoPosterior: nuevoPago.saldoPosterior,
      metodo: payForm.metodo,
      // Client info for receipt
      clienteNombre: selectedCliente.nombre,
      clienteCedula: selectedCliente.cedula,
      proyecto: selectedCliente.proyecto,
      numeroCasa: selectedCliente.numeroCasa,
      descripcionExtras: selectedCliente.descripcionExtras,
      montoAnterior: selectedCliente.montoAdeudado,
    });

    setSuccessMsg(`Pago de ${formatCurrency(monto)} registrado exitosamente`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
    {/* APP WEB UI */}
    <div className="space-y-6 animate-fade-in print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Registro de Pagos</h1>
          <p className="text-gray-500 mt-1">Registrar abonos y cancelaciones de clientes</p>
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

      {viewMode === 'grid' ? (
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Cliente</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Proyecto</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Saldo Pendiente</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-600">Cuota</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cliente) => {
                const acuerdo = getAcuerdoByCliente(cliente.id);
                return (
                  <tr key={cliente.id} className="hover:bg-zen-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{cliente.nombre}</p>
                      <p className="text-xs text-gray-400">{cliente.cedula}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{cliente.proyecto} · Casa {cliente.numeroCasa}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${cliente.montoAdeudado > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(cliente.montoAdeudado)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-blue-700">
                      {acuerdo ? formatCurrency(acuerdo.montoCuota) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {cliente.montoAdeudado <= 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          <CheckCircle size={14} /> Pagado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenPay(cliente)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zen-600 text-white hover:bg-zen-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <DollarSign size={14} /> Registrar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">No se encontraron clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Receipt Modal (Web Preview) */}
      {showRecibo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={() => setShowRecibo(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt size={20} className="text-zen-600" />
                Recibo de Pago
              </h3>
              <button onClick={() => setShowRecibo(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
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

              <div className="text-sm flex justify-between">
                <span className="text-gray-500">Método / Method</span>
                <span className="font-medium text-gray-900">{showRecibo.metodo}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowRecibo(null)} className="flex-1 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors border border-gray-200">
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-gradient-to-r from-zen-600 to-zen-700 text-white rounded-xl font-medium shadow-lg shadow-zen-600/25 hover:shadow-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* EXCLUSIVE PRINT LAYOUT */}
    <div className="hidden print:block fixed inset-0 w-full bg-white text-black z-[99999] print:p-8">
      {showRecibo && (
        <div className="space-y-6">
          <div className="text-center border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-3xl font-bold">GRUPO ZEN</h2>
            <h3 className="text-xl font-semibold text-gray-700 mt-2">Recibo de Pago / Receipt of Payment</h3>
            <p className="text-sm text-gray-500 mt-1">No. {showRecibo.id} · {formatDate(showRecibo.fecha)}</p>
          </div>

          <table className="w-full text-sm mb-6 border-collapse">
            <tbody>
              <tr>
                <td className="py-2 border-b border-gray-100 w-1/2 align-top">
                  <p className="text-gray-500 text-xs mb-1">Cliente / Client</p>
                  <p className="font-semibold text-gray-900">{showRecibo.clienteNombre}</p>
                </td>
                <td className="py-2 border-b border-gray-100 w-1/2 align-top pl-4">
                  <p className="text-gray-500 text-xs mb-1">Cédula / ID</p>
                  <p className="font-semibold text-gray-900">{showRecibo.clienteCedula}</p>
                </td>
              </tr>
              <tr>
                <td className="py-2 border-b border-gray-100 w-1/2 align-top pt-3">
                  <p className="text-gray-500 text-xs mb-1">Proyecto / Project</p>
                  <p className="font-semibold text-gray-900">{showRecibo.proyecto}</p>
                </td>
                <td className="py-2 border-b border-gray-100 w-1/2 align-top pl-4 pt-3">
                  <p className="text-gray-500 text-xs mb-1">Casa / House No.</p>
                  <p className="font-semibold text-gray-900">{showRecibo.numeroCasa}</p>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full text-base mb-6 border-collapse">
            <tbody>
              <tr>
                <td className="py-3 text-gray-600 w-2/3 align-middle border-b border-gray-100">Saldo Anterior / Previous Balance</td>
                <td className="py-3 text-right font-semibold w-1/3 align-middle border-b border-gray-100">{formatCurrency(showRecibo.montoAnterior)}</td>
              </tr>
              <tr>
                <td className="py-3 text-gray-600 border-b border-gray-200 w-2/3 align-middle">Monto Abonado / Amount Paid</td>
                <td className="py-3 text-right font-bold text-green-700 border-b border-gray-200 w-1/3 align-middle">{formatCurrency(showRecibo.monto)}</td>
              </tr>
              <tr>
                <td className="py-4 font-semibold text-gray-900 w-2/3 align-middle border-b border-gray-200">Saldo Pendiente / Remaining Balance</td>
                <td className="py-4 text-right text-lg font-bold text-gray-900 w-1/3 align-middle border-b border-gray-200">{formatCurrency(showRecibo.saldoPosterior)}</td>
              </tr>
              <tr>
                <td className="py-4 text-gray-500 w-2/3 align-middle">Método de Pago / Payment Method</td>
                <td className="py-4 text-right font-medium text-gray-900 w-1/3 align-middle">{showRecibo.metodo}</td>
              </tr>
            </tbody>
          </table>

          {showRecibo.descripcionExtras && showRecibo.descripcionExtras !== 'Sin extras' && (
             <div className="text-sm border border-gray-200 p-4 mt-8 bg-gray-50">
                <p className="text-gray-500 font-semibold mb-2">Detalle de Extras y Cambios / Extras & Changes Detail</p>
                <p className="font-medium text-gray-800">{showRecibo.descripcionExtras}</p>
             </div>
          )}

          <div className="text-center text-sm text-gray-400 border-t border-gray-200 pt-8 mt-12">
            <p>Este documento es un comprobante de pago oficial de GRUPO ZEN.</p>
            <p className="italic mt-1">This document is an official payment receipt from GRUPO ZEN.</p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
