"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/app/services/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Printer, Loader2, CheckCircle2, AlertCircle, Wallet, DollarSign, PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function InvoicePreviewPage() {
  const { id } = useParams() as { id: string };
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const queryClient = useQueryClient();
  const [typedAmount, setTypedAmount] = useState<string>("");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceService.getInvoice(id),
  });

  const { data: htmlContent, isLoading: isLoadingHtml } = useQuery({
    queryKey: ["invoice-html", id],
    queryFn: async () => {
      const { apiClient } = await import("@/app/lib/axios");
      const res = await apiClient.get(`/invoices/${id}/preview`, { responseType: 'text' });
      return res.data;
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (params: { amount_received?: number; paid_amount?: number; payment_status?: string }) => 
      invoiceService.recordPayment({ id, ...params }),
    onSuccess: (updated) => {
      toast.success(`Payment updated! Paid: ₹${updated.paid_amount.toFixed(2)}, Due: ₹${updated.balance_due.toFixed(2)} (${updated.payment_status})`);
      setTypedAmount("");
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-html", id] });
    },
    onError: () => {
      toast.error("Failed to record payment.");
    }
  });

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleDownload = async () => {
    const { apiClient } = await import("@/app/lib/axios");
    const res = await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${invoice?.invoice_number || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || isLoadingHtml || !invoice) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  const statusUpper = invoice.payment_status?.toUpperCase() || "UNPAID";
  const isPaid = statusUpper === "PAID";
  const isPartial = statusUpper === "PARTIAL";

  const handleAddPayment = () => {
    const amt = parseFloat(typedAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid positive payment amount.");
      return;
    }
    recordPaymentMutation.mutate({ amount_received: amt });
  };

  const handleSetExactPaid = () => {
    const amt = parseFloat(typedAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    recordPaymentMutation.mutate({ paid_amount: amt });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Print stylesheet to hide UI outside iframe */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          iframe, iframe * {
            visibility: visible;
          }
          iframe {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
        }
      `}} />

      {/* Top Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href={`/orders/${invoice.order_id}/billing`} className="hover:text-gray-900 flex items-center font-medium">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Billing
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Invoice {invoice.invoice_number}</h1>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2 rounded-xl font-bold">
            <Download className="w-4 h-4 text-gray-600" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 rounded-xl font-bold">
            <Printer className="w-4 h-4 text-gray-600" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Payment Status & Interactive Collection Console */}
      <div className={`no-print p-5 rounded-3xl border transition-all shadow-sm ${
        isPaid 
          ? "bg-green-50/90 border-green-200" 
          : isPartial
          ? "bg-amber-50/90 border-amber-200"
          : "bg-stone-50 border-gray-200"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
              isPaid ? "bg-green-700 text-white shadow-md shadow-green-700/20" : isPartial ? "bg-amber-600 text-white" : "bg-gray-800 text-white"
            }`}>
              {isPaid ? <CheckCircle2 className="w-6 h-6" /> : isPartial ? <DollarSign className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Status:</span>
                <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full ${
                  isPaid ? "bg-green-200 text-green-900" : isPartial ? "bg-amber-200 text-amber-900" : "bg-gray-200 text-gray-800"
                }`}>
                  {isPaid ? "FULL PAYMENT (PAID)" : isPartial ? "PARTIAL PAYMENT" : "UNPAID (RECEIVABLE)"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-bold text-gray-900 mt-1">
                <span>Grand Total: ₹{invoice.grand_total.toFixed(2)}</span>
                <span className="text-green-700">Paid: ₹{(invoice.paid_amount || 0).toFixed(2)}</span>
                <span className={invoice.balance_due > 0 ? "text-amber-700" : "text-gray-500"}>
                  Balance Due: ₹{(invoice.balance_due || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isPaid && (
              <Button
                size="sm"
                onClick={() => recordPaymentMutation.mutate({ payment_status: "Paid" })}
                disabled={recordPaymentMutation.isPending}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-extrabold text-xs px-4 shadow-2xs"
              >
                ✓ Mark 100% Paid (₹{invoice.balance_due.toFixed(2)})
              </Button>
            )}
            {isPaid && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => recordPaymentMutation.mutate({ payment_status: "Unpaid" })}
                disabled={recordPaymentMutation.isPending}
                className="rounded-xl font-bold text-xs"
              >
                Reset to Unpaid
              </Button>
            )}
            <Link href="/finance/receivables">
              <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs">
                <Wallet className="w-3.5 h-3.5 mr-1" />
                Receivables Ledger
              </Button>
            </Link>
          </div>
        </div>

        {/* Type Amount Received Form (e.g. 50k out of 1.5L) */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Type Amount Received (₹):</span>
            <Input
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 50000"
              value={typedAmount}
              onChange={(e) => setTypedAmount(e.target.value)}
              className="w-40 h-9 rounded-xl border-gray-300 font-bold bg-white text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleAddPayment}
              disabled={recordPaymentMutation.isPending || !typedAmount}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              + Add to Paid ({typedAmount ? `₹${typedAmount}` : "₹0"})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSetExactPaid}
              disabled={recordPaymentMutation.isPending || !typedAmount}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl font-bold text-xs"
            >
              Set Total Paid to ₹{typedAmount || "0"}
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice HTML Document Preview Container */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden min-h-[850px] flex">
        <iframe
          ref={iframeRef}
          title="Invoice Preview"
          srcDoc={htmlContent}
          className="w-full min-h-full border-none flex-1"
        />
      </div>
    </div>
  );
}
