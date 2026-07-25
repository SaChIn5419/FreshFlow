"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { orderService, OrderItem } from "@/app/services/orders";
import { invoiceService, InvoiceItemCreate } from "@/app/services/invoices";
import { customerService } from "@/app/services/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function BillingPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrder(id),
  });

  const { data: latestPrices } = useQuery<Record<string, number>>({
    queryKey: ["customer_prices", order?.customer_id],
    queryFn: () => order ? customerService.getCustomerPrices(order.customer_id) : Promise.resolve({}),
    enabled: !!order,
  });

  // State to hold quantities and prices
  // key: order_item.id
  const [itemsData, setItemsData] = useState<Record<string, { qty: number; price: string }>>({});
  
  useEffect(() => {
    if (order && Object.keys(itemsData).length === 0) {
      const initialData: Record<string, { qty: number; price: string }> = {};
      order.items.forEach(item => {
        let defaultPrice = "";
        if (item.unit_price != null) {
          defaultPrice = item.unit_price.toString();
        } else if (latestPrices && latestPrices[item.product.name]) {
          defaultPrice = latestPrices[item.product.name].toString();
        } else if (item.product.default_price) {
          defaultPrice = item.product.default_price.toString();
        }
        initialData[item.id] = { qty: item.quantity, price: defaultPrice };
      });
      setItemsData(initialData);
    }
  }, [order, itemsData, latestPrices]);

  const generateInvoice = useMutation({
    mutationFn: invoiceService.generateInvoice,
    onSuccess: (invoice) => {
      toast.success("Invoice created");
      router.push(`/invoices/${invoice.id}`);
    },
    onError: () => {
      toast.error("Failed to generate invoice");
    }
  });

  const handleQtyChange = (itemId: string, val: string) => {
    const qty = parseFloat(val);
    setItemsData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], qty: isNaN(qty) ? 0 : qty }
    }));
  };

  const updatePriceMutation = useMutation({
    mutationFn: ({ orderId, itemId, price }: { orderId: string, itemId: string, price: number }) => 
      orderService.updateItemPrice(orderId, itemId, price),
    onError: () => {
      toast.error("Failed to autosave price");
    }
  });

  const handlePriceChange = (itemId: string, val: string) => {
    setItemsData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], price: val }
    }));
    
    // Autosave functionality
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && order) {
      updatePriceMutation.mutate({ orderId: order.id, itemId, price: parsed });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colType: 'qty' | 'price') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to price if in qty, or to next row's qty if in price
      let nextId = "";
      if (colType === 'qty') {
        nextId = `price-${rowIdx}`;
      } else {
        nextId = `qty-${rowIdx + 1}`;
      }
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        nextEl.focus();
        (nextEl as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevId = `${colType}-${rowIdx - 1}`;
      const prevEl = document.getElementById(prevId);
      if (prevEl) {
        prevEl.focus();
        (prevEl as HTMLInputElement).select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextId = `${colType}-${rowIdx + 1}`;
      const nextEl = document.getElementById(nextId);
      if (nextEl) {
        nextEl.focus();
        (nextEl as HTMLInputElement).select();
      }
    }
  };

  const { subtotal, allPriced } = useMemo(() => {
    let sum = 0;
    let all = true;
    Object.values(itemsData).forEach(item => {
      const price = parseFloat(item.price);
      if (isNaN(price)) {
        all = false;
      } else {
        sum += item.qty * price;
      }
    });
    return { subtotal: sum, allPriced: all && Object.keys(itemsData).length > 0 };
  }, [itemsData]);

  const onGenerate = () => {
    if (!order) return;
    
    toast.info("Generating...");
    const invoiceItems: InvoiceItemCreate[] = order.items.map(item => ({
      order_item_id: item.id,
      quantity: itemsData[item.id].qty,
      unit_price: parseFloat(itemsData[item.id].price)
    }));

    generateInvoice.mutate({
      order_id: order.id,
      items: invoiceItems
    });
  };

  if (isLoading || !order) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/orders" className="hover:text-gray-900 flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Orders
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{order.customer.restaurant_name} — Billing</h1>
          <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)} · {order.items.length} items · {format(new Date(order.created_at), "dd MMM yyyy")}</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              toast.info("Downloading packing slip...");
              orderService.downloadPackingSlip(order.id).catch(() => {
                toast.error("Failed to download packing slip");
              });
            }}
          >
            Print Packing Slip
          </Button>
          <Button 
            onClick={onGenerate}
            disabled={!allPriced || generateInvoice.isPending}
            className={allPriced ? "bg-green-700 hover:bg-green-800" : "bg-gray-300 text-gray-500"}
          >
            Generate Invoice ▶
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-200 rounded-md overflow-hidden relative">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-32 text-right">Qty</TableHead>
              <TableHead className="w-24">Unit</TableHead>
              <TableHead className="w-40 text-right">Price (₹)</TableHead>
              <TableHead className="w-32 text-right pr-6">Total (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, idx) => {
              const data = itemsData[item.id] || { qty: item.quantity, price: "" };
              const priceNum = parseFloat(data.price);
              const rowTotal = isNaN(priceNum) ? null : data.qty * priceNum;
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-center text-gray-400">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-right">
                    <Input 
                      id={`qty-${idx}`}
                      type="number"
                      min="0"
                      step="0.01"
                      className="text-right text-gray-500 h-9 border-transparent hover:border-gray-300 focus:border-green-500 bg-gray-50/50"
                      value={data.qty}
                      onChange={e => handleQtyChange(item.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, idx, 'qty')}
                    />
                  </TableCell>
                  <TableCell className="text-gray-500">{item.unit}</TableCell>
                  <TableCell className="text-right">
                    <Input 
                      id={`price-${idx}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="text-right font-medium h-9 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                      value={data.price}
                      onChange={e => handlePriceChange(item.id, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, idx, 'price')}
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium pr-6 tabular-nums">
                    {rowTotal !== null ? `₹${rowTotal.toFixed(2)}` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Totals Footer */}
      <div className="mt-8 bg-white border border-gray-200 rounded-md p-6 shadow-sm flex justify-end">
        <div className="w-80">
          <div className="flex justify-between py-2 text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium">{allPriced ? `₹${subtotal.toFixed(2)}` : "—"}</span>
          </div>
          <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200 pb-4">
            <span>GST (0%)</span>
            <span className="tabular-nums font-medium">₹0.00</span>
          </div>
          <div className="flex justify-between py-4 text-xl font-bold">
            <span>Grand Total</span>
            <span className="tabular-nums">{allPriced ? `₹${subtotal.toFixed(2)}` : "—"}</span>
          </div>
          <Button 
            onClick={onGenerate}
            disabled={!allPriced || generateInvoice.isPending}
            size="lg"
            className={`w-full mt-4 ${allPriced ? "bg-green-700 hover:bg-green-800" : "bg-gray-300 text-gray-500"}`}
          >
            {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}
