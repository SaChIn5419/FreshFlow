"use client";

import { useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { invoiceService } from "@/app/services/invoices";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";

export default function InvoicePreviewPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceService.getInvoice(id),
  });

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const previewUrl = `${backendUrl}/invoices/${id}/preview?token=${token}`; // Alternatively inject via headers in a next.js route handler, but appending token is a simple workaround for iframe if supported by backend, or we can fetch HTML and inject into iframe srcdoc.

  // Let's fetch the HTML via our authenticated axios client instead of iframe src,
  // then inject it into the iframe using srcdoc so we don't leak the token in URL.
  const { data: htmlContent, isLoading: isLoadingHtml } = useQuery({
    queryKey: ["invoice-html", id],
    queryFn: async () => {
      const { apiClient } = await import("@/app/lib/axios");
      const res = await apiClient.get(`/invoices/${id}/preview`, { responseType: 'text' });
      return res.data;
    },
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <div className="flex items-center justify-between no-print">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href={`/orders/${invoice.order_id}/billing`} className="hover:text-gray-900 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Billing
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.invoice_number}</h1>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[800px] flex">
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
