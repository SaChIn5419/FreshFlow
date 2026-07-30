"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/app/services/orders";
import { invoiceService } from "@/app/services/invoices";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, Check, Clock, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CustomerOrdersPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // 1. Fetch Orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.getOrders(),
  });

  // 2. Fetch Invoices to associate orders with invoice PDFs
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
  });

  const isLoading = isLoadingOrders || isLoadingInvoices;

  const invoiceMap = useMemo(() => {
    if (!invoices) return new Map<string, { id: string; number: string }>();
    return new Map(invoices.map(inv => [inv.order_id, { id: inv.id, number: inv.invoice_number }]));
  }, [invoices]);

  // 3. Mutation to confirm delivery status
  const confirmDeliveryMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Delivery received and confirmed!");
    },
    onError: () => {
      toast.error("Failed to update status. Please try again.");
    },
    onSettled: () => {
      setConfirmingId(null);
    }
  });

  const handleConfirmReceived = (orderId: string) => {
    setConfirmingId(orderId);
    confirmDeliveryMutation.mutate({ orderId, status: "DELIVERED" });
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNum: string) => {
    setDownloadingId(invoiceId);
    try {
      const { apiClient } = await import("@/app/lib/axios");
      const res = await apiClient.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNum}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Invoice ${invoiceNum} PDF downloaded!`);
    } catch (err) {
      toast.error("Failed to download invoice PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING" || s === "SUBMITTED" || s === "DRAFT" || s === "REVIEWED") {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3" /> Processing
        </Badge>
      );
    }
    if (s === "INVOICE_GENERATED" || s === "INVOICED" || s === "PACKED") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex items-center gap-1 w-fit">
          <Truck className="w-3 h-3" /> Out for Delivery
        </Badge>
      );
    }
    if (s === "DELIVERED" || s === "COMPLETED") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-800 flex items-center gap-1 w-fit">
          <Check className="w-3 h-3" /> Delivered
        </Badge>
      );
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading || !orders) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  // Sort orders descending (newest first)
  const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-4 mb-4 border-b">
        <h1 className="text-xl font-bold">Order History</h1>
        <p className="text-sm text-gray-500">Track your current and past orders.</p>
      </div>

      <div className="px-4">
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                      You haven't placed any orders yet.
                    </TableCell>
                  </TableRow>
                )}
                {sortedOrders.map(order => {
                  const invDetails = invoiceMap.get(order.id);
                  const isDelivered = ["DELIVERED", "COMPLETED"].includes(order.status.toUpperCase());
                  const isShipped = (["INVOICE_GENERATED", "INVOICED", "PACKED"].includes(order.status.toUpperCase()) || !!invDetails) && !isDelivered;
                  
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-800">
                        {format(new Date(order.created_at), "dd MMM, yyyy")}
                        <div className="text-xs text-gray-400 font-normal">{format(new Date(order.created_at), "h:mm a")}</div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-600">{order.items.length} items</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {/* Confirm Received Button (Only when invoiced/out for delivery) */}
                          {isShipped && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 hover:bg-green-50 text-green-700 font-semibold"
                              onClick={() => handleConfirmReceived(order.id)}
                              disabled={confirmingId === order.id}
                            >
                              {confirmingId === order.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : (
                                <Check className="w-3.5 h-3.5 mr-1" />
                              )}
                              Confirm Received
                            </Button>
                          )}
                          
                          {/* Download Invoice (Only if invoice exists in DB AND order has been delivered!) */}
                          {invDetails ? (
                            isDelivered ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold"
                                onClick={() => handleDownloadInvoice(invDetails.id, invDetails.number)}
                                disabled={downloadingId === invDetails.id}
                              >
                                {downloadingId === invDetails.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                Invoice
                              </Button>
                            ) : (
                              <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-100 font-medium">
                                Awaiting Delivery Confirmation
                              </span>
                            )
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 cursor-not-allowed"
                              disabled
                            >
                              Invoice Pending
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
