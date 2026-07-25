"use client";

import { useEffect, useState } from "react";
import { customerService, Customer, CustomerCreate, CustomerUpdate } from "@/app/services/customers";
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
import { Search, Plus, Edit, ShieldBan, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { productService, Product } from "@/app/services/products";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        restaurant_name: customer.restaurant_name,
        contact_person: customer.contact_person || "",
        email: "", // We don't expose email for editing here, backend handles user updates separately if needed, but wait, updating customer doesn't update user email in backend right now.
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        toast.success("Customer updated successfully!");
      } else {
        await customerService.createCustomer(formData);
        toast.success("Customer created successfully!");
      }
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this customer?")) {
      try {
        await customerService.deactivateCustomer(id);
        toast.success("Customer deactivated.");
        fetchCustomers();
      } catch (error) {
        toast.error("Failed to deactivate customer.");
      }
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
      setAllProducts(products.filter(p => p.is_active));
      setCurrentTemplateIds(templateItems.map(t => t.product_id));
    } catch (error) {
      toast.error("Failed to load products and templates.");
    } finally {
      setIsProductsLoading(false);
    }
  };

  const handleToggleTemplateProduct = async (productId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedCustomerTemplate) return;
    
    // Optimistic UI update
    const newTemplateIds = isCurrentlyAssigned 
      ? currentTemplateIds.filter(id => id !== productId)
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
      // Revert optimistic update
      setCurrentTemplateIds(currentTemplateIds);
    }
  };

  const handleToggleSelectAll = async () => {
    if (!selectedCustomerTemplate || !allProducts) return;
    
    const allSelected = allProducts.length > 0 && allProducts.every(p => currentTemplateIds.includes(p.id));
    const originalIds = [...currentTemplateIds];
    
    if (allSelected) {
      // Optimistic UI update: Deselect all
      setCurrentTemplateIds([]);
      try {
        await Promise.all(
          allProducts.map(p => customerService.removeProductFromTemplate(selectedCustomerTemplate.id, p.id))
        );
        toast.success("Deselected all products.");
      } catch (error) {
        toast.error("Failed to clear template products.");
        setCurrentTemplateIds(originalIds);
      }
    } else {
      // Optimistic UI update: Select all
      const allIds = allProducts.map(p => p.id);
      setCurrentTemplateIds(allIds);
      try {
        const toAssign = allProducts.filter(p => !originalIds.includes(p.id));
        await Promise.all(
          toAssign.map(p => customerService.assignProductToTemplate(selectedCustomerTemplate.id, p.id))
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your restaurant partners and clients.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-green-700 hover:bg-green-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <Input
          placeholder="Search by name, contact, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Credit Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Loading customers...
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{customer.restaurant_name}</div>
                    {customer.contact_person && (
                      <div className="text-sm text-gray-500">{customer.contact_person}</div>
                    )}
                  </TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>{customer.credit_days} days</TableCell>
                  <TableCell>
                    <Badge variant={customer.is_active ? "default" : "secondary"} className={customer.is_active ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {customer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenTemplateDialog(customer)}>
                      Template
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(customer)}>
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Button>
                    {customer.is_active && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeactivate(customer.id)}>
                        <ShieldBan className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Restaurant Name *</Label>
                <Input
                  id="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              {!editingCustomer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Login ID) *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required={!editingCustomer}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Initial Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingCustomer}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credit_days">Credit Days</Label>
                <Input
                  id="credit_days"
                  type="number"
                  min="0"
                  value={formData.credit_days}
                  onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Additional Details</h4>
              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number (Optional)</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="e.g. 29ABCDE1234F2Z5"
                />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingCustomer ? "Save Changes" : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Products for {selectedCustomerTemplate?.restaurant_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">Select the products that this customer can see and order.</p>
            {isProductsLoading ? (
              <div className="text-center py-4 text-gray-500">Loading products...</div>
            ) : (
              <div className="space-y-4">
                {/* Select All Toggle Option */}
                <div className="flex items-center space-x-3 p-3 bg-white border rounded-md shadow-sm">
                  <input
                    type="checkbox"
                    id="select-all-products"
                    checked={allProducts.length > 0 && allProducts.every(p => currentTemplateIds.includes(p.id))}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-green-700 bg-gray-100 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                  />
                  <Label htmlFor="select-all-products" className="flex-1 font-bold text-gray-900 cursor-pointer select-none">
                    Select All ({allProducts.length} Products)
                  </Label>
                </div>

                <div className="space-y-2 border rounded-md p-4 bg-gray-50 max-h-[50vh] overflow-y-auto">
                  {allProducts.map((product) => {
                    const isAssigned = currentTemplateIds.includes(product.id);
                    return (
                      <div key={product.id} className="flex items-center space-x-3 py-2 border-b last:border-0 border-gray-100">
                        <input
                          type="checkbox"
                          id={`prod-${product.id}`}
                          checked={isAssigned}
                          onChange={() => handleToggleTemplateProduct(product.id, isAssigned)}
                          className="w-4 h-4 text-green-700 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />
                        <Label htmlFor={`prod-${product.id}`} className="flex-1 font-medium cursor-pointer">
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
            <Button type="button" onClick={() => setIsTemplateDialogOpen(false)} className="bg-green-700 hover:bg-green-800 w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
