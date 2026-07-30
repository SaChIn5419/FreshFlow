"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, Product, ProductCreate, ProductUpdate } from "@/app/services/products";
import { supplierService, Supplier } from "@/app/services/suppliers";
import { PageShell } from "@/app/components/layout/PageShell";
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
import { Search, Plus, Edit, ShieldBan, AlertTriangle, PackageCheck, Loader2, Sprout, Filter } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getProducts(),
    staleTime: 30000,
  });

  const { data: suppliers = [], isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => supplierService.getSuppliers(),
    staleTime: 30000,
  });

  const isLoading = isProductsLoading || isSuppliersLoading;

  const createUpdateMutation = useMutation({
    mutationFn: async (formDataToSave: any) => {
      let savedProduct: Product;
      
      if (editingProduct) {
        savedProduct = await productService.updateProduct(editingProduct.id, {
          name: formDataToSave.name,
          category: formDataToSave.category,
          unit: formDataToSave.unit,
          default_price: formDataToSave.default_price,
          stock_quantity: formDataToSave.stock_quantity,
          reorder_level: formDataToSave.reorder_level,
          is_active: formDataToSave.is_active,
        } as ProductUpdate);
      } else {
        savedProduct = await productService.createProduct({
          name: formDataToSave.name,
          category: formDataToSave.category,
          unit: formDataToSave.unit,
          default_price: formDataToSave.default_price,
          stock_quantity: formDataToSave.stock_quantity,
          reorder_level: formDataToSave.reorder_level,
        });
      }

      if (formDataToSave.primary_supplier_id) {
        await supplierService.linkProductToSupplier(formDataToSave.primary_supplier_id, {
          product_id: savedProduct.id,
          cost_price: formDataToSave.cost_price || 0,
          is_primary_supplier: true,
        });
      } else if (editingProduct) {
        const prevLink = productSupplierMap.get(editingProduct.id);
        if (prevLink) {
          await supplierService.unlinkProductFromSupplier(prevLink.id, editingProduct.id);
        }
      }
      return savedProduct;
    },
    onSuccess: () => {
      toast.success(`Product ${editingProduct ? "updated" : "created"} successfully!`);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "An error occurred.");
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => productService.deactivateProduct(id),
    onSuccess: () => {
      toast.success("Product deactivated.");
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      toast.error("Failed to deactivate product.");
    }
  });

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

  // Removed raw fetch functions

  // Derive product_id -> primary supplier details map
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

  // Derive unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [products]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUpdateMutation.mutate(formData);
  };

  const handleDeactivate = (id: string) => {
    if (confirm("Are you sure you want to deactivate this product?")) {
      deactivateMutation.mutate(id);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <PageShell
      title="Produce Catalog & Stock"
      subtitle="320 wholesale produce items with direct farm sourcing, live stock levels, and pricing matrices."
      badgeText="320 Farm Produce Items"
      actions={
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-green-700 hover:bg-green-800 text-white rounded-xl shadow-xs font-semibold px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Category Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-green-100/80 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex items-center space-x-2 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-200/60 flex-1 max-w-md">
            <Search className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              placeholder="Search produce name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-green-700" /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-green-700 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-800"
              }`}
            >
              All ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                    selectedCategory === cat
                      ? "bg-green-700 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-800"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Produce Table Container */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30">
              <TableRow>
                <TableHead className="font-bold text-gray-900">Produce Name</TableHead>
                <TableHead className="font-bold text-gray-900">Category</TableHead>
                <TableHead className="font-bold text-gray-900">Available Stock</TableHead>
                <TableHead className="font-bold text-gray-900">Status</TableHead>
                <TableHead className="font-bold text-gray-900">Primary Farm Supplier</TableHead>
                <TableHead className="font-bold text-gray-900">Cost Price</TableHead>
                <TableHead className="font-bold text-gray-900">Selling Price</TableHead>
                <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
                    Loading farm produce catalog...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    No produce found matching filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const supDetails = productSupplierMap.get(product.id);
                  const currentStock = Number(product.stock_quantity || 0);
                  const reorderLvl = Number(product.reorder_level || 0);
                  const isLowStock = currentStock <= reorderLvl;

                  return (
                    <TableRow key={product.id} className="hover:bg-green-50/40 transition-colors">
                      <TableCell className="font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          {product.category || "Produce"}
                        </span>
                      </TableCell>
                      <TableCell className="font-extrabold text-gray-900">
                        {currentStock} <span className="text-xs text-gray-500 font-normal">{product.unit}</span>
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit font-bold">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            Needs Stocking
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit font-bold">
                            <PackageCheck className="w-3 h-3 text-green-700" />
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {supDetails ? (
                          <Link href={`/suppliers/${supDetails.id}`} className="text-green-800 font-semibold hover:underline flex items-center gap-1">
                            <Sprout className="w-3.5 h-3.5 text-green-600" />
                            {supDetails.name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">
                        {supDetails ? `₹${Number(supDetails.cost_price).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="font-extrabold text-gray-950">
                        ₹{product.default_price ? Number(product.default_price).toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)} className="hover:bg-green-100/60 rounded-xl">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Button>
                          {product.is_active && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeactivate(product.id)} className="hover:bg-red-100/60 rounded-xl">
                              <ShieldBan className="w-4 h-4 text-red-600" />
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

        {/* Add/Edit Product Modal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[520px] bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-green-700" />
                {editingProduct ? "Edit Produce Item & Stock" : "Add New Produce Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-gray-800">Produce Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Baby Spinach, Avocado, Cherry Tomato"
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="category" className="font-semibold text-gray-800">Produce Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Exotic, Fruits, Herbs, Leafy, Vegetables"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="font-semibold text-gray-800">Allowed Units *</Label>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {UNIT_OPTIONS.map((opt) => {
                      const isSelected = formData.unit.split(',').map((s) => s.trim()).includes(opt);
                      return (
                        <div key={opt} className="flex items-center space-x-1.5 bg-green-50/60 px-3 py-1.5 rounded-xl border border-green-200/60">
                          <input 
                            type="checkbox" 
                            id={`unit-${opt}`} 
                            checked={isSelected}
                            onChange={(e) => {
                              const currentUnits = formData.unit ? formData.unit.split(',').map((s) => s.trim()).filter(Boolean) : [];
                              if (e.target.checked) {
                                if (!currentUnits.includes(opt)) currentUnits.push(opt);
                              } else {
                                const idx = currentUnits.indexOf(opt);
                                if (idx > -1) currentUnits.splice(idx, 1);
                              }
                              setFormData({ ...formData, unit: currentUnits.join(',') });
                            }}
                            className="w-4 h-4 text-green-700 border-gray-300 rounded-md focus:ring-green-500"
                          />
                          <Label htmlFor={`unit-${opt}`} className="font-semibold cursor-pointer text-xs text-gray-800">
                            {opt}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  {(!formData.unit) && <p className="text-xs text-red-500">Please select at least one unit.</p>}
                </div>
              </div>

              {/* Stock Quantity & Reorder Level */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-green-50/50 rounded-xl border border-green-200/60">
                <div className="space-y-1.5">
                  <Label htmlFor="stock_qty" className="text-xs font-bold text-green-900">Current Available Stock</Label>
                  <Input
                    id="stock_qty"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl border-green-200 bg-white"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="reorder_lvl" className="text-xs font-bold text-green-900">Reorder Alert Threshold</Label>
                  <Input
                    id="reorder_lvl"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseFloat(e.target.value) || 0 })}
                    className="rounded-xl border-green-200 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_price" className="font-semibold text-gray-800">Selling Price (₹) *</Label>
                  <Input
                    id="default_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_price}
                    onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                    required
                    className="rounded-xl border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost_price" className="font-semibold text-gray-800">Farm Cost Price (₹)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    disabled={!formData.primary_supplier_id}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier" className="font-semibold text-gray-800">Primary Farm Supplier</Label>
                <select
                  id="supplier"
                  value={formData.primary_supplier_id}
                  onChange={(e) => setFormData({ ...formData, primary_supplier_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                >
                  <option value="">-- No Supplier Assigned --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white rounded-xl" disabled={!formData.unit || createUpdateMutation.isPending}>
                  {createUpdateMutation.isPending ? (
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
    </PageShell>
  );
}
