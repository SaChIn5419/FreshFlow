"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supplierService, Supplier, SupplierCreate, SupplierUpdate } from "@/app/services/suppliers";
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
import { Search, Plus, Edit, Trash2, Eye, Phone, Mail, MapPin, Loader2 } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">Manage directory of wholesale produce suppliers.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <Search className="w-5 h-5 text-gray-400" />
        <Input
          placeholder="Search suppliers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No suppliers found.</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Terms (Days)</TableHead>
                <TableHead>Lead Time (Days)</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-semibold text-gray-900">
                    <Link href={`/suppliers/${supplier.id}`} className="hover:underline text-green-700">
                      {supplier.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-xs text-gray-500">
                      {supplier.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{supplier.credit_days} days</TableCell>
                  <TableCell>{supplier.average_lead_time} days</TableCell>
                  <TableCell>
                    <span className={supplier.current_balance > 0 ? "text-amber-700 font-medium" : "text-gray-900"}>
                      ₹{Number(supplier.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? "success" : "secondary"}>
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/suppliers/${supplier.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)} title="Edit">
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} title="Deactivate">
                        <Trash2 className="w-4 h-4 text-red-500" />
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
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Warehouse Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_days">Credit Terms (Days)</Label>
                <Input
                  id="credit_days"
                  type="number"
                  min="0"
                  value={formData.credit_days}
                  onChange={(e) => setFormData({ ...formData, credit_days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead_time">Average Lead Time (Days)</Label>
                <Input
                  id="lead_time"
                  type="number"
                  min="1"
                  value={formData.average_lead_time}
                  onChange={(e) => setFormData({ ...formData, average_lead_time: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
