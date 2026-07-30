"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, Customer, CustomerCreate, CustomerUpdate } from "@/app/services/customers";
import { productService, Product } from "@/app/services/products";
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
import { Search, Plus, Edit, ShieldBan, Loader2, Utensils, Phone, Clock, FileCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 30000,
  });

  const createUpdateMutation = useMutation({
    mutationFn: async (data: CustomerCreate) => {
      if (editingCustomer) {
        return await customerService.updateCustomer(editingCustomer.id, data);
      }
      return await customerService.createCustomer(data);
    },
    onSuccess: () => {
      toast.success(`Customer ${editingCustomer ? "updated" : "created"} successfully!`);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "An error occurred.");
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => customerService.deactivateCustomer(id),
    onSuccess: () => {
      toast.success("Customer deactivated.");
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      toast.error("Failed to deactivate customer.");
    }
  });

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState<CustomerCreate>({
    restaurant_name: "",
    contact_person: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    gst_number: "",
    credit_days: 0,
    is_active: true,
  });

  // Template state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedCustomerTemplate, setSelectedCustomerTemplate] = useState<Customer | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentTemplateIds, setCurrentTemplateIds] = useState<string[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Removed raw fetch functions
  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        restaurant_name: customer.restaurant_name,
        contact_person: customer.contact_person || "",
        email: "",
        password: "",
        phone: customer.phone || "",
        address: customer.address || "",
        gst_number: customer.gst_number || "",
        credit_days: customer.credit_days,
        is_active: customer.is_active,
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        restaurant_name: "",
        contact_person: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        gst_number: "",
        credit_days: 0,
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUpdateMutation.mutate(formData);
  };

  const handleDeactivate = (id: string) => {
    if (confirm("Are you sure you want to deactivate this customer?")) {
      deactivateMutation.mutate(id);
    }
  };

  const handleOpenTemplateDialog = async (customer: Customer) => {
    setSelectedCustomerTemplate(customer);
    setIsTemplateDialogOpen(true);
    setIsProductsLoading(true);
    try {
      const [products, templateItems] = await Promise.all([
        productService.getProducts(),
        customerService.getTemplates(customer.id),
      ]);
      setAllProducts(products.filter((p) => p.is_active));
      setCurrentTemplateIds(templateItems.map((t) => t.product_id));
    } catch (error) {
      toast.error("Failed to load products and templates.");
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleToggleTemplateProduct = async (productId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedCustomerTemplate) return;
    
    const newTemplateIds = isCurrentlyAssigned 
      ? currentTemplateIds.filter((id) => id !== productId)
      : [...currentTemplateIds, productId];
      
    setCurrentTemplateIds(newTemplateIds);

    try {
      if (isCurrentlyAssigned) {
        await customerService.removeProductFromTemplate(selectedCustomerTemplate.id, productId);
      } else {
        await customerService.assignProductToTemplate(selectedCustomerTemplate.id, productId);
      }
    } catch (error) {
      toast.error("Failed to update template.");
      setCurrentTemplateIds(currentTemplateIds);
    }
  };

  const handleToggleSelectAll = async () => {
    if (!selectedCustomerTemplate || !allProducts) return;
    
    const allSelected = allProducts.length > 0 && allProducts.every((p) => currentTemplateIds.includes(p.id));
    const originalIds = [...currentTemplateIds];
    
    if (allSelected) {
      setCurrentTemplateIds([]);
      try {
        await Promise.all(
          allProducts.map((p) => customerService.removeProductFromTemplate(selectedCustomerTemplate.id, p.id))
        );
        toast.success("Deselected all products.");
      } catch (error) {
        toast.error("Failed to clear template products.");
        setCurrentTemplateIds(originalIds);
      }
    } else {
      const allIds = allProducts.map((p) => p.id);
      setCurrentTemplateIds(allIds);
      try {
        const toAssign = allProducts.filter((p) => !originalIds.includes(p.id));
        await Promise.all(
          toAssign.map((p) => customerService.assignProductToTemplate(selectedCustomerTemplate.id, p.id))
        );
        toast.success("Selected all products.");
      } catch (error) {
        toast.error("Failed to assign all products.");
        setCurrentTemplateIds(originalIds);
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  return (
    <PageShell
      title="Restaurant Clients & Accounts"
      subtitle="Manage commercial restaurant partners, credit terms, and custom produce ordering templates."
      actions={
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-xs rounded-xl px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Restaurant
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-green-100/80 shadow-xs">
          <div className="flex items-center space-x-2 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-200/60 max-w-md">
            <Search className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              placeholder="Search by restaurant name, chef contact, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30">
              <TableRow>
                <TableHead className="font-bold text-gray-900">Restaurant Name</TableHead>
                <TableHead className="font-bold text-gray-900">Chef / Contact Person</TableHead>
                <TableHead className="font-bold text-gray-900">Phone</TableHead>
                <TableHead className="font-bold text-gray-900">Credit Period</TableHead>
                <TableHead className="font-bold text-gray-900">Account Status</TableHead>
                <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
                    Loading restaurant partners...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No restaurant partners found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="font-extrabold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-green-700" />
                        <span>{customer.restaurant_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-gray-700">
                      {customer.contact_person || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 font-mono">
                      {customer.phone || "—"}
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-800 px-2.5 py-0.5 rounded-full border border-green-200">
                        <Clock className="w-3 h-3 text-green-600" />
                        {customer.credit_days} days
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.is_active ? "default" : "secondary"} className={customer.is_active ? "bg-green-100 text-green-800 border-green-200 font-bold" : ""}>
                        {customer.is_active ? "Active Partner" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTemplateDialog(customer)}
                          className="border-green-200 text-green-800 hover:bg-green-50 rounded-xl text-xs font-semibold"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Order Template
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(customer)} className="hover:bg-green-100/60 rounded-xl">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        {customer.is_active && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeactivate(customer.id)} className="hover:bg-red-100/60 rounded-xl">
                            <ShieldBan className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-700" />
                {editingCustomer ? "Edit Restaurant Partner" : "Add New Restaurant Partner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name" className="font-semibold text-gray-800">Restaurant Name *</Label>
                  <Input
                    id="restaurant_name"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    required
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person" className="font-semibold text-gray-800">Contact Person / Head Chef</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-gray-800 flex items-center justify-between">
                    <span>Email (Client Login ID) {editingCustomer ? "" : "*"}</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. chef@restaurant.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required={!editingCustomer}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-semibold text-gray-800">
                    {editingCustomer ? "Reset Password (Optional)" : "Initial Password *"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={editingCustomer ? "Leave blank to keep current" : "Set password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingCustomer}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold text-gray-800">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_days" className="font-semibold text-gray-800">Credit Period (Days)</Label>
                  <Input
                    id="credit_days"
                    type="number"
                    min="0"
                    value={formData.credit_days}
                    onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-semibold text-gray-800">Delivery Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="gst_number" className="font-semibold text-gray-800">GST Number (Optional)</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="e.g. 29ABCDE1234F2Z5"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white rounded-xl" disabled={createUpdateMutation.isPending}>
                  {createUpdateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCustomer ? "Save Changes" : "Create Partner"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Template Catalog Modal */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900">
                Order Template for {selectedCustomerTemplate?.restaurant_name}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-xs text-gray-500 mb-4">
                Select the produce items that this restaurant can quick-order from their customer portal.
              </p>
              {isProductsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
                  Loading produce catalog...
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50/60 border border-green-200/60 rounded-xl">
                    <input
                      type="checkbox"
                      id="select-all-products"
                      checked={allProducts.length > 0 && allProducts.every((p) => currentTemplateIds.includes(p.id))}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-green-700 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <Label htmlFor="select-all-products" className="flex-1 font-bold text-gray-900 cursor-pointer select-none text-xs">
                      Select All ({allProducts.length} Produce Items)
                    </Label>
                  </div>

                  <div className="space-y-1.5 border border-gray-200 rounded-xl p-3 bg-gray-50/50 max-h-[45vh] overflow-y-auto custom-scrollbar">
                    {allProducts.map((product) => {
                      const isAssigned = currentTemplateIds.includes(product.id);
                      return (
                        <div key={product.id} className="flex items-center space-x-3 py-2 px-2 border-b last:border-0 border-gray-100 hover:bg-white rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            id={`prod-${product.id}`}
                            checked={isAssigned}
                            onChange={() => handleToggleTemplateProduct(product.id, isAssigned)}
                            className="w-4 h-4 text-green-700 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                          <Label htmlFor={`prod-${product.id}`} className="flex-1 font-semibold text-xs text-gray-800 cursor-pointer">
                            {product.name}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsTemplateDialogOpen(false)} className="bg-green-700 hover:bg-green-800 text-white w-full rounded-xl">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
