"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supplierService, Supplier, ProductSupplier, ProductSupplierCreate } from "@/app/services/suppliers";
import { productService, Product } from "@/app/services/products";
import { purchaseOrderService, PurchaseOrder } from "@/app/services/purchase_orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Plus,
  Trash2,
  AlertTriangle,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Link product state
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkFormData, setLinkFormData] = useState<ProductSupplierCreate>({
    product_id: "",
    cost_price: 0,
    is_primary_supplier: true,
    notes: "",
  });

  useEffect(() => {
    if (id) {
      fetchSupplierDetails();
    }
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      setIsLoading(true);
      const supplierData = await supplierService.getSupplier(id);
      setSupplier(supplierData);

      const poData = await purchaseOrderService.getPurchaseOrders({ supplier_id: id });
      setPurchaseOrders(poData);

      const productsData = await productService.getProducts();
      setAllProducts(productsData);
    } catch (error) {
      toast.error("Failed to load supplier details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkFormData.product_id) {
      toast.error("Please select a product.");
      return;
    }
    try {
      await supplierService.linkProductToSupplier(id, linkFormData);
      toast.success("Product linked successfully!");
      setIsLinkDialogOpen(false);
      setLinkFormData({ product_id: "", cost_price: 0, is_primary_supplier: true, notes: "" });
      fetchSupplierDetails();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to link product.");
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    if (confirm("Are you sure you want to unlink this product?")) {
      try {
        await supplierService.unlinkProductFromSupplier(id, productId);
        toast.success("Product unlinked.");
        fetchSupplierDetails();
      } catch (error) {
        toast.error("Failed to unlink product.");
      }
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading supplier details...</div>;
  }

  if (!supplier) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-red-600">Supplier Not Found</h2>
        <Button onClick={() => router.push("/suppliers")} className="mt-4">
          Back to Suppliers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{supplier.name}</h1>
            <Badge variant={supplier.is_active ? "success" : "secondary"}>
              {supplier.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">Supplier Account Profile and Catalog.</p>
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="md:col-span-2 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Contact & Shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Contact Phone</div>
                  <div className="text-sm font-semibold text-gray-900">{supplier.phone || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp Number
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{supplier.whatsapp_number || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Email Address</div>
                  <div className="text-sm font-semibold text-gray-900">{supplier.email || "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-xs text-gray-500 font-medium">Warehouse Address</div>
                  <div className="text-sm font-semibold text-gray-900">{supplier.address || "—"}</div>
                </div>
              </div>
            </div>
            {supplier.notes && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-1">Supplier Notes</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{supplier.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commercial Info Card */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Terms & Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Credit Terms
              </span>
              <span className="font-semibold text-gray-900">{supplier.credit_days} Days</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Lead Time
              </span>
              <span className="font-semibold text-gray-900">{supplier.average_lead_time} Days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-400" />
                Outstanding
              </span>
              <span className={`text-base font-bold ${supplier.current_balance > 0 ? "text-amber-700" : "text-gray-900"}`}>
                ₹{Number(supplier.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs list for Products vs PO history */}
      <Tabs defaultValue="products" className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-gray-100 rounded-md p-1 mb-4">
          <TabsTrigger value="products">Product Catalog</TabsTrigger>
          <TabsTrigger value="history">Purchase Orders</TabsTrigger>
        </TabsList>

        {/* Linked Products Catalog */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Linked Products</h3>
              <p className="text-xs text-gray-500">Products supplied by {supplier.name} with custom cost prices.</p>
            </div>
            <Button onClick={() => setIsLinkDialogOpen(true)} className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Link Product
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {!supplier.products || supplier.products.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No products linked to this supplier.</div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Primary Supplier?</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplier.products.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        {item.product?.name || "Unknown Product"}
                      </TableCell>
                      <TableCell>{item.product?.category || "—"}</TableCell>
                      <TableCell>{item.product?.unit || "—"}</TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        ₹{Number(item.cost_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_primary_supplier ? "success" : "secondary"}>
                          {item.is_primary_supplier ? "Primary" : "Secondary"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleUnlinkProduct(item.product_id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Purchase Order History */}
        <TabsContent value="history" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Purchase Order History</h3>
            <p className="text-xs text-gray-500">List of all purchase orders dispatched to this supplier.</p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {purchaseOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No purchase orders found for this supplier.</div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Triggered By Order</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-green-700 font-semibold">
                        #{po.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {po.triggered_by_order_id ? (
                          <Link href={`/orders`} className="hover:underline flex items-center gap-1 text-gray-600">
                            <span>View Order</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Link>
                        ) : "Manual PO"}
                      </TableCell>
                      <TableCell className="text-xs">{po.expected_delivery || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={po.status === "Received" ? "success" : po.status === "Partially Received" ? "warning" : "secondary"}>
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        ₹{Number(po.total_cost).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/purchase-orders`}>
                          <Button variant="outline" size="sm">
                            View PO Desk
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Link Product Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Link Product to Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLinkProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Select Product *</Label>
              <select
                id="product"
                value={linkFormData.product_id}
                onChange={(e) => setLinkFormData({ ...linkFormData, product_id: e.target.value })}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                required
              >
                <option value="">-- Choose a Product --</option>
                {allProducts.map((p) => {
                  // Check if already linked
                  const isLinked = supplier.products?.some(sp => sp.product_id === p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={isLinked}>
                      {p.name} ({p.unit}) {isLinked ? "[Already Linked]" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_price">Supplier Cost Price (₹) *</Label>
              <Input
                id="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={linkFormData.cost_price}
                onChange={(e) => setLinkFormData({ ...linkFormData, cost_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="primary"
                type="checkbox"
                checked={linkFormData.is_primary_supplier}
                onChange={(e) => setLinkFormData({ ...linkFormData, is_primary_supplier: e.target.checked })}
                className="rounded border-gray-300 text-green-700 focus:ring-green-600"
              />
              <Label htmlFor="primary" className="cursor-pointer">Set as Primary Supplier for this product</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={linkFormData.notes}
                onChange={(e) => setLinkFormData({ ...linkFormData, notes: e.target.value })}
                placeholder="e.g. grade A quality, bulk pack"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white">
                Link Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
