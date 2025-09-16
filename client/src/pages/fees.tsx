import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  ArrowLeft, 
  Search, 
  Filter,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  X,
  Download
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

import type { PaymentWithEnrollment } from "@shared/schema";

type Payment = PaymentWithEnrollment;

type Stats = {
  totalCollected: string;
  pendingPayments: string;
  overduePayments: number;
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash Payment" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "upi", label: "UPI Payment" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque Payment" },
  { value: "online", label: "Online Payment" },
  { value: "netbanking", label: "Net Banking" },
];

export default function Fees() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const filteredPayments = payments.filter(payment => {
    // Don't show payments from cancelled students
    if (payment.enrollment.cancelled) {
      return false;
    }
    
    const matchesSearch = payment.enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.enrollment.course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === "all" || payment.paymentMode === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString()}`;
  };

  const exportToCSV = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({
        title: "No Data",
        description: "No payments to export",
        variant: "destructive",
      });
      return;
    }

    // Helper function to escape CSV values
    const escapeCSVValue = (value: any) => {
      if (value === null || value === undefined) return '""';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return `"${stringValue}"`;
    };

    const csvData = filteredPayments.map(payment => ({
      'Student': payment.enrollment?.studentName || 'N/A',
      'Course': payment.enrollment?.course?.name || 'N/A',
      'Amount': `₹${parseFloat(payment.amount.toString()).toLocaleString()}`,
      'Payment Date': formatDate(payment.paymentDate),
      'Payment Method': PAYMENT_METHODS.find(m => m.value === payment.paymentMode)?.label || payment.paymentMode,
      'Transaction ID': payment.transactionId || 'N/A',
      'Status': 'Completed'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.map(header => escapeCSVValue(header)).join(','),
      ...csvData.map(row => headers.map(header => escapeCSVValue(row[header as keyof typeof row])).join(','))
    ].join('\n');

    // Add BOM for proper Excel Unicode support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredPayments.length} payment records to CSV`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      cash: { color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
      card: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
      upi: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300" },
      bank_transfer: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300" },
      cheque: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300" },
      online: { color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300" },
      netbanking: { color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300" },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.cash;
    return (
      <Badge className={`${config.color} border-0 font-medium px-3 py-1 rounded-full`}>
        {PAYMENT_METHODS.find(m => m.value === method)?.label || method.charAt(0).toUpperCase() + method.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen hero-gradient">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Fees Management</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Track payments and monitor financial performance across all enrolled students.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setLocation("/fees-management")} 
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Student Fees
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 slide-up">
          <Card className="stat-card">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats ? formatCurrency(stats.totalCollected) : '₹0'}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collected</div>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats ? formatCurrency(stats.pendingPayments) : '₹0'}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</div>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats?.overduePayments || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</div>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {payments.length}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="form-card mb-8 slide-up">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by student name or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-xl border-2 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger className="w-56 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Filter className="mr-2 h-4 w-4 text-gray-500" />
                    <SelectValue placeholder="Filter by Payment Method" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-50">
                    <SelectItem value="all" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                      All Payment Methods
                    </SelectItem>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem 
                        key={method.value} 
                        value={method.value}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                      >
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setSearchTerm("");
                    setMethodFilter("all");
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Payments Table */}
        <Card className="table-enhanced slide-up">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment History</h3>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1">
                  {filteredPayments.length} transactions
                </Badge>
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={filteredPayments.length === 0}
                  className="rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>

            {paymentsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-500 mb-2">No Payments Found</p>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || methodFilter !== "all" 
                    ? "No payments match your current filters." 
                    : "No payment records available yet. Go to Student Fees Management to record payments."}
                </p>
                <Button 
                  onClick={() => setLocation("/fees-management")}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Record Student Payments
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold">Student</TableHead>
                      <TableHead className="font-semibold">Course</TableHead>
                      <TableHead className="font-semibold">Amount</TableHead>
                      <TableHead className="font-semibold">Payment Date</TableHead>
                      <TableHead className="font-semibold">Method</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="table-row-hover border-gray-100 dark:border-gray-800">
                        <TableCell className="font-medium">
                          {payment.enrollment.studentName}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {payment.enrollment.course.name}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-400">
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge(payment.paymentMode)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
