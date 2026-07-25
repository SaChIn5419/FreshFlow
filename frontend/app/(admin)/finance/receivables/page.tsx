"use client";

import { useState, useEffect } from 'react';
import { invoiceService, Invoice } from '@/app/services/invoices';
import { financeService } from '@/app/services/finance';
import { customerService, Customer } from '@/app/services/customers';
import { format } from 'date-fns';

export default function ReceivablesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [invData, custData] = await Promise.all([
        invoiceService.getInvoices(),
        customerService.getCustomers()
      ]);
      
      const custMap: Record<string, Customer> = {};
      custData.forEach(c => custMap[c.id] = c);
      setCustomers(custMap);
      
      // Filter out fully paid invoices
      setInvoices(invData.filter(inv => inv.payment_status !== 'Paid'));
    } catch (err) {
      console.error('Failed to load receivables data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    setIsSubmitting(true);
    try {
      await financeService.recordCustomerPayment({
        customer_id: selectedInvoice.customer_id,
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      });
      setSelectedInvoice(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await fetchData();
    } catch (err) {
      console.error('Failed to record payment', err);
      alert('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysOverdue = (invoice: Invoice) => {
    if (!invoice.due_date) return 0;
    const diffTime = new Date().getTime() - new Date(invoice.due_date).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="p-8">Loading Accounts Receivable...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts Receivable</h1>
          <p className="text-gray-500 mt-1">Outstanding customer invoices and pending collections</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-orange-800">
          <div className="text-sm font-medium">Total Pending Collections</div>
          <div className="text-2xl font-bold">
            ₹{invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No outstanding invoices! Great job on collections.
                </td>
              </tr>
            ) : invoices.map((invoice) => {
              const customer = customers[invoice.customer_id];
              const daysOverdue = calculateDaysOverdue(invoice);
              const isOverdue = daysOverdue > 0;

              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{customer?.restaurant_name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(invoice.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ₹{invoice.grand_total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                    ₹{invoice.balance_due.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isOverdue ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Overdue ({daysOverdue} days)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setPaymentAmount(invoice.balance_due.toString());
                      }}
                      className="text-emerald-600 hover:text-emerald-900 bg-emerald-50 px-3 py-1 rounded-md"
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
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h3>
            <div className="mb-4 text-sm text-gray-600">
              Recording payment for {customers[selectedInvoice.customer_id]?.restaurant_name} - {selectedInvoice.invoice_number}
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
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
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
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
