"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { auditService, AuditLog } from "@/app/services/audit";
import { PageShell } from "@/app/components/layout/PageShell";
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
import { Search, Loader2, Activity, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getAuditLogs(),
    staleTime: 30000,
  });

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_id && log.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDetails = (details: any) => {
    if (!details) return "-";
    if (typeof details === "string") return details;
    try {
      return JSON.stringify(details);
    } catch (e) {
      return String(details);
    }
  };

  const getActionColor = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes("create")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (lower.includes("update")) return "bg-amber-100 text-amber-800 border-amber-200";
    if (lower.includes("delete") || lower.includes("remove")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <PageShell
      title="System Audit Logs"
      subtitle="Immutable audit trail tracking system security events, data mutations, and operational activities."
      badgeText="Security & Compliance"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-green-100/80 shadow-xs">
          <div className="flex items-center space-x-2 bg-green-50/50 px-3 py-1.5 rounded-xl border border-green-200/60 max-w-md">
            <Search className="w-4 h-4 text-green-700 flex-shrink-0" />
            <Input
              placeholder="Search by action, entity type, ID, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/30">
              <TableRow>
                <TableHead className="font-bold text-gray-900">Timestamp</TableHead>
                <TableHead className="font-bold text-gray-900">User ID</TableHead>
                <TableHead className="font-bold text-gray-900">Action Performed</TableHead>
                <TableHead className="font-bold text-gray-900">Entity Type</TableHead>
                <TableHead className="font-bold text-gray-900">Entity ID</TableHead>
                <TableHead className="max-w-xs font-bold text-gray-900">Details Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin text-green-700 mx-auto mb-2" />
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-green-50/40 transition-colors">
                    <TableCell className="whitespace-nowrap">
                      {log.created_at ? (
                        <div>
                          <div className="font-bold text-gray-900">
                            {format(new Date(log.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={log.user_id}>
                        {log.user_id || "System"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`font-bold border ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-800">
                      {log.entity_type}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-green-800 font-bold truncate max-w-[120px]" title={log.entity_id}>
                        {log.entity_id}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono text-gray-600 bg-gray-50/80 p-2 rounded-lg border border-gray-100" title={formatDetails(log.details)}>
                      {formatDetails(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageShell>
  );
}
