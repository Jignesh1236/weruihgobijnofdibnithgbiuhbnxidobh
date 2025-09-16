import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Download, Bell, CheckCircle, Clock, AlertTriangle, Users, CreditCard, DollarSign, MessageSquare, UserCheck, Edit, Trash2, Settings, Search, Filter, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentRecordForm from "@/components/payment-record-form";
import StudentPaymentDetails from "@/components/student-payment-details";
import ExportReports from "@/components/export-reports";
import CustomStudentFeeForm from "@/components/custom-student-fee-form";
import type { EnrollmentWithDetails, CustomStudentFeeWithCourse } from "@shared/schema";

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
  const [showCustomFeeForm, setShowCustomFeeForm] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentWithDetails | null>(null);
  const [selectedCustomFee, setSelectedCustomFee] = useState<CustomStudentFeeWithCourse | null>(null);
  const [activeTab, setActiveTab] = useState("payments");
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: enrollments, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: customFees, isLoading: customFeesLoading } = useQuery<CustomStudentFeeWithCourse[]>({
    queryKey: ["/api/custom-fees"],
  });

  // Payment status helper function (moved up to fix hoisting issue)
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

  // Filter enrollments based on search and filters
  const filteredEnrollments = enrollments?.filter(enrollment => {
    // Don't show cancelled students
    if (enrollment.cancelled) {
      return false;
    }
    
    const matchesSearch = 
      enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.contactNo.includes(searchTerm);
    
    const paymentStatus = getPaymentStatus(enrollment);
    const matchesStatus = statusFilter === "all" || paymentStatus.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesCourse = courseFilter === "all" || enrollment.course.name === courseFilter;
    
    return matchesSearch && matchesStatus && matchesCourse;
  }) || [];

  // Get unique courses for course filter dropdown
  const uniqueCourses = Array.from(new Set(enrollments?.map(e => e.course.name) || []));

  const deleteCustomFeeMutation = useMutation({
    mutationFn: async (feeId: string) => {
      const response = await fetch(`/api/custom-fees/${feeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete custom fee");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all fee-related caches
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Success",
        description: "Custom fee deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete custom fee",
        variant: "destructive",
      });
    },
  });



  const handleRecordPayment = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setShowPaymentForm(true);
  };

  const handleViewDetails = (enrollment: EnrollmentWithDetails) => {
    setSelectedEnrollment(enrollment);
    setShowDetailsModal(true);
  };

  const handleEditCustomFee = (customFee: CustomStudentFeeWithCourse) => {
    setSelectedCustomFee(customFee);
    setShowCustomFeeForm(true);
  };

  const handleDeleteCustomFee = (feeId: string) => {
    if (window.confirm("Are you sure you want to delete this custom fee?")) {
      deleteCustomFeeMutation.mutate(feeId);
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

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Fee Payments
          </TabsTrigger>
          <TabsTrigger value="custom-fees" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Student Fee Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-8">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
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
            
            {/* Search and Filter Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by student name, course, or contact number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl border-2 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-56 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Filter className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-50">
                      <SelectItem value="all" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        All Payment Status
                      </SelectItem>
                      <SelectItem value="paid" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        Paid
                      </SelectItem>
                      <SelectItem value="partial" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        Partial
                      </SelectItem>
                      <SelectItem value="pending" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        Pending
                      </SelectItem>
                      <SelectItem value="overdue" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        Overdue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-56 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Filter className="mr-2 h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Filter by Course" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl z-50">
                      <SelectItem value="all" className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer">
                        All Courses
                      </SelectItem>
                      {uniqueCourses.map((course) => (
                        <SelectItem 
                          key={course} 
                          value={course}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 cursor-pointer"
                        >
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    className="rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setCourseFilter("all");
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
              
              {/* Results counter */}
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredEnrollments.length} of {enrollments?.length || 0} students
                {(searchTerm || statusFilter !== "all" || courseFilter !== "all") && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    (filtered)
                  </span>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-6 text-center">Loading enrollment data...</div>
              ) : !enrollments || enrollments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No enrollments found</div>
              ) : filteredEnrollments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No students match your current filters. Try adjusting your search or filters.
                </div>
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
                    {filteredEnrollments.map((enrollment) => {
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
                              <div className="text-xs text-blue-600">
                                Installments: ₹{parseFloat(enrollment.course.installment1?.toString() || '0').toLocaleString()} + ₹{parseFloat(enrollment.course.installment2?.toString() || '0').toLocaleString()}
                              </div>
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
        </TabsContent>

        <TabsContent value="custom-fees" className="space-y-8">
          {/* Custom Fees Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => {
                setSelectedCustomFee(null);
                setShowCustomFeeForm(true);
              }}
              className="button-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Change to Custom Fee
            </Button>
            <Button 
              onClick={() => setShowExportModal(true)}
              className="button-secondary"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Custom Fees
            </Button>
          </div>

          {/* Custom Student Fees Table */}
          <Card className="stat-card">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Custom Student Fee Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Manage special fee structures for students (scholarships, discounts, etc.)
              </p>
            </div>
            <div className="overflow-x-auto">
              {customFeesLoading ? (
                <div className="p-6 text-center">Loading custom fees...</div>
              ) : !customFees || customFees.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No custom fees configured</p>
                  <p className="text-sm">Add custom fee structures for students with special requirements</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Custom Fee Structure</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customFees.map((customFee) => (
                      <TableRow key={customFee.id} className="table-row-hover">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
                              <UserCheck className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {customFee.studentName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {customFee.contactNo}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {customFee.course?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customFee.customFullFee && (
                              <div className="text-sm">
                                <span className="font-medium">Full:</span> ₹{parseFloat(customFee.customFullFee.toString()).toLocaleString()}
                              </div>
                            )}
                            {(customFee.customInstallment1 || customFee.customInstallment2) && (
                              <div className="text-sm">
                                <span className="font-medium">Installments:</span> 
                                {customFee.customInstallment1 && ` ₹${parseFloat(customFee.customInstallment1.toString()).toLocaleString()}`}
                                {customFee.customInstallment2 && ` + ₹${parseFloat(customFee.customInstallment2.toString()).toLocaleString()}`}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {customFee.reason || 'No reason specified'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {customFee.createdBy}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditCustomFee(customFee)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDeleteCustomFee(customFee.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                              disabled={deleteCustomFeeMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Custom Student Fee Form Modal */}
      {showCustomFeeForm && (
        <CustomStudentFeeForm
          customFee={selectedCustomFee}
          onClose={() => {
            setShowCustomFeeForm(false);
            setSelectedCustomFee(null);
          }}
        />
      )}
      </div>
    </div>
  );
}
