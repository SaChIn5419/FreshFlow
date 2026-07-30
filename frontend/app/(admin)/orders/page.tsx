"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/app/services/orders";
import { invoiceService } from "@/app/services/invoices";
import { purchaseOrderService } from "@/app/services/purchase_orders";
import { PageShell } from "@/app/components/layout/PageShell";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText, CheckCircle, Clock, ChevronDown, ChevronUp, Download, Eye, Truck, Send, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const getGroupedItems = (items: any[]) => {
  const groups: Record<string, any[]> = {
    "Greens & Herbs": [],
    "Vegetables": [],
    "Exotic": [],
    "Fruits": [],
    "Other": []
  };

  items.forEach(item => {
    const productName = (item.product?.name || "").toLowerCase();
    const category = item.product?.category || "Other";
    const categoryUpper = category.toUpperCase();

    const isExoticItem = 
      categoryUpper === "EXOTIC" || 
      categoryUpper === "EXOTICS" ||
      productName.includes("broccoli") ||
      productName.includes("zucchini") ||
      productName.includes("lettuce") ||
      productName.includes("cherry tomato") ||
      productName.includes("baby corn") ||
      productName.includes("mushroom") ||
      productName.includes("yellow bell") ||
      productName.includes("red bell") ||
      productName.includes("yellow capsicum") ||
      productName.includes("red capsicum") ||
      productName.includes("celery") ||
      productName.includes("parsley") ||
      productName.includes("basil") ||
      productName.includes("leek") ||
      productName.includes("bok choy") ||
      productName.includes("asparagus") ||
      productName.includes("avocado") ||
      productName.includes("thyme") ||
      productName.includes("rosemary") ||
      productName.includes("oregano") ||
      productName.includes("red cabbage") ||
      productName.includes("chinese cabbage") ||
      productName.includes("jalapeno") ||
      productName.includes("dragon fruit") ||
      productName.includes("kiwi") ||
      productName.includes("passion fruit");

    if (isExoticItem) {
      groups["Exotic"].push(item);
    } else if (productName.includes("spring onion")) {
      groups["Greens & Herbs"].push(item);
    } else if (productName.includes("lemon")) {
      groups["Vegetables"].push(item);
    } else if (categoryUpper === "HERBS" || categoryUpper === "LEAFY") {
      groups["Greens & Herbs"].push(item);
    } else if (categoryUpper === "VEGETABLES" || categoryUpper === "VEGGIES") {
      groups["Vegetables"].push(item);
    } else if (categoryUpper === "FRUITS" || categoryUpper === "FRUIT") {
      groups["Fruits"].push(item);
    } else {
      groups["Other"].push(item);
    }
  });

  return Object.fromEntries(
    Object.entries(groups).filter(([_, list]) => list.length > 0)
  );
};

