"use client";

import { useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceService } from "@/app/services/invoices";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2, CheckCircle2, AlertCircle, Wallet } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function InvoicePreviewPage() {
  const { id } = useParams() as { id: string };
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const queryClient = useQueryClient();

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

  const togglePaymentMutation = useMutation({
    mutationFn: (newStatus: string) => invoiceService.updatePaymentStatus(id, newStatus),
    onSuccess: (updatedInvoice) => {
      toast.success(`Invoice payment status updated to ${updatedInvoice.payment_status}!`);
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoice-html", id] });
    },
    onError: () => {
      toast.error("Failed to update payment status");
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

  const isPaid = invoice.payment_status?.toLowerCase() === "paid";

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

      {/* Payment Status Action Control Bar */}
      <div className={`no-print p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-2xs ${
        isPaid 
          ? "bg-green-50/80 border-green-200" 
          : "bg-amber-50/80 border-amber-200"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isPaid ? "bg-green-700 text-white" : "bg-amber-600 text-white"
          }`}>
            {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Payment Status:</span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                isPaid ? "bg-green-200 text-green-900" : "bg-amber-200 text-amber-900"
              }`}>
                {isPaid ? "PAID" : "UNPAID (RECEIVABLE)"}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {isPaid 
                ? `Full payment of ₹${invoice.grand_total.toFixed(2)} received.` 
                : `Amount Receivable: ₹${invoice.balance_due.toFixed(2)} (Linked to Accounts Receivable)`
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={() => togglePaymentMutation.mutate(isPaid ? "Unpaid" : "Paid")}
            disabled={togglePaymentMutation.isPending}
            className={`w-full sm:w-auto rounded-xl font-extrabold text-xs shadow-2xs ${
              isPaid 
                ? "bg-gray-200 hover:bg-gray-300 text-gray-800" 
                : "bg-green-700 hover:bg-green-800 text-white"
            }`}
          >
            {togglePaymentMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : isPaid ? (
              "Mark as Unpaid"
            ) : (
              `✓ Mark as Paid (₹${invoice.balance_due.toFixed(2)})`
            )}
          </Button>

          <Link href="/finance/receivables">
            <Button size="sm" variant="outline" className="rounded-xl font-bold text-xs">
              <Wallet className="w-3.5 h-3.5 mr-1" />
              Receivables Hub
            </Button>
          </Link>
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
