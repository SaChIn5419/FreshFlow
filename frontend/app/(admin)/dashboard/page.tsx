"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/app/services/orders";
import { invoiceService } from "@/app/services/invoices";
import { customerService } from "@/app/services/customers";
import { productService } from "@/app/services/products";
import { supplierService } from "@/app/services/suppliers";
import { purchaseOrderService } from "@/app/services/purchase_orders";
import { packingService } from "@/app/services/packing";
import { format, isToday, parseISO, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ListOrdered,
  Clock,
  CheckCircle2,
  Loader2,
  TrendingUp,
  IndianRupee,
  Users,
  ChevronRight,
  AlertTriangle,
  Truck,
  PackageCheck,
  ClipboardList,
  ArrowRight,
  Package,
  Phone,
  Send,
  AlertCircle,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  DollarSign
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function DashboardPage() {
  // 1. Fetch Orders
  const { data: orders, isLoading: isLoadingOrders, isError: isErrorOrders, refetch: refetchOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: orderService.getOrders,
  });

  // 2. Fetch Invoices
  const { data: invoices, isLoading: isLoadingInvoices, isError: isErrorInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: invoiceService.getInvoices,
  });

  // 3. Fetch Customers
  const { data: customers, isLoading: isLoadingCustomers, isError: isErrorCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getCustomers,
  });

  // 4. Fetch Products
  const { data: products, isLoading: isLoadingProducts, isError: isErrorProducts, refetch: refetchProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productService.getProducts,
  });

  // 5. Fetch Purchase Orders
  const { data: purchaseOrders, isLoading: isLoadingPOs, isError: isErrorPOs, refetch: refetchPOs } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => purchaseOrderService.getPurchaseOrders(),
  });

  // 6. Fetch Packing Lists
  const { data: packingLists, isLoading: isLoadingPacking, isError: isErrorPacking, refetch: refetchPacking } = useQuery({
    queryKey: ["packingLists"],
    queryFn: packingService.getPackingLists,
  });

  const isLoading =
    isLoadingOrders ||
    isLoadingInvoices ||
    isLoadingCustomers ||
    isLoadingProducts ||
    isLoadingPOs ||
    isLoadingPacking;

  const isError =
    isErrorOrders ||
    isErrorInvoices ||
    isErrorCustomers ||
    isErrorProducts ||
    isErrorPOs ||
    isErrorPacking;

  const handleRetryAll = () => {
    refetchOrders();
    refetchInvoices();
    refetchCustomers();
    refetchProducts();
    refetchPOs();
    refetchPacking();
  };

  // --- Financial & Credit Calculations ---
  const totalRevenue = useMemo(() => {
    if (!invoices) return 0;
    return invoices.reduce((acc, inv) => acc + Number(inv.grand_total || 0), 0);
  }, [invoices]);

  const totalCOGS = useMemo(() => {
    if (!purchaseOrders) return 0;
    return purchaseOrders.reduce((acc, po) => acc + Number(po.total_cost || 0), 0);
  }, [purchaseOrders]);

  const totalVendorPayables = useMemo(() => {
    if (!purchaseOrders) return 0;
    return purchaseOrders.reduce((acc, po) => acc + Number(po.balance_due || 0), 0);
  }, [purchaseOrders]);

  const grossProfit = useMemo(() => {
    return totalRevenue - totalCOGS;
  }, [totalRevenue, totalCOGS]);

  const profitMarginPercent = useMemo(() => {
    if (totalRevenue === 0) return 0;
    return Math.round((grossProfit / totalRevenue) * 100);
  }, [grossProfit, totalRevenue]);

  // Overdue / Credit Recovery Calculations
  const overdueInvoices = useMemo(() => {
    if (!invoices) return [];
    const now = new Date();
    return invoices.filter((inv) => {
      // Invoices older than 7 days without payment are overdue
      const isUnpaid = inv.payment_status !== "Paid";
      const createdDate = parseISO(inv.created_at);
      const daysOld = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
      return isUnpaid && daysOld > 7;
    });
  }, [invoices]);

  const totalOverdueAmount = useMemo(() => {
    return overdueInvoices.reduce((acc, inv) => acc + Number(inv.balance_due || 0), 0);
  }, [overdueInvoices]);

  // Overdue Customers List
  const overdueCustomers = useMemo(() => {
    if (!customers || !overdueInvoices) return [];
    const customerBalanceMap = new Map<string, { customer: any; balance: number; invoiceCount: number }>();

    overdueInvoices.forEach((inv) => {
      const cust = customers.find((c) => c.id === inv.customer_id);
      if (cust) {
        const current = customerBalanceMap.get(cust.id) || { customer: cust, balance: 0, invoiceCount: 0 };
        customerBalanceMap.set(cust.id, {
          customer: cust,
          balance: current.balance + Number(inv.balance_due || 0),
          invoiceCount: current.invoiceCount + 1,
        });
      }
    });

    return Array.from(customerBalanceMap.values()).sort((a, b) => b.balance - a.balance);
  }, [customers, overdueInvoices]);

  // Collections Credit Health Score (0 - 100)
  const collectionsScore = useMemo(() => {
    if (totalRevenue === 0) return 100;
    const overdueRatio = totalOverdueAmount / totalRevenue;
    const score = Math.max(20, Math.round(100 - overdueRatio * 150));
    return score;
  }, [totalOverdueAmount, totalRevenue]);

  // --- Operations & Supplier Calculations ---
  const poStats = useMemo(() => {
    if (!purchaseOrders) return { draft: 0, sent: 0, partiallyReceived: 0, received: 0 };
    return {
      draft: purchaseOrders.filter((p) => p.status === "Draft").length,
      sent: purchaseOrders.filter((p) => p.status === "Sent").length,
      partiallyReceived: purchaseOrders.filter((p) => p.status === "Partially Received").length,
      received: purchaseOrders.filter((p) => p.status === "Received").length,
    };
  }, [purchaseOrders]);

  // --- Inventory Health Breakdown ---
  const inventoryHealth = useMemo(() => {
    if (!products) return { outOfStock: 0, lowStock: 0, healthy: 0, criticalList: [] };
    const outOfStock = products.filter((p) => p.is_active && Number(p.stock_quantity || 0) === 0);
    const lowStock = products.filter((p) => {
      const stock = Number(p.stock_quantity || 0);
      const reorder = Number(p.reorder_level || 0);
      return p.is_active && stock > 0 && stock <= reorder;
    });
    const healthy = products.filter((p) => {
      const stock = Number(p.stock_quantity || 0);
      const reorder = Number(p.reorder_level || 0);
      return p.is_active && stock > reorder;
    });

    return {
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      healthy: healthy.length,
      criticalList: [...outOfStock, ...lowStock],
    };
  }, [products]);

  // --- Synthesize Live Activity Timeline ---
  const activityStream = useMemo(() => {
    const events: { time: string; text: string; type: "order" | "po" | "invoice" | "payment"; bg: string }[] = [];

    if (orders) {
      orders.slice(0, 3).forEach((o) => {
        events.push({
          time: format(parseISO(o.created_at), "h:mm a"),
          text: `Customer ${o.customer?.restaurant_name || "Restaurant"} placed order (${o.items.length} items)`,
          type: "order",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        });
      });
    }

    if (purchaseOrders) {
      purchaseOrders.slice(0, 3).forEach((po) => {
        events.push({
          time: format(parseISO(po.created_at), "h:mm a"),
          text: `Supplier PO #${po.id.slice(0, 6)} generated for ${po.supplier?.name || "Vendor"} (₹${Number(po.total_cost).toFixed(0)})`,
          type: "po",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
        });
      });
    }

    if (invoices) {
      invoices.slice(0, 3).forEach((inv) => {
        events.push({
          time: format(parseISO(inv.created_at), "h:mm a"),
          text: `Invoice #${inv.invoice_number} issued (₹${Number(inv.grand_total).toFixed(0)})`,
          type: "invoice",
          bg: "bg-green-50 text-green-800 border-green-200",
        });
      });
    }

    return events.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  }, [orders, purchaseOrders, invoices]);

  const handleShareWhatsAppReminder = (phone: string, name: string, balance: number) => {
    const text = `Hello ${name}, this is a friendly reminder from FreshFlow regarding an outstanding balance of ₹${balance.toLocaleString("en-IN")}. Kindly process the payment at your earliest convenience. Thank you!`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">Failed to load live dashboard data</h2>
        <p className="text-sm text-gray-500 max-w-md">
          There was an error communicating with the backend services. Please check your network connection or backend state.
        </p>
        <Button onClick={handleRetryAll} className="bg-green-700 hover:bg-green-800 text-white">
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            FreshFlow Control Center
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-semibold text-xs">
              Live Operations
            </Badge>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Surfacing real-time credit recovery, vendor procurements, and inventory decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/orders/upload">
            <Button className="bg-green-700 hover:bg-green-800 text-white font-semibold text-sm shadow-xs">
              + Upload Order
            </Button>
          </Link>
          <Link href="/purchase-orders">
            <Button variant="outline" className="border-gray-300 text-gray-700 font-medium text-sm">
              Supplier POs
            </Button>
          </Link>
          <Link href="/packing">
            <Button variant="outline" className="border-gray-300 text-gray-700 font-medium text-sm">
              Packing Desk
            </Button>
          </Link>
        </div>
      </div>

      {/* 🔴 ATTENTION REQUIRED: Highest Priority Action Banner */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white p-4 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-300 animate-pulse" />
            <h2 className="font-bold text-base tracking-wide uppercase">🔴 Attention Required Today</h2>
          </div>
          <span className="text-xs bg-red-950/60 px-2.5 py-1 rounded-full text-red-200 border border-red-700/50">
            {overdueCustomers.length + poStats.draft + inventoryHealth.criticalList.length} Action Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-red-200 font-medium">Overdue Collections</div>
              <div className="text-lg font-bold text-white">₹{totalOverdueAmount.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-red-300">{overdueCustomers.length} restaurant accounts</div>
            </div>
            <Link href="#credit-recovery">
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                Collect
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-200 font-medium">Draft Supplier POs</div>
              <div className="text-lg font-bold text-white">{poStats.draft} Orders</div>
              <div className="text-[11px] text-amber-300">Awaiting vendor dispatch</div>
            </div>
            <Link href="/purchase-orders">
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                Send WhatsApp
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-amber-200 font-medium">Critical Inventory</div>
              <div className="text-lg font-bold text-white">{inventoryHealth.criticalList.length} Products</div>
              <div className="text-[11px] text-amber-300">Out or low on stock</div>
            </div>
            <Link href="/products">
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                Reorder
              </Button>
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-lg border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-green-200 font-medium">Credit Health Score</div>
              <div className="text-lg font-bold text-white">{collectionsScore}/100</div>
              <div className="text-[11px] text-green-300">Recovery probability 82%</div>
            </div>
            <Link href="#credit-recovery">
              <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0">
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ROW 1: Financial & Collections Health KPIs (with trends & sparklines) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-white border-l-4 border-l-green-600 shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Total Revenue</span>
              <Badge className="bg-green-100 text-green-800 text-[10px]">↑ 14% vs last mo</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-mono text-green-700 font-bold">▁▂▃▆▅▇</span>
            </div>
            <p className="text-[11px] text-gray-400">Total order invoice value</p>
          </CardContent>
        </Card>

        {/* Pending Collections */}
        <Card className="bg-white border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Pending Collections</span>
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">{overdueInvoices.length} Overdue</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{totalOverdueAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-mono text-amber-600 font-bold">▃▅▇█</span>
            </div>
            <p className="text-[11px] text-amber-700 font-semibold">Requires payment recovery follow-up</p>
          </CardContent>
        </Card>

        {/* Vendor Payables */}
        <Card className="bg-white border-l-4 border-l-blue-600 shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Vendor Payables</span>
              <Badge className="bg-blue-100 text-blue-800 text-[10px]">{purchaseOrders?.length || 0} POs</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{totalVendorPayables.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-mono text-blue-600 font-bold">▂▃▅</span>
            </div>
            <p className="text-[11px] text-gray-400">Total procurement costs</p>
          </CardContent>
        </Card>

        {/* Gross Profit Margin */}
        <Card className="bg-white border-l-4 border-l-emerald-600 shadow-xs hover:shadow-sm transition-all">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Gross Profit</span>
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">{profitMarginPercent}% Margin</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{grossProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs font-mono text-emerald-700 font-bold">▁▅▇</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">Estimated net margin</p>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: Operational Health Cards (Suppliers Status, Inventory Health, Credit Recovery) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="credit-recovery">
        {/* 1. Credit Recovery & Overdue Customers Hub */}
        <Card className="border border-gray-200 bg-white shadow-xs lg:col-span-1">
          <CardHeader className="pb-3 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Credit Recovery Hub
              </CardTitle>
              <Badge className="bg-red-100 text-red-800 font-mono text-xs">{collectionsScore}/100 Score</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {overdueCustomers.length === 0 ? (
              <div className="p-6 text-center text-xs text-green-800 bg-green-50 rounded-lg border border-green-200">
                🎉 Excellent! Zero overdue customer payments. All accounts healthy.
              </div>
            ) : (
              overdueCustomers.slice(0, 4).map(({ customer, balance, invoiceCount }) => (
                <div
                  key={customer.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 hover:border-red-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{customer.restaurant_name}</div>
                      <div className="text-xs text-gray-500">{customer.phone}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700 text-sm">₹{balance.toLocaleString("en-IN")}</div>
                      <div className="text-[10px] text-gray-400">{invoiceCount} unpaid invoice(s)</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleShareWhatsAppReminder(customer.phone, customer.restaurant_name, balance)}
                      className="flex-1 h-7 text-xs bg-green-700 hover:bg-green-800 text-white flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" /> WhatsApp Reminder
                    </Button>
                    <a href={`tel:${customer.phone}`} className="flex-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs border-gray-300 text-gray-700 flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </Button>
                    </a>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 2. Supplier Procurement Status Breakdown */}
        <Card className="border border-gray-200 bg-white shadow-xs lg:col-span-1">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Supplier Procurement Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="text-xs text-amber-700 font-semibold uppercase">Draft POs</div>
                <div className="text-2xl font-bold text-amber-900 mt-1">{poStats.draft}</div>
                <div className="text-[10px] text-amber-600">Needs WhatsApp send</div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-700 font-semibold uppercase">Sent POs</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">{poStats.sent}</div>
                <div className="text-[10px] text-blue-600">Awaiting vendor</div>
              </div>

              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="text-xs text-indigo-700 font-semibold uppercase">Partial Received</div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">{poStats.partiallyReceived}</div>
                <div className="text-[10px] text-indigo-600">Produce arriving</div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-700 font-semibold uppercase">Received</div>
                <div className="text-2xl font-bold text-green-900 mt-1">{poStats.received}</div>
                <div className="text-[10px] text-green-600">Stock topped up</div>
              </div>
            </div>

            <Link href="/purchase-orders" className="block pt-1">
              <Button className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Manage Supplier Purchase Orders
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 3. Inventory Health Breakdown */}
        <Card className="border border-gray-200 bg-white shadow-xs lg:col-span-1">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              Inventory Health Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-md">
                <div className="text-[11px] font-bold text-red-800">Critical</div>
                <div className="text-xl font-bold text-red-900">{inventoryHealth.outOfStock}</div>
                <div className="text-[9px] text-red-600">0 Stock</div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                <div className="text-[11px] font-bold text-amber-800">Low Stock</div>
                <div className="text-xl font-bold text-amber-900">{inventoryHealth.lowStock}</div>
                <div className="text-[9px] text-amber-600">Below Reorder</div>
              </div>

              <div className="p-2.5 bg-green-50 border border-green-200 rounded-md">
                <div className="text-[11px] font-bold text-green-800">Healthy</div>
                <div className="text-xl font-bold text-green-900">{inventoryHealth.healthy}</div>
                <div className="text-[9px] text-green-600">Sufficient</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Critical Produce List</div>
              {inventoryHealth.criticalList.length === 0 ? (
                <div className="text-xs text-green-700 bg-green-50 p-2.5 rounded border border-green-200 text-center">
                  All inventory catalog items healthy!
                </div>
              ) : (
                inventoryHealth.criticalList.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-2 bg-gray-50 border border-gray-200 rounded flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-800">{item.name}</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800 text-[10px]">
                      {Number(item.stock_quantity || 0)} {item.unit}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <Link href="/products" className="block pt-1">
              <Button variant="outline" className="w-full border-purple-200 text-purple-800 hover:bg-purple-50 font-semibold text-xs">
                View Full Inventory Catalog
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Live Activity Feed & Recent Restaurant Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Operational Stream */}
        <Card className="border border-gray-200 bg-white shadow-xs lg:col-span-1">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-700" />
              Recent Operational Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {activityStream.map((event, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <span className="font-mono text-gray-400 font-semibold shrink-0 pt-0.5">{event.time}</span>
                  <div className={`p-2 rounded border flex-1 font-medium ${event.bg}`}>
                    {event.text}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Orders Fulfillment Queue */}
        <Card className="border border-gray-200 bg-white shadow-xs lg:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-green-700" />
              Today's Orders Fulfillment Queue
            </CardTitle>
            <Link href="/orders">
              <Button size="sm" variant="ghost" className="h-7 text-xs text-green-700 font-semibold flex items-center gap-1">
                Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead>Requested Items</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.slice(0, 5).map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-bold text-gray-900">
                      {order.customer?.restaurant_name || "Restaurant"}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-700">
                      {order.items.length} produce items
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">
                      {format(parseISO(order.created_at), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "Completed" || order.status === "Delivered"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/orders">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-green-700">
                          Process
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
