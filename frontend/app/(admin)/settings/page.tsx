"use client";

import { useEffect, useState } from "react";
import { settingsService, Settings, SettingsUpdate } from "@/app/services/settings";
import { PageShell } from "@/app/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building2, Receipt, Landmark, Loader2, Save } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsUpdate>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await settingsService.getSettings();
      setSettings(data);
      setFormData({
        company_name: data.company_name,
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        gstin: data.gstin || "",
        invoice_prefix: data.invoice_prefix,
        currency: data.currency,
        bank_name: data.bank_name || "",
        account_number: data.account_number || "",
        ifsc_code: data.ifsc_code || "",
        upi_id: data.upi_id || "",
      });
    } catch (error) {
      toast.error("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await settingsService.updateSettings(formData);
      toast.success("Settings saved successfully.");
      fetchSettings();
    } catch (error) {
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell title="System & Business Settings">
        <div className="flex h-48 items-center justify-center bg-white rounded-2xl border border-green-100">
          <Loader2 className="h-8 w-8 animate-spin text-green-700" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="System & Business Settings"
      subtitle="Configure wholesale company profile, GSTIN, invoice prefix, and bank settlement details."
      badgeText="Wholesale Profile & Invoicing"
      actions={
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-700 hover:bg-green-800 text-white font-semibold shadow-xs rounded-xl px-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      }
    >
      <div className="grid gap-6">
        <Card className="rounded-2xl border border-green-100 shadow-xs bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30 rounded-t-2xl">
            <CardTitle className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-700" />
              Company & Mandi Profile
            </CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Your legal business details as rendered on restaurant invoices and POs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="font-semibold text-gray-800">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin" className="font-semibold text-gray-800">GSTIN Number</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-semibold text-gray-800">Contact Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-gray-800">Support Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="font-semibold text-gray-800">Mandi / Yard Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl border-gray-200"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-green-100 shadow-xs bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30 rounded-t-2xl">
            <CardTitle className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-700" />
              Invoicing Defaults
            </CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Configure automated invoice numbering and currency formatting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_prefix" className="font-semibold text-gray-800">Invoice Number Prefix</Label>
                <Input
                  id="invoice_prefix"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="font-semibold text-gray-800">Currency Symbol</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-green-100 shadow-xs bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30 rounded-t-2xl">
            <CardTitle className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-green-700" />
              Bank & Settlement Details
            </CardTitle>
            <CardDescription className="text-xs text-gray-600">
              Payment details provided to restaurant clients on generated invoices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="font-semibold text-gray-800">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number" className="font-semibold text-gray-800">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code" className="font-semibold text-gray-800">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upi_id" className="font-semibold text-gray-800">UPI VPA ID</Label>
                <Input
                  id="upi_id"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  className="rounded-xl border-gray-200"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end pt-4 pb-6 px-6 border-t border-green-100">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl px-6"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </PageShell>
  );
}
