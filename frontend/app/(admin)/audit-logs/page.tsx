"use client";

import { useEffect, useState } from "react";
import { auditService, AuditLog } from "@/app/services/audit";
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
import { Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await auditService.getAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

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
    if (lower.includes('create')) return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    if (lower.includes('update')) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    if (lower.includes('delete') || lower.includes('remove')) return 'bg-red-100 text-red-800 hover:bg-red-100';
    return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Audit Logs</h1>
          <p className="text-gray-500">Track system activities and data changes.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 w-full max-w-md">
        <Search className="w-5 h-5 text-gray-400 ml-2" />
        <Input
          placeholder="Search by action, entity type, ID, or user..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead className="max-w-xs">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Loading audit logs...
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {log.created_at ? (
                      <div>
                        <div className="font-medium text-gray-900">
                          {format(new Date(log.created_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={log.user_id}>
                      {log.user_id || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">
                    {log.entity_type}
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-gray-600 truncate max-w-[120px]" title={log.entity_id}>
                      {log.entity_id}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-gray-500" title={formatDetails(log.details)}>
                    {formatDetails(log.details)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
