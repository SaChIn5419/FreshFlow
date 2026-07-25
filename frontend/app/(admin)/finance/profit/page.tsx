"use client";

import { useState, useEffect } from 'react';
import { financeService, ProfitabilityMetrics } from '@/app/services/finance';

export default function ProfitabilityPage() {
  const [metrics, setMetrics] = useState<ProfitabilityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await financeService.getProfitability();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load profitability metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div className="p-8">Loading Profitability Dashboard...</div>;
  if (!metrics) return <div className="p-8">Failed to load metrics.</div>;

  const isProfitable = metrics.gross_profit > 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profitability Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time overview of revenue, cost of goods sold, and gross margins.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{metrics.total_revenue.toFixed(2)}
          </div>
          <div className="mt-2 text-sm text-gray-500">From all invoiced customer orders</div>
        </div>

        {/* COGS Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Cost of Goods Sold (COGS)</div>
          <div className="text-3xl font-bold text-gray-900">
            ₹{metrics.total_cogs.toFixed(2)}
          </div>
          <div className="mt-2 text-sm text-gray-500">From all supplier purchase orders</div>
        </div>

        {/* Gross Profit Card */}
        <div className={`rounded-xl shadow-sm border p-6 ${isProfitable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm font-medium mb-1 ${isProfitable ? 'text-emerald-800' : 'text-red-800'}`}>
            Gross Profit
          </div>
          <div className={`text-3xl font-bold ${isProfitable ? 'text-emerald-900' : 'text-red-900'}`}>
            ₹{metrics.gross_profit.toFixed(2)}
          </div>
          <div className={`mt-2 text-sm ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            Revenue minus COGS
          </div>
        </div>

        {/* Margin % Card */}
        <div className={`rounded-xl shadow-sm border p-6 ${isProfitable ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm font-medium mb-1 ${isProfitable ? 'text-blue-800' : 'text-red-800'}`}>
            Gross Margin
          </div>
          <div className={`text-3xl font-bold ${isProfitable ? 'text-blue-900' : 'text-red-900'}`}>
            {metrics.gross_margin_percent.toFixed(1)}%
          </div>
          <div className={`mt-2 text-sm ${isProfitable ? 'text-blue-700' : 'text-red-700'}`}>
            Target: 25.0%
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-center text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900">More Insights Coming Soon</h3>
        <p className="mt-1 text-sm text-gray-500">We are gathering enough data to show you profit breakdowns per restaurant and per produce item.</p>
      </div>
    </div>
  );
}
