"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { productService, Product, ProductCreate, ProductUpdate } from "@/app/services/products";
import { supplierService, Supplier } from "@/app/services/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, ShieldBan, AlertTriangle, PackageCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const UNIT_OPTIONS = ["KG", "Bunch", "Piece", "Packet", "Box"];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState<ProductCreate & { 
    is_active?: boolean;
    primary_supplier_id?: string;
    cost_price?: number;
    stock_quantity?: number;
    reorder_level?: number;
  }>({
    name: "",
    category: "",
    unit: "",
    default_price: 0,
    stock_quantity: 0,
    reorder_level: 0,
    is_active: true,
    primary_supplier_id: "",
    cost_price: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const prodData = await productService.getProducts();
      setProducts(prodData);
      
      const supData = await supplierService.getSuppliers();
      setSuppliers(supData);
    } catch (error) {
      toast.error("Failed to load products and suppliers.");
    } finally {
      setIsLoading(false);
    }
  };

  // Derive a map of product_id -> primary supplier details
  const productSupplierMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; cost_price: number }>();
    suppliers.forEach((s) => {
      s.products?.forEach((sp) => {
        if (sp.is_primary_supplier) {
          map.set(sp.product_id, {
            id: s.id,
            name: s.name,
            cost_price: sp.cost_price,
          });
        }
      });
    });
    return map;
  }, [suppliers]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const linkDetails = productSupplierMap.get(product.id);
      setFormData({
        name: product.name,
        category: product.category || "",
        unit: product.unit,
        default_price: product.default_price || 0,
        stock_quantity: product.stock_quantity || 0,
        reorder_level: product.reorder_level || 0,
        is_active: product.is_active,
        primary_supplier_id: linkDetails?.id || "",
        cost_price: linkDetails?.cost_price || 0,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        category: "",
        unit: "",
        default_price: 0,
        stock_quantity: 0,
        reorder_level: 10,
        is_active: true,
        primary_supplier_id: "",
        cost_price: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let savedProduct: Product;
      
      if (editingProduct) {
        savedProduct = await productService.updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          default_price: formData.default_price,
          stock_quantity: formData.stock_quantity,
          reorder_level: formData.reorder_level,
          is_active: formData.is_active,
        } as ProductUpdate);
        toast.success("Product updated successfully!");
      } else {
        savedProduct = await productService.createProduct({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          default_price: formData.default_price,
          stock_quantity: formData.stock_quantity,
          reorder_level: formData.reorder_level,
        });
        toast.success("Product created successfully!");
      }

      // Link supplier if selected
      if (formData.primary_supplier_id) {
        await supplierService.linkProductToSupplier(formData.primary_supplier_id, {
          product_id: savedProduct.id,
          cost_price: formData.cost_price || 0,
          is_primary_supplier: true,
        });
      } else if (editingProduct) {
        // If it was linked before but now cleared, unlink it
        const prevLink = productSupplierMap.get(editingProduct.id);
        if (prevLink) {
          await supplierService.unlinkProductFromSupplier(prevLink.id, editingProduct.id);
        }
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this product?")) {
      try {
        await productService.deactivateProduct(id);
        toast.success("Product deactivated.");
        fetchData();
      } catch (error) {
        toast.error("Failed to deactivate product.");
      }
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Products & Inventory</h1>
          <p className="text-gray-500">Manage catalog, cost/selling prices, suppliers, and stock availability.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Available Stock</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Primary Supplier</TableHead>
              <TableHead>Cost Price</TableHead>
              <TableHead>Selling Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const supDetails = productSupplierMap.get(product.id);
                const currentStock = Number(product.stock_quantity || 0);
                const reorderLvl = Number(product.reorder_level || 0);
                const isLowStock = currentStock <= reorderLvl;

                return (
                  <TableRow key={product.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-900">{product.name}</TableCell>
                    <TableCell>{product.category || "—"}</TableCell>
                    <TableCell className="font-bold text-gray-900">
                      {currentStock} {product.unit}
                    </TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Needs Stocking
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
                          <PackageCheck className="w-3 h-3 text-green-600" />
                          In Stock
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {supDetails ? (
                        <Link href={`/suppliers/${supDetails.id}`} className="text-green-700 font-medium hover:underline">
                          {supDetails.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {supDetails ? `₹${Number(supDetails.cost_price).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-950">
                      ₹{product.default_price ? Number(product.default_price).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                          <Edit className="w-4 h-4 text-gray-500" />
                        </Button>
                        {product.is_active && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeactivate(product.id)}>
                            <ShieldBan className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product & Stock" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Vegetables, Herbs, Exotic"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Allowed Units *</Label>
                <div className="flex flex-wrap gap-4 pt-1">
                  {UNIT_OPTIONS.map(opt => {
                    const isSelected = formData.unit.split(',').map(s => s.trim()).includes(opt);
                    return (
                      <div key={opt} className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id={`unit-${opt}`} 
                          checked={isSelected}
                          onChange={(e) => {
                            const currentUnits = formData.unit ? formData.unit.split(',').map(s=>s.trim()).filter(Boolean) : [];
                            if (e.target.checked) {
                              if (!currentUnits.includes(opt)) currentUnits.push(opt);
                            } else {
                              const idx = currentUnits.indexOf(opt);
                              if (idx > -1) currentUnits.splice(idx, 1);
                            }
                            setFormData({ ...formData, unit: currentUnits.join(',') });
                          }}
                          className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500"
                        />
                        <Label htmlFor={`unit-${opt}`} className="font-normal cursor-pointer text-sm">
                          {opt}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {(!formData.unit) && <p className="text-xs text-red-500">Please select at least one unit.</p>}
              </div>
            </div>

            {/* Inventory Stock & Alert Settings */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg border border-gray-150">
              <div className="space-y-1.5">
                <Label htmlFor="stock_qty" className="text-xs font-semibold text-gray-700">Current Stock Quantity</Label>
                <Input
                  id="stock_qty"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="reorder_lvl" className="text-xs font-semibold text-gray-700">Reorder Alert Threshold</Label>
                <Input
                  id="reorder_lvl"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-[10px] text-gray-500">Triggers 'Needs Stocking' badge when stock falls below this.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_price">Reference Selling Price (₹) *</Label>
                <Input
                  id="default_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.default_price}
                  onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cost_price">Supplier Cost Price (₹)</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                  disabled={!formData.primary_supplier_id}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Primary Supplier</Label>
              <select
                id="supplier"
                value={formData.primary_supplier_id}
                onChange={(e) => setFormData({ ...formData, primary_supplier_id: e.target.value })}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
              >
                <option value="">-- No Supplier Assigned --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={!formData.unit || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
