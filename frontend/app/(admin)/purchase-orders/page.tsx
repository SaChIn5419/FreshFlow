"use client";

import { useEffect, useState, useMemo } from "react";
import { purchaseOrderService, PurchaseOrder, PurchaseOrderItem } from "@/app/services/purchase_orders";
import { supplierService, Supplier } from "@/app/services/suppliers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clipboard,
  Check,
  Truck,
  Calendar,
  DollarSign,
  AlertCircle,
  Clock,
  Eye,
  CheckCircle,
  FileText,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Detail state
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Receiving items state
  const [receivingQuantities, setReceivingQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const poData = await purchaseOrderService.getPurchaseOrders();
      setPos(poData);
      const supData = await supplierService.getSuppliers();
      setSuppliers(supData);
    } catch (error) {
      toast.error("Failed to load purchase orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWhatsApp = async (poId: string) => {
    try {
      const text = await purchaseOrderService.getWhatsAppText(poId);
      await navigator.clipboard.writeText(text);
      setCopiedId(poId);
      toast.success("WhatsApp order message copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
      
      // Auto advance status to "Sent" if it was "Draft"
      const po = pos.find(p => p.id === poId);
      if (po && po.status === "Draft") {
        await purchaseOrderService.updatePurchaseOrder(poId, { status: "Sent" });
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to copy text.");
    }
  };

  const handleMarkSent = async (poId: string) => {
    try {
      await purchaseOrderService.updatePurchaseOrder(poId, { status: "Sent" });
      toast.success("Purchase order status updated to 'Sent'.");
      fetchData();
      if (selectedPO?.id === poId) {
        const updated = await purchaseOrderService.getPurchaseOrder(poId);
        setSelectedPO(updated);
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleOpenDetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const qtys: Record<string, number> = {};
    po.items.forEach(item => {
      // Default receiving quantity to ordered quantity if not already received
      qtys[item.id] = item.is_received ? Number(item.quantity_received) : Number(item.quantity_ordered);
    });
    setReceivingQuantities(qtys);
    setIsDetailDialogOpen(true);
  };

  const handleReceiveItem = async (itemId: string, isFull: boolean) => {
    if (!selectedPO) return;
    try {
      const targetQty = isFull 
        ? Number(selectedPO.items.find(i => i.id === itemId)?.quantity_ordered)
        : receivingQuantities[itemId] || 0;

      await purchaseOrderService.receivePOItem(selectedPO.id, itemId, {
        quantity_received: targetQty,
        is_received: true
      });
      
      toast.success("Item received status updated!");
      
      // Refresh modal PO and overall list
      const updatedPO = await purchaseOrderService.getPurchaseOrder(selectedPO.id);
      setSelectedPO(updatedPO);
      fetchData();
    } catch (err) {
      toast.error("Failed to update item status.");
    }
  };

  const filteredPOs = useMemo(() => {
    if (!selectedSupplierId) return pos;
    return pos.filter(po => po.supplier_id === selectedSupplierId);
  }, [pos, selectedSupplierId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchase Orders (Supplier Splits)</h1>
        <p className="text-sm text-gray-500">Track and dispatch procurements for restaurants.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="w-full sm:w-64 space-y-1.5">
          <Label htmlFor="supplier-filter">Filter by Supplier</Label>
          <select
            id="supplier-filter"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
          >
            <option value="">All Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">Loading purchase orders...</div>
        ) : filteredPOs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">No purchase orders found.</div>
        ) : (
          filteredPOs.map((po) => (
            <Card key={po.id} className="hover:border-green-500 transition-all duration-200 bg-white">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base">
                      {po.supplier?.name || "Placeholder Supplier"}
                    </h3>
                    <Badge variant={po.status === "Received" ? "success" : po.status === "Partially Received" ? "warning" : po.status === "Sent" ? "default" : "secondary"}>
                      {po.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="font-mono text-green-700 font-medium">#{po.id.slice(0, 8)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Delivery: {po.expected_delivery || "Today"}
                    </span>
                    <span>•</span>
                    <span><strong>{po.items?.length || 0}</strong> products requested</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center flex-wrap">
                  <div className="text-right mr-2 hidden sm:block">
                    <div className="text-xs text-gray-400 font-medium">Est. Cost</div>
                    <div className="font-bold text-gray-900">₹{Number(po.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => handleCopyWhatsApp(po.id)} 
                    className="border-green-200 text-green-700 hover:bg-green-50 flex items-center gap-1.5"
                  >
                    {copiedId === po.id ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                    {copiedId === po.id ? "Copied!" : "WhatsApp Text"}
                  </Button>

                  {po.status === "Draft" && (
                    <Button onClick={() => handleMarkSent(po.id)} className="bg-green-700 hover:bg-green-800 text-white">
                      Mark Sent
                    </Button>
                  )}

                  <Button variant="ghost" onClick={() => handleOpenDetails(po)} className="text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Receive Produce
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* PO Items Receiving Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          {selectedPO && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle>Receive Produce: {selectedPO.supplier?.name}</DialogTitle>
                  <Badge variant="outline">{selectedPO.status}</Badge>
                </div>
                <p className="text-xs text-gray-500 font-mono">PO ID: #{selectedPO.id}</p>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Ordered Qty</TableHead>
                      <TableHead>Cost Price</TableHead>
                      <TableHead>Receive Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPO.items.map((item) => (
                      <TableRow key={item.id} className={item.is_received ? "bg-green-50/20" : ""}>
                        <TableCell className="font-semibold text-gray-800">
                          {item.product?.name || "Unknown Product"}
                        </TableCell>
                        <TableCell className="font-bold">
                          {Number(item.quantity_ordered)} {item.unit}
                        </TableCell>
                        <TableCell>
                          ₹{Number(item.cost_price_at_time).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {item.is_received ? (
                            <span className="text-sm font-semibold text-green-700">
                              {Number(item.quantity_received)} {item.unit}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 w-24">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={receivingQuantities[item.id] || 0}
                                onChange={(e) => setReceivingQuantities({
                                  ...receivingQuantities,
                                  [item.id]: parseFloat(e.target.value) || 0
                                })}
                                className="h-8 p-1 text-center"
                              />
                              <span className="text-xs text-gray-400">{item.unit}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.is_received ? (
                            <Badge className="bg-green-100 text-green-800">Received</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">Awaiting</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          {!item.is_received ? (
                            <div className="flex justify-end gap-1.5">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReceiveItem(item.id, false)}
                                className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                              >
                                Partial
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleReceiveItem(item.id, true)}
                                className="h-7 text-xs bg-green-700 hover:bg-green-800 text-white"
                              >
                                Full
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 font-bold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Done
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <DialogFooter>
                {selectedPO.status === "Draft" && (
                  <Button onClick={() => handleMarkSent(selectedPO.id)} className="bg-blue-700 hover:bg-blue-800 text-white mr-auto">
                    Mark Entire PO Sent
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