export default function AdminOrdersQueue() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
  const [copiedPoId, setCopiedPoId] = useState<string | null>(null);
  const [isGeneratingPOsId, setIsGeneratingPOsId] = useState<string | null>(null);

  // 1. Fetch Orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.getOrders(),
  });

  // 2. Fetch Invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoiceService.getInvoices(),
  });

  // 3. Fetch Purchase Orders
  const { data: purchaseOrders, isLoading: isLoadingPOs } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => purchaseOrderService.getPurchaseOrders(),
  });

  const isLoading = isLoadingOrders || isLoadingInvoices || isLoadingPOs;

  const invoiceMap = useMemo(() => {
    if (!invoices) return new Map<string, { id: string; number: string }>();
    return new Map(invoices.map(inv => [inv.order_id, { id: inv.id, number: inv.invoice_number }]));
  }, [invoices]);

  const poMap = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!purchaseOrders) return map;
    purchaseOrders.forEach(po => {
      if (!map.has(po.triggered_by_order_id)) {
        map.set(po.triggered_by_order_id, []);
      }
      map.get(po.triggered_by_order_id)!.push(po);
    });
    return map;
  }, [purchaseOrders]);

  const handleGeneratePOs = async (orderId: string) => {
    setIsGeneratingPOsId(orderId);
    try {
      const generated = await purchaseOrderService.generatePOsForOrder(orderId);
      toast.success(`Success! Split order into ${generated.length} supplier orders.`);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
    } catch (err) {
      toast.error("Failed to generate supplier orders.");
    } finally {
      setIsGeneratingPOsId(null);
    }
  };

  const handleCopyWhatsApp = async (poId: string) => {
    try {
      const text = await purchaseOrderService.getWhatsAppText(poId);
      await navigator.clipboard.writeText(text);
      setCopiedPoId(poId);
      toast.success("WhatsApp text copied!");
      setTimeout(() => setCopiedPoId(null), 2000);
      
      const po = purchaseOrders?.find(p => p.id === poId);
      if (po && po.status === "Draft") {
        await purchaseOrderService.updatePurchaseOrder(poId, { status: "Sent" });
        queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      }
    } catch (err) {
      toast.error("Failed to copy WhatsApp text.");
    }
  };

  const pendingOrders = useMemo(() => {
    const pendingStatuses = ["PENDING", "SUBMITTED", "DRAFT", "REVIEWED"];
    return (orders || [])
      .filter(order => pendingStatuses.includes(order.status.toUpperCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  const allOrders = useMemo(() => {
    return (orders || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders]);

  const displayedOrders = activeTab === "pending" ? pendingOrders : allOrders;

  const handleDownloadInvoice = async (invoiceId: string, invoiceNum: string) => {
    setIsDownloadingId(invoiceId);
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
      setIsDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "PENDING" || s === "SUBMITTED" || s === "DRAFT" || s === "REVIEWED") {
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1 font-bold">
          <Clock className="w-3 h-3" /> {status}
        </Badge>
      );
    }
    if (s === "INVOICE_GENERATED" || s === "INVOICED" || s === "COMPLETED" || s === "DELIVERED") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1 font-bold">
          <CheckCircle className="w-3 h-3" /> Invoiced
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-bold">
        {status}
      </Badge>
    );
  };

  return (
    <PageShell
      title="Orders Queue & Dispatch"
      subtitle="Review active restaurant requests, split orders into farm purchase orders, and generate invoices."
      actions={
        <Link href="/orders/upload">
          <Button className="bg-green-700 hover:bg-green-800 font-semibold shadow-xs rounded-xl px-4">
            <Upload className="w-4 h-4 mr-2" />
            Upload Order
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-green-100 pb-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-green-700 text-white shadow-2xs"
                : "bg-white text-gray-600 hover:bg-green-50 hover:text-green-800 border border-gray-200"
            }`}
          >
            <span>Pending Queue</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === "pending" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
              {pendingOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-green-700 text-white shadow-2xs"
                : "bg-white text-gray-600 hover:bg-green-50 hover:text-green-800 border border-gray-200"
            }`}
          >
            <span>Order History</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${activeTab === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
              {allOrders.length}
            </span>
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-green-100">
            <Loader2 className="h-8 w-8 animate-spin text-green-700" />
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {displayedOrders.length === 0 && (
              <div className="py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-green-200">
                {activeTab === "pending" ? (
                  <p className="font-bold text-gray-700">No pending orders! You are all caught up.</p>
                ) : (
                  <p className="font-bold text-gray-700">No order logs found.</p>
                )}
                <p className="text-xs text-gray-400 mt-1">Upload a PDF or click on the customer portal to create a new order.</p>
              </div>
            )}
            
            {displayedOrders.map(order => {
              const invDetails = invoiceMap.get(order.id);
              const isPending = ["PENDING", "SUBMITTED", "DRAFT", "REVIEWED"].includes(order.status.toUpperCase());
              const isExpanded = expandedOrderId === order.id;
              
              return (
                <Card key={order.id} className={`flex flex-col border rounded-2xl shadow-xs transition-all duration-200 ${!isPending ? "bg-gray-50/40 border-gray-200" : "bg-white border-green-200/80 hover:border-green-400"}`}>
                  {/* Card Header */}
                  <div 
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-extrabold text-gray-900 text-lg leading-tight truncate">{order.customer?.restaurant_name || "Unknown Restaurant"}</h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>Ordered: <strong>{format(new Date(order.created_at), "MMM dd, h:mm a")}</strong></span>
                        <span>•</span>
                        <span><strong>{order.items.length}</strong> produce items</span>
                      </div>
                    </div>

                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-green-700" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Card Expanded Items Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-green-100 pt-4 bg-green-50/20">
                      <div className="mb-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Requested Items List</h4>
                        {Object.entries(getGroupedItems(order.items)).map(([groupName, groupItems]) => (
                          <div key={groupName} className="space-y-1">
                            <div className="text-[11px] font-bold text-green-800 pl-1 uppercase tracking-wide">
                              {groupName} ({groupItems.length})
                            </div>
                            <div className="border border-green-200/60 rounded-xl overflow-hidden bg-white divide-y divide-gray-100 shadow-2xs">
                              {groupItems.map((item: any) => (
                                <div key={item.id} className="p-3 flex justify-between items-center text-sm">
                                  <span className="font-semibold text-gray-800">{item.product?.name || "Unknown Product"}</span>
                                  <span className="font-bold text-green-800 bg-green-50 px-2.5 py-0.5 rounded-lg border border-green-200 text-xs">
                                    {item.quantity} {item.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.remarks && (
                        <div className="text-xs bg-green-50/60 p-3 rounded-xl border border-green-200/60 text-green-900 mb-4">
                          <strong>Chef Instructions: </strong>{order.remarks}
                        </div>
                      )}

                      {/* Supplier Splits / Purchase Orders section */}
                      <div className="mb-6 pt-4 border-t border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier Purchase Orders</h4>
                          {(!poMap.get(order.id) || poMap.get(order.id)?.length === 0) && ["PENDING", "SUBMITTED", "DRAFT", "REVIEWED"].includes(order.status.toUpperCase()) && (
                            <Button 
                              size="sm" 
                              onClick={() => handleGeneratePOs(order.id)}
                              disabled={isGeneratingPOsId === order.id}
                              className="h-8 text-xs bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl"
                            >
                              {isGeneratingPOsId === order.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  Splitting...
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3.5 h-3.5 mr-1" />
                                  Split Supplier Orders
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {(!poMap.get(order.id) || poMap.get(order.id)?.length === 0) ? (
                          <div className="text-xs bg-white text-gray-400 italic p-3 rounded-xl border border-dashed border-gray-200">
                            {["PENDING", "SUBMITTED", "DRAFT", "REVIEWED"].includes(order.status.toUpperCase())
                              ? "Ready to split! Click the button above to auto-generate supplier orders." 
                              : "No supplier orders generated for this order."}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {poMap.get(order.id)?.map((po) => (
                              <div key={po.id} className="p-3 bg-white border border-green-200/60 rounded-xl shadow-2xs flex items-center justify-between text-xs">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-gray-800">{po.supplier?.name || "Unassigned Supplier"}</span>
                                  <div className="flex gap-2 items-center text-[10px] text-gray-400">
                                    <span className="font-mono text-green-700">#{po.id.slice(0,8)}</span>
                                    <span>•</span>
                                    <span>₹{Number(po.total_cost).toFixed(2)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={po.status === "Received" ? "success" : po.status === "Sent" ? "default" : "secondary"}>
                                    {po.status}
                                  </Badge>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCopyWhatsApp(po.id)}
                                    className="h-7 text-[10px] flex items-center gap-1 border-green-200 text-green-800 hover:bg-green-50 rounded-lg"
                                  >
                                    {copiedPoId === po.id ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                                    {copiedPoId === po.id ? "Copied!" : "WhatsApp"}
                                  </Button>
                                  <Link href="/purchase-orders">
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-gray-500 rounded-lg">
                                      Receive
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions Container */}
                      <div className="flex flex-col sm:flex-row gap-2.5 justify-end border-t border-green-100 pt-4">
                        {!invDetails ? (
                          <div className="flex gap-2 w-full sm:w-auto">
                            {(!poMap.get(order.id) || poMap.get(order.id)?.length === 0) && ["PENDING", "SUBMITTED", "DRAFT", "REVIEWED"].includes(order.status.toUpperCase()) && (
                              <Button 
                                onClick={() => handleGeneratePOs(order.id)}
                                disabled={isGeneratingPOsId === order.id}
                                variant="outline"
                                className="w-full sm:w-auto border-green-200 text-green-800 hover:bg-green-50 font-semibold rounded-xl"
                              >
                                Split Suppliers
                              </Button>
                            )}
                            <Link href={`/orders/${order.id}/billing`} passHref className="flex-1 sm:flex-initial">
                              <Button className="w-full bg-green-700 hover:bg-green-800 font-semibold shadow-2xs rounded-xl">
                                Generate Invoice
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Link href={`/invoices/${invDetails.id}`} passHref className="flex-1 sm:flex-initial">
                              <Button variant="outline" className="w-full border-green-200 hover:bg-green-50 text-green-800 font-semibold shadow-2xs rounded-xl flex items-center justify-center gap-1.5">
                                <Eye className="w-4 h-4" /> View Invoice
                              </Button>
                            </Link>
                            <Button 
                              onClick={() => handleDownloadInvoice(invDetails.id, invDetails.number)}
                              disabled={isDownloadingId === invDetails.id}
                              className="flex-1 sm:flex-initial bg-green-700 hover:bg-green-800 text-white font-semibold shadow-2xs rounded-xl flex items-center justify-center gap-1.5"
                            >
                              {isDownloadingId === invDetails.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              Download PDF
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
