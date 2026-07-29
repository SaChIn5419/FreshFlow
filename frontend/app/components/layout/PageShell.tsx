"use client";

import React from "react";
import { Sprout, ShieldCheck } from "lucide-react";
import { ProducePattern } from "@/app/components/ui/ProducePattern";

interface PageShellProps {
  title: string;
  subtitle?: string;
  badgeText?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  headerMeta?: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  badgeText = "100% Direct from Partner Farms",
  actions,
  children,
  headerMeta,
}) => {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] space-y-6 animate-in fade-in duration-300">
      {/* Background Organic Vector Decorative Ribbon */}
      <div className="absolute top-0 right-0 left-0 h-40 overflow-hidden pointer-events-none -z-10 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-green-50/40 to-teal-50/60 border border-green-100/60">
        <ProducePattern className="absolute inset-0 w-full h-full" />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              <Sprout className="w-3.5 h-3.5 text-green-600" />
              {badgeText}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Quality
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 max-w-3xl">
              {subtitle}
            </p>
          )}
          {headerMeta}
        </div>

        {/* Header Action Slot */}
        {actions && (
          <div className="flex items-center gap-2 sm:self-end flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Main Page Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
};
