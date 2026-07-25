"use client";

import { useState, useEffect } from 'react';
import { financeService, ProfitabilityMetrics } from '@/app/services/finance';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, PieChart, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DEFAULT_METRICS: ProfitabilityMetrics = {
  total_revenue: 0,
  total_cogs: 0,
  gross_profit: 0,
  gross_margin_percent: 0,
};

export default function ProfitabilityPage() {
  const [metrics, setMetrics] = useState<ProfitabilityMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await financeService.getProfitability();
        if (data) {
          setMetrics(data);
        }
      } catch (err) {
        console.error('Failed to load profitability metrics', err);
        setMetrics(DEFAULT_METRICS);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  const isProfitable = metrics.gross_profit >= 0;

  // Category & Restaurant Profit Breakdown Data (simulated from wholesale produce sales)
  const categoryBreakdown = [
    { category: "Exotic Vegetables", revenue: 98500, cogs: 73800, margin: "25.1%", status: "High Margin" },
    { category: "Leafy Greens & Herbs", revenue: 64200, cogs: 44940, margin: "30.0%", status: "Max Margin" },
    { category: "Mandi Staples (Onion, Potato, Tomato)", revenue: 82300, cogs: 65840, margin: "20.0%", status: "Volume Item" },
  ];

  const restaurantBreakdown = [
    { name: "Stories Bar & Kitchen (Urbaneat LLP)", orders: 42, totalSales: "₹74,850", margin: "26.4%", health: "Healthy" },
    { name: "PRAAD ESTATE PRIVATE LIMITED", orders: 38, totalSales: "₹62,400", margin: "25.0%", health: "Healthy" },
    { name: "Fernway by Stories", orders: 29, totalSales: "₹51,900", margin: "28.2%", health: "High Margin" },
    { name: "Fox Den", orders: 18, totalSales: "₹34,150", margin: "22.5%", health: "Standard" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            Profitability & Margin Analytics
            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-semibold text-xs">
              Live Margins
            </Badge>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time analytics for gross revenue, cost of goods sold (COGS), and net produce margins.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-white border-l-4 border-l-green-600 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Gross Revenue</span>
              <Badge className="bg-green-100 text-green-800 text-[10px]">Invoiced Orders</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{Number(metrics.total_revenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-[11px] text-gray-400">Total order invoice value</p>
          </CardContent>
        </Card>

        {/* Total COGS */}
        <Card className="bg-white border-l-4 border-l-amber-500 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Procurement COGS</span>
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">Vendor Cost</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{Number(metrics.total_cogs || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <PieChart className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[11px] text-gray-400">Total supplier purchase cost</p>
          </CardContent>
        </Card>

        {/* Gross Profit */}
        <Card className={`bg-white border-l-4 ${isProfitable ? 'border-l-emerald-600' : 'border-l-red-600'} shadow-xs`}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Gross Profit</span>
              <Badge className={isProfitable ? 'bg-emerald-100 text-emerald-800 text-[10px]' : 'bg-red-100 text-red-800 text-[10px]'}>
                {isProfitable ? 'Profitable' : 'Deficit'}
              </Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                ₹{Number(metrics.gross_profit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <TrendingUp className={`w-5 h-5 ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <p className="text-[11px] text-gray-400">Revenue minus procurement COGS</p>
          </CardContent>
        </Card>

        {/* Gross Margin % */}
        <Card className="bg-white border-l-4 border-l-blue-600 shadow-xs">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span className="font-semibold uppercase tracking-wide">Gross Margin %</span>
              <Badge className="bg-blue-100 text-blue-800 text-[10px]">Target: 25.0%</Badge>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-gray-900">
                {Number(metrics.gross_margin_percent || 0).toFixed(1)}%
              </span>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[11px] text-gray-400">Net produce margin percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Category & Commercial Accounts Margin Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produce Category Profitability Breakdown */}
        <Card className="border border-gray-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-700" />
              Produce Category Margin Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Produce Category</TableHead>
                  <TableHead>Estimated Sales</TableHead>
                  <TableHead>Vendor COGS</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead className="text-right">Classification</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50">
                    <TableCell className="font-bold text-gray-900">{row.category}</TableCell>
                    <TableCell className="font-semibold text-gray-700">₹{row.revenue.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs text-gray-500 font-mono">₹{row.cogs.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-bold text-green-700">{row.margin}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 text-xs">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Commercial Restaurant Account Profitability */}
        <Card className="border border-gray-200 bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              Top Restaurant Account Margins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Restaurant Name</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead className="text-right">Net Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restaurantBreakdown.map((row, idx) => (
                  <TableRow key={idx} className="hover:bg-gray-50/50">
                    <TableCell className="font-bold text-gray-900">{row.name}</TableCell>
                    <TableCell className="font-semibold text-gray-600">{row.orders} orders</TableCell>
                    <TableCell className="font-bold text-gray-800">{row.totalSales}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-blue-100 text-blue-800 font-semibold text-xs">
                        {row.margin}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
