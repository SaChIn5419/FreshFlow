"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supplierService, Supplier, SupplierCreate, SupplierUpdate } from "@/app/services/suppliers";
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
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin, Loader2, Truck, Sprout } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState<SupplierCreate & { is_active?: boolean }>({
    name: "",
    phone: "",
    whatsapp_number: "",
    email: "",
    address: "",
    credit_days: 0,
    average_lead_time: 1,
    notes: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Failed to load suppliers.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        phone: supplier.phone || "",
        whatsapp_number: supplier.whatsapp_number || "",
        email: supplier.email || "",
        address: supplier.address || "",
        credit_days: supplier.credit_days,
        average_lead_time: supplier.average_lead_time,
        notes: supplier.notes || "",
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        phone: "",
        whatsapp_number: "",
        email: "",
        address: "",
        credit_days: 0,
        average_lead_time: 1,
        notes: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, formData as SupplierUpdate);
        toast.success("Supplier updated successfully!");
      } else {
        await supplierService.createSupplier(formData);
        toast.success("Supplier created successfully!");
      }
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to deactivate this supplier?")) {
      try {
        await supplierService.deleteSupplier(id);
        toast.success("Supplier deactivated.");
        fetchSuppliers();
      } catch (error) {
        toast.error("Failed to deactivate supplier.");
      }
    }
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageShell
      title="Farm Suppliers Directory"
      subtitle="Wholesale Mandi & Greenhouse grower relationships, lead times, and outstanding accounts payable."
      badgeText="Partner Mandis & Farmers"
      actions={
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-xs rounded-xl px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-green-100/80 shadow-xs">
          <div className="flex items-center space-x-2 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-200/60 max-w-md">
            <Search className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              placeholder="Search farm supplier name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Supplier Table */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
              Loading farm suppliers...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No farm suppliers found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30">
                <TableRow>
                  <TableHead className="font-bold text-gray-900">Supplier Name</TableHead>
                  <TableHead className="font-bold text-gray-900">Contact Details</TableHead>
                  <TableHead className="font-bold text-gray-900">Credit Terms</TableHead>
                  <TableHead className="font-bold text-gray-900">Avg Lead Time</TableHead>
                  <TableHead className="font-bold text-gray-900">Outstanding Balance</TableHead>
                  <TableHead className="font-bold text-gray-900">Status</TableHead>
                  <TableHead className="text-right font-bold text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="font-extrabold text-gray-900">
                      <Link href={`/suppliers/${supplier.id}`} className="hover:underline text-green-800 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-green-700" />
                        {supplier.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-gray-600">
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-700" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-green-700" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">{supplier.credit_days} days</TableCell>
                    <TableCell className="font-bold text-gray-900">{supplier.average_lead_time} days</TableCell>
                    <TableCell className="font-extrabold">
                      <span className={supplier.current_balance > 0 ? "text-amber-700" : "text-gray-900"}>
                        ₹{Number(supplier.current_balance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? "success" : "secondary"} className={supplier.is_active ? "bg-green-100 text-green-800 border-green-200 font-bold" : ""}>
                        {supplier.is_active ? "Active Supplier" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/suppliers/${supplier.id}`}>
                          <Button variant="ghost" size="icon" title="View details" className="hover:bg-green-100/60 rounded-xl">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)} title="Edit" className="hover:bg-green-100/60 rounded-xl">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} title="Deactivate" className="hover:bg-red-100/60 rounded-xl">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md bg-white rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-700" />
                {editingSupplier ? "Edit Farm Supplier" : "Add New Farm Supplier"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-semibold text-gray-800">Supplier / Mandi Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="whatsapp" className="font-semibold text-gray-800">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-gray-800">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-semibold text-gray-800">Mandi / Warehouse Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="credit_days" className="font-semibold text-gray-800">Credit Terms (Days)</Label>
                  <Input
                    id="credit_days"
                    type="number"
                    min="0"
                    value={formData.credit_days}
                    onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead_time" className="font-semibold text-gray-800">Average Lead Time (Days)</Label>
                  <Input
                    id="lead_time"
                    type="number"
                    min="1"
                    value={formData.average_lead_time}
                    onChange={(e) => setFormData({ ...formData, average_lead_time: parseInt(e.target.value) || 1 })}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="font-semibold text-gray-800">Internal Sourcing Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : "Save Supplier"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  );
}
