"use client";

import { useState, useEffect } from 'react';
import { purchaseOrderService, PurchaseOrder } from '@/app/services/purchase_orders';
import { financeService } from '@/app/services/finance';
import { supplierService, Supplier } from '@/app/services/suppliers';
import { format } from 'date-fns';

export default function PayablesPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Record<string, Supplier>>({});
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [poData, supplierData] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(),
        supplierService.getSuppliers()
      ]);
      
      const supMap: Record<string, Supplier> = {};
      supplierData.forEach(s => supMap[s.id] = s);
      setSuppliers(supMap);
      
      // Filter out fully paid POs and Draft POs (since we haven't incurred cost yet)
      setPurchaseOrders(poData.filter(po => po.payment_status !== 'Paid' && po.status !== 'Draft'));
    } catch (err) {
      console.error('Failed to load payables data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    
    setIsSubmitting(true);
    try {
      await financeService.recordSupplierPayment({
        supplier_id: selectedPO.supplier_id,
        purchase_order_id: selectedPO.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      });
      setSelectedPO(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await fetchData();
    } catch (err) {
      console.error('Failed to record supplier payment', err);
      alert('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading Accounts Payable...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Payable</h1>
          <p className="text-gray-500 mt-1">Outstanding vendor bills and pending supplier payments</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-rose-800">
          <div className="text-sm font-medium">Total Pending Payables</div>
          <div className="text-2xl font-bold">
            ₹{purchaseOrders.reduce((sum, po) => sum + (po.balance_due || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PO Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No outstanding supplier bills!
                </td>
              </tr>
            ) : purchaseOrders.map((po) => {
              const supplier = suppliers[po.supplier_id];

              return (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{supplier?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(po.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₹{po.total_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-rose-600 text-right">
                    ₹{po.balance_due.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedPO(po);
                        setPaymentAmount(po.balance_due.toString());
                      }}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                    >
                      Record Payment
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pay Supplier</h3>
            <div className="mb-4 text-sm text-gray-600">
              Recording payment to {suppliers[selectedPO.supplier_id]?.name} for PO dated {format(new Date(selectedPO.created_at), 'dd MMM')}
            </div>
            
            <form onSubmit={handleRecordPayment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Notes</label>
                  <input
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. UTR Number"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
