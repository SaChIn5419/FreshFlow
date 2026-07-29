"use client";

import { useEffect, useState, useMemo } from "react";
import { packingService, PackingList, PackingListItem } from "@/app/services/packing";
import { orderService, Order } from "@/app/services/orders";
import { PageShell } from "@/app/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Package,
  PackageCheck,
  Clock,
  Search,
  User,
  Sparkles,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PackingPage() {
  const [packingLists, setPackingLists] = useState<PackingList[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "packed">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Selected Packing List for Checklist Modal
  const [activePackingList, setActivePackingList] = useState<PackingList | null>(null);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [packerName, setPackerName] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);

      const plData = await packingService.getPackingLists();
      setPackingLists(plData);
    } catch (error) {
      toast.error("Failed to load warehouse packing lists.");
    } finally {
      setIsLoading(false);
    }
  };

  const orderMap = useMemo(() => {
    return new Map(orders.map((o) => [o.id, o]));
  }, [orders]);

  const handleOpenChecklist = async (orderId: string) => {
    try {
      const pl = await packingService.getPackingListForOrder(orderId);
      setActivePackingList(pl);
      setPackerName(pl.packed_by || "");
      setIsChecklistOpen(true);
    } catch (err) {
      toast.error("Could not load packing list for this order.");
    }
  };

  const handleToggleItemPacked = async (item: PackingListItem) => {
    if (!activePackingList) return;
    try {
      const newStatus = !item.is_packed;
      await packingService.updatePackingItem(item.id, {
        is_packed: newStatus,
        quantity_packed: newStatus ? item.quantity_requested : 0,
      });

      const updatedList = await packingService.getPackingList(activePackingList.id);
      setActivePackingList(updatedList);
      fetchData();

      if (updatedList.status === "Packed") {
        toast.success("🎉 Order packing completed! Order status updated to Packed.");
      }
    } catch (err) {
      toast.error("Failed to update item packing status.");
    }
  };

  const handlePackAll = async () => {
    if (!activePackingList) return;
    try {
      for (const item of activePackingList.items) {
        if (!item.is_packed) {
          await packingService.updatePackingItem(item.id, {
            is_packed: true,
            quantity_packed: item.quantity_requested,
          });
        }
      }
      const updatedList = await packingService.getPackingList(activePackingList.id);
      setActivePackingList(updatedList);
      fetchData();
      toast.success("🎉 All items marked as packed!");
    } catch (err) {
      toast.error("Failed to pack all items.");
    }
  };

  const handleSavePackerName = async () => {
    if (!activePackingList) return;
    try {
      await packingService.updatePackingList(activePackingList.id, { packed_by: packerName });
      toast.success("Packer name saved.");
    } catch (err) {
      toast.error("Failed to save packer name.");
    }
  };

  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      const restaurantName = o.customer?.restaurant_name || "";
      const matchesSearch = restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const pl = packingLists.find((p) => p.order_id === o.id);
      const plStatus = pl?.status || "Pending";

      if (!matchesSearch) return false;
      if (filterStatus === "pending") return plStatus !== "Packed";
      if (filterStatus === "packed") return plStatus === "Packed";
      return true;
    });
  }, [orders, packingLists, searchTerm, filterStatus]);

  return (
    <PageShell
      title="Warehouse Packing Desk"
      subtitle="Interactive touch-checklist for warehouse packing teams to verify and check off produce quantities."
      badgeText="Warehouse Fulfillment"
    >
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-green-100/80 shadow-xs">
          <div className="flex items-center space-x-2 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-200/60 flex-1 max-w-md">
            <Search className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              placeholder="Search restaurant orders to pack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filterStatus === "pending" ? "default" : "outline"}
              onClick={() => setFilterStatus("pending")}
              className={filterStatus === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold" : "rounded-xl font-bold"}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Pending ({orders.filter(o => (packingLists.find(p=>p.order_id===o.id)?.status || "Pending") !== "Packed").length})
            </Button>

            <Button
              variant={filterStatus === "packed" ? "default" : "outline"}
              onClick={() => setFilterStatus("packed")}
              className={filterStatus === "packed" ? "bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold" : "rounded-xl font-bold"}
            >
              <PackageCheck className="w-4 h-4 mr-1.5" />
              Packed ({orders.filter(o => packingLists.find(p=>p.order_id===o.id)?.status === "Packed").length})
            </Button>

            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
              className="rounded-xl font-bold"
            >
              All Logs
            </Button>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white border border-green-100 rounded-2xl">
              Loading warehouse packing orders...
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 bg-white border border-green-100 rounded-2xl">
              No packing orders found for this view.
            </div>
          ) : (
            displayedOrders.map((order) => {
              const pl = packingLists.find((p) => p.order_id === order.id);
              const totalItems = order.items.length;
              const packedItemsCount = pl?.items.filter((i) => i.is_packed).length || 0;
              const isPacked = pl?.status === "Packed";
              const isPartial = packedItemsCount > 0 && !isPacked;
              const percent = totalItems > 0 ? Math.round((packedItemsCount / totalItems) * 100) : 0;

              return (
                <Card 
                  key={order.id} 
                  className={`hover:border-green-600 transition-all duration-200 cursor-pointer rounded-2xl shadow-xs ${isPacked ? "bg-green-50/30 border-green-200" : "bg-white border-green-100"}`}
                  onClick={() => handleOpenChecklist(order.id)}
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">{order.customer?.restaurant_name || "Restaurant"}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">Order #{order.id.slice(0, 8)}</p>
                      </div>
                      <Badge variant={isPacked ? "success" : isPartial ? "warning" : "secondary"} className="font-bold">
                        {isPacked ? "Packed" : isPartial ? "In Progress" : "Awaiting Pack"}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-600">Packing Progress</span>
                        <span className={isPacked ? "text-green-800 font-extrabold" : "text-amber-800 font-extrabold"}>
                          {packedItemsCount} of {totalItems} items ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${isPacked ? "bg-green-600" : "bg-amber-500"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                      <span>{order.items.length} items requested</span>
                      <span className="text-green-800 font-extrabold flex items-center gap-1">
                        Open Checklist <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Interactive Checklist Modal */}
        <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
          <DialogContent className="max-w-2xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            {activePackingList && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between pr-6">
                    <div>
                      <DialogTitle className="text-xl font-extrabold text-gray-900">
                        Pack Order: {orderMap.get(activePackingList.order_id)?.customer?.restaurant_name}
                      </DialogTitle>
                      <p className="text-xs text-gray-500 font-mono mt-1">Order #{activePackingList.order_id}</p>
                    </div>
                    <Badge variant={activePackingList.status === "Packed" ? "success" : "warning"} className="text-sm px-3 py-1 font-bold">
                      {activePackingList.status}
                    </Badge>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  <div className="flex items-center gap-2 bg-green-50/50 p-3 rounded-xl border border-green-200/60">
                    <User className="w-4 h-4 text-green-700" />
                    <Input
                      placeholder="Enter Staff / Packer Name..."
                      value={packerName}
                      onChange={(e) => setPackerName(e.target.value)}
                      onBlur={handleSavePackerName}
                      className="h-8 text-sm bg-white rounded-lg border-gray-200"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSavePackerName} className="h-8 text-xs font-bold text-green-800">
                      Save
                    </Button>
                  </div>

                  <div className="bg-green-50/80 p-4 rounded-xl border border-green-200/60 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-green-800 uppercase tracking-wider">Packed Status</div>
                      <div className="text-sm font-extrabold text-green-950 mt-0.5">
                        {activePackingList.items.filter((i) => i.is_packed).length} / {activePackingList.items.length} Items Checked Off
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handlePackAll}
                      disabled={activePackingList.status === "Packed"}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold flex items-center gap-1.5 rounded-xl"
                    >
                      <Sparkles className="w-4 h-4" />
                      Pack All Items
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items Checklist</h4>
                    <div className="divide-y divide-gray-100 border border-green-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                      {activePackingList.items.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItemPacked(item)}
                          className={`p-4 flex items-center justify-between cursor-pointer select-none transition-all duration-150 ${
                            item.is_packed ? "bg-green-50/40" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.is_packed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300 shrink-0" />
                            )}
                            <div>
                              <div className={`font-bold text-base ${item.is_packed ? "line-through text-gray-500" : "text-gray-900"}`}>
                                {item.product?.name || "Product"}
                              </div>
                              <div className="text-xs text-gray-500">
                                Category: {item.product?.category || "General Produce"}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-extrabold px-3 py-1 rounded-xl ${item.is_packed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                              {Number(item.quantity_requested)} {item.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsChecklistOpen(false)} className="rounded-xl font-bold">
                    Close Checklist
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
