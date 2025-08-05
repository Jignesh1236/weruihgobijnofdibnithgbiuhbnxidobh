import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Download, Bell, CheckCircle, Clock, AlertTriangle, Users, CreditCard, DollarSign, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PaymentRecordForm from "@/components/payment-record-form";
import StudentPaymentDetails from "@/components/student-payment-details";
import ExportReports from "@/components/export-reports";
import type { EnrollmentWithDetails } from "@shared/schema";

type Stats = {
  totalInquiries: number;
  enrolledStudents: number;
  pendingPayments: string;
  overduePayments: number;
  totalCollected: string;
};

export default function FeesManagement() {
  const [, setLocation] = useLocation();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: enrollments, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });



  const handleRecordPayment = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setShowPaymentForm(true);
  };

  const handleViewDetails = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setShowDetailsModal(true);
  };



  const getPaymentStatus = (enrollment: EnrollmentWithDetails) => {
    const totalFee = parseFloat(enrollment.totalFee);
    const paidAmount = enrollment.payments.reduce((sum, payment) => 
      sum + parseFloat(payment.amount), 0);

    if (paidAmount >= totalFee) {
      return { status: "Paid", variant: "default" as const, color: "text-green-800 bg-green-100" };
    } else if (paidAmount > 0) {
      return { status: "Partial", variant: "secondary" as const, color: "text-yellow-800 bg-yellow-100" };
    } else {
      // Check if overdue (30 days from start date)
      const dueDate = new Date(enrollment.startDate);
      dueDate.setDate(dueDate.getDate() + 30);
      const isOverdue = new Date() > dueDate;

      if (isOverdue) {
        return { status: "Overdue", variant: "destructive" as const, color: "text-red-800 bg-red-100" };
      } else {
        return { status: "Pending", variant: "outline" as const, color: "text-gray-800 bg-gray-100" };
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-2xl shadow-xl mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-white hover:bg-white/20 mb-6 rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Fees Management</h1>
          </div>
          <p className="text-green-100 text-lg">Track payments, manage installments, and generate comprehensive fee reports for all enrolled students.</p>
        </div>
      </div>

      {/* Fees Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="stat-card">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 shadow-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{stats?.totalCollected ? parseFloat(stats.totalCollected).toLocaleString() : '0'}
              </div>
              <div className="text-sm font-medium text-neutral">Total Collected</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-3 shadow-lg">
              <Clock className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                ₹{stats?.pendingPayments ? parseFloat(stats.pendingPayments).toLocaleString() : '0'}
              </div>
              <div className="text-sm font-medium text-neutral">Pending Payments</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 shadow-lg">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.overduePayments || 0}</div>
              <div className="text-sm font-medium text-neutral">Overdue Students</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg">
              <Users className="text-white" size={24} />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.enrolledStudents || 0}</div>
              <div className="text-sm font-medium text-neutral">Enrolled Students</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button 
          onClick={() => setShowPaymentForm(true)}
          className="button-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Record Payment
        </Button>
        <Button 
          onClick={() => setShowExportModal(true)}
          className="button-secondary"
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
        <Button 
          onClick={() => setLocation("/fees")}
          variant="outline"
          className="border-2"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          View Payment History
        </Button>

        <Button 
          onClick={() => {
            // Filter students with pending payments
            const pendingStudents = enrollments?.filter(enrollment => {
              const totalFee = parseFloat(enrollment.totalFee);
              const paidAmount = enrollment.payments.reduce((sum, payment) => 
                sum + parseFloat(payment.amount), 0);
              return paidAmount < totalFee;
            }) || [];

            if (pendingStudents.length === 0) {
              alert("No pending payments found. All students are up to date!");
              return;
            }

            // Create reminder message
            const reminderList = pendingStudents.map(student => {
              const totalFee = parseFloat(student.totalFee);
              const paidAmount = student.payments.reduce((sum, payment) => 
                sum + parseFloat(payment.amount), 0);
              const balance = totalFee - paidAmount;
              return `${student.studentName} (${student.course.name}) - Balance: ₹${balance.toLocaleString()}`;
            }).join('\n');

            const message = `Payment Reminder List:\n\n${reminderList}\n\nNote: Contact these students for pending fee payments.`;

            // Create downloadable reminder file
            const blob = new Blob([message], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `payment-reminders-${new Date().toISOString().split('T')[0]}.txt`;
            link.click();
            URL.revokeObjectURL(url);

            alert(`Generated reminder list for ${pendingStudents.length} students with pending payments.`);
          }}
          className="button-success"
        >
          <Bell className="mr-2 h-4 w-4" />
          Send Reminders
        </Button>
      </div>

      {/* Student Fees Table */}
      <Card className="stat-card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Student Fee Status</h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">Loading enrollment data...</div>
          ) : !enrollments || enrollments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No enrollments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => {
                  const totalFee = parseFloat(enrollment.totalFee);
                  const paidAmount = enrollment.payments.reduce((sum, payment) => 
                    sum + parseFloat(payment.amount), 0);
                  const balance = totalFee - paidAmount;
                  const paymentStatus = getPaymentStatus(enrollment);

                  return (
                    <TableRow key={enrollment.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-primary">
                              {enrollment.studentName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{enrollment.studentName}</div>
                            <div className="text-sm text-neutral">{enrollment.contactNo}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">{enrollment.course.name}</div>
                        <div className="text-sm text-neutral">{enrollment.course.duration} months</div>
                      </TableCell>
                      <TableCell>₹{totalFee.toLocaleString()}</TableCell>
                      <TableCell>₹{paidAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={paymentStatus.color}>
                          {paymentStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 flex-wrap gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleRecordPayment(enrollment)}
                            className="button-primary text-sm px-3 py-1"
                          >
                            Record Payment
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                            className="button-secondary text-sm px-3 py-1"
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(enrollment)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1 shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            Receipt
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Payment Record Form Modal */}
      {showPaymentForm && (
        <PaymentRecordForm
          enrollment={selectedEnrollment}
          enrollments={enrollments || []}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedEnrollment(null);
          }}
        />
      )}

      {/* Student Payment Details Modal */}
      {showDetailsModal && selectedEnrollment && (
        <StudentPaymentDetails
          enrollment={selectedEnrollment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedEnrollment(null);
          }}
        />
      )}

      {/* Export Reports Modal */}
      {showExportModal && (
        <ExportReports
          onClose={() => setShowExportModal(false)}
        />
      )}
      </div>
    </div>
  );
}