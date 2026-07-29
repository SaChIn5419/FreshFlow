"use client";

import { useState, useEffect } from "react";
import { invoiceService, Invoice } from "@/app/services/invoices";
import { financeService } from "@/app/services/finance";
import { customerService, Customer } from "@/app/services/customers";
import { PageShell } from "@/app/components/layout/PageShell";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Receipt, AlertCircle, CheckCircle2, DollarSign, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function ReceivablesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("TRANSFER");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invData, custData] = await Promise.all([
        invoiceService.getInvoices(),
        customerService.getCustomers()
      ]);
      
      const custMap: Record<string, Customer> = {};
      custData.forEach((c) => (custMap[c.id] = c));
      setCustomers(custMap);
      
      setInvoices(invData.filter((inv) => inv.payment_status !== "Paid"));
    } catch (err) {
      toast.error("Failed to load receivables data");
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
        notes: paymentNotes,
      });
      toast.success(`Recorded payment of ₹${paymentAmount}!`);
      setSelectedInvoice(null);
      setPaymentAmount("");
      setPaymentNotes("");
      await fetchData();
    } catch (err) {
      toast.error("Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDaysOverdue = (invoice: Invoice) => {
    if (!invoice.due_date) return 0;
    const diffTime = new Date().getTime() - new Date(invoice.due_date).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalPending = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);

  return (
    <PageShell
      title="Accounts Receivable (AR)"
      subtitle="Track outstanding restaurant client balances, credit terms, and record incoming collections."
      badgeText="Collections Hub"
    >
      <div className="space-y-6">
        {/* KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-green-100/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pending Collections</p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-1">₹{totalPending.toFixed(2)}</h3>
              <p className="text-xs text-amber-700 font-semibold mt-1">
                {invoices.length} outstanding invoices
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Receipt className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30">
              <TableRow>
                <TableHead className="font-bold text-gray-900">Restaurant Client</TableHead>
                <TableHead className="font-bold text-gray-900">Invoice #</TableHead>
                <TableHead className="font-bold text-gray-900">Date Issued</TableHead>
                <TableHead className="font-bold text-gray-900 text-right">Grand Total</TableHead>
                <TableHead className="font-bold text-gray-900 text-right">Balance Due</TableHead>
                <TableHead className="font-bold text-gray-900">Credit Status</TableHead>
                <TableHead className="text-right font-bold text-gray-900">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
                    Loading accounts receivable...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    No outstanding invoices! Great job on collections.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const customer = customers[invoice.customer_id];
                  const daysOverdue = calculateDaysOverdue(invoice);
                  const isOverdue = daysOverdue > 0;

                  return (
                    <TableRow key={invoice.id} className="hover:bg-green-50/40 transition-colors">
                      <TableCell className="font-bold text-gray-900">
                        {customer?.restaurant_name || "Unknown Restaurant"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-green-800">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {format(new Date(invoice.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700 text-right">
                        ₹{invoice.grand_total.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-extrabold text-gray-950 text-right">
                        ₹{invoice.balance_due.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit font-bold">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            Overdue ({daysOverdue} days)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 w-fit font-bold">
                            Pending Payment
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentAmount(invoice.balance_due.toString());
                          }}
                          className="bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-semibold shadow-2xs"
                        >
                          Record Payment
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Payment Record Modal */}
        <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-[450px] bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-700" />
                Record Incoming Payment
              </DialogTitle>
            </DialogHeader>

            {selectedInvoice && (
              <form onSubmit={handleRecordPayment} className="space-y-4 py-2">
                <div className="p-3 bg-green-50/60 rounded-xl border border-green-200/60 text-xs text-green-900 font-medium">
                  Recording collection for <strong>{customers[selectedInvoice.customer_id]?.restaurant_name}</strong> — Invoice #{selectedInvoice.invoice_number}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-semibold text-gray-800">Amount Received (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method" className="font-semibold text-gray-800">Payment Method</Label>
                  <select
                    id="method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                  >
                    <option value="TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="font-semibold text-gray-800">Reference / Notes</Label>
                  <Input
                    id="notes"
                    type="text"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="e.g. UTR Number or Transaction Ref"
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelectedInvoice(null)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : "Save Payment"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
