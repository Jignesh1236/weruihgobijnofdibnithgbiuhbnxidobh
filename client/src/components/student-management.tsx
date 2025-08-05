import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, Edit, Trash2, Download, Filter, Search,
  Phone, Mail, User, Calendar, CreditCard, Eye, UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EnrollmentWithDetails, Course, Payment } from "@shared/schema";
import { BATCHES } from "@shared/schema";

interface StudentManagementProps {
  onClose?: () => void;
  searchTerm?: string;
}

export default function StudentManagement({ onClose, searchTerm: globalSearchTerm }: StudentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState(globalSearchTerm || "");
  
  // Sync with global search term
  useEffect(() => {
    if (globalSearchTerm !== undefined) {
      setSearchTerm(globalSearchTerm);
    }
  }, [globalSearchTerm]);
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [viewingStudent, setViewingStudent] = useState<EnrollmentWithDetails | null>(null);

  const { data: students, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/enrollments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({ title: "Success", description: "Student deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete student", variant: "destructive" });
    },
  });

  const filteredStudents = students?.filter((student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.contactNo.includes(searchTerm) ||
                         student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !courseFilter || courseFilter === "all" || student.courseId === courseFilter;
    const matchesBatch = !batchFilter || batchFilter === "all" || student.batchId === batchFilter;
    
    let matchesPaymentStatus = true;
    if (paymentStatusFilter && paymentStatusFilter !== "all") {
      const totalFee = parseFloat(student.totalFee.toString());
      const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
      const pendingAmount = totalFee - paidAmount;
      
      if (paymentStatusFilter === "paid" && pendingAmount > 0) matchesPaymentStatus = false;
      if (paymentStatusFilter === "pending" && pendingAmount <= 0) matchesPaymentStatus = false;
      if (paymentStatusFilter === "partial" && (pendingAmount <= 0 || pendingAmount >= totalFee)) matchesPaymentStatus = false;
    }
    
    return matchesSearch && matchesCourse && matchesBatch && matchesPaymentStatus;
  });

  const getPaymentStatus = (student: EnrollmentWithDetails) => {
    const totalFee = parseFloat(student.totalFee.toString());
    const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
    const pendingAmount = totalFee - paidAmount;
    
    if (pendingAmount <= 0) return { status: "paid", label: "Paid", color: "bg-green-100 text-green-800" };
    if (paidAmount > 0) return { status: "partial", label: "Partial", color: "bg-yellow-100 text-yellow-800" };
    return { status: "pending", label: "Pending", color: "bg-red-100 text-red-800" };
  };

  const exportStudentData = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      toast({ title: "No Data", description: "No students to export", variant: "destructive" });
      return;
    }

    const csvData = filteredStudents.map(student => {
      const paymentStatus = getPaymentStatus(student);
      const totalFee = parseFloat(student.totalFee.toString());
      const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
      const batch = BATCHES.find((b: any) => b.id === student.batchId);
      
      return {
        'Student Name': student.studentName,
        'Email': student.studentEmail,
        'Contact': student.contactNo,
        'Father Name': student.fatherName,
        'Father Contact': student.fatherContactNo,
        'Course': student.course?.name || 'N/A',
        'Batch': batch?.name || student.batchId,
        'Start Date': student.startDate,
        'End Date': student.endDate,
        'Fee Plan': student.feePlan,
        'Total Fee': totalFee,
        'Paid Amount': paidAmount,
        'Pending Amount': totalFee - paidAmount,
        'Payment Status': paymentStatus.label,
        'Education': student.studentEducation,
        'Address': student.studentAddress
      };
    });

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({ title: "Export Complete", description: "Student data exported successfully" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading student data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Total: {filteredStudents?.length || 0} students found
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={exportStudentData}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Course Filter */}
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses?.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Batch Filter */}
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {BATCHES.map((batch: any) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.name} ({batch.time})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-0">
          {filteredStudents && filteredStudents.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Student</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Course & Batch</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Contact</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Duration</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Fee Details</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Payment Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const paymentStatus = getPaymentStatus(student);
                    const totalFee = parseFloat(student.totalFee.toString());
                    const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
                    const batch = BATCHES.find((b: any) => b.id === student.batchId);

                    return (
                      <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {student.studentName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.studentEmail}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {student.course?.name || 'N/A'}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {batch?.name || student.batchId}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {student.contactNo}
                            </div>
                            <div className="text-xs text-gray-500">
                              Father: {student.fatherContactNo}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {new Date(student.startDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {new Date(student.endDate).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-green-600">
                              ₹{totalFee.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Plan: {student.feePlan}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-2">
                            <Badge className={paymentStatus.color}>
                              {paymentStatus.label}
                            </Badge>
                            <div className="text-xs space-y-1">
                              <div className="text-green-600">Paid: ₹{paidAmount.toLocaleString()}</div>
                              <div className="text-red-600">Pending: ₹{(totalFee - paidAmount).toLocaleString()}</div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="View Details"
                              onClick={() => setViewingStudent(student)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Fee Management"
                              onClick={() => setLocation('/fees-management')}
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="View All Fees"
                              onClick={() => setLocation('/fees')}
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this student record? This action cannot be undone.')) {
                                  deleteMutation.mutate(student.id);
                                }
                              }}
                              title="Delete Student"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No students found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm || courseFilter || batchFilter || paymentStatusFilter 
                  ? "No students match your current filters. Try adjusting your search criteria."
                  : "No students have been enrolled yet. Students will appear here once they complete the enrollment process."
                }
              </p>
              {(searchTerm || courseFilter || batchFilter || paymentStatusFilter) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("");
                    setCourseFilter("");
                    setBatchFilter("");
                    setPaymentStatusFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {filteredStudents && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Students</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {filteredStudents.length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    ₹{filteredStudents.reduce((sum, student) => {
                      const paidAmount = student.payments?.reduce((pSum: number, payment: Payment) => pSum + parseFloat(payment.amount.toString()), 0) || 0;
                      return sum + paidAmount;
                    }, 0).toLocaleString()}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Pending Fees</p>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    ₹{filteredStudents.reduce((sum, student) => {
                      const totalFee = parseFloat(student.totalFee.toString());
                      const paidAmount = student.payments?.reduce((pSum: number, payment: Payment) => pSum + parseFloat(payment.amount.toString()), 0) || 0;
                      return sum + (totalFee - paidAmount);
                    }, 0).toLocaleString()}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Details Modal */}
      {viewingStudent && (
        <Dialog open={true} onOpenChange={() => setViewingStudent(null)}>
          <DialogContent className="max-w-3xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Student Details - {viewingStudent.studentName}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Complete information for {viewingStudent.studentName}'s enrollment
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Personal Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.studentEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Contact:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.contactNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Father's Contact:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.fatherContactNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Father's Name:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.fatherName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Address:</span>
                    <span className="text-gray-900 dark:text-gray-100 text-right">{viewingStudent.inquiry?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Course & Schedule Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Course & Schedule</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Course:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.course?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Batch:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {BATCHES.find(b => b.id === viewingStudent.batchId)?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Start Date:</span>
                    <span className="text-gray-900 dark:text-gray-100">{new Date(viewingStudent.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">End Date:</span>
                    <span className="text-gray-900 dark:text-gray-100">{new Date(viewingStudent.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Fee Plan:</span>
                    <span className="text-gray-900 dark:text-gray-100">{viewingStudent.feePlan}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Total Fee</div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-400">
                      ₹{parseFloat(viewingStudent.totalFee.toString()).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">Paid Amount</div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-400">
                      ₹{(viewingStudent.payments?.reduce((sum: number, p: Payment) => sum + parseFloat(p.amount.toString()), 0) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <div className="text-sm font-medium text-orange-600">Pending Amount</div>
                    <div className="text-lg font-bold text-orange-800 dark:text-orange-400">
                      ₹{(parseFloat(viewingStudent.totalFee.toString()) - (viewingStudent.payments?.reduce((sum: number, p: Payment) => sum + parseFloat(p.amount.toString()), 0) || 0)).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                {viewingStudent.payments && viewingStudent.payments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Payment History</h4>
                    <div className="space-y-2">
                      {viewingStudent.payments.map((payment: Payment, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{payment.paymentMode}</Badge>
                            <span className="text-sm">{new Date(payment.paymentDate).toLocaleDateString()}</span>
                          </div>
                          <span className="font-medium text-green-600">₹{parseFloat(payment.amount.toString()).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline"
                onClick={() => setLocation('/fees-management')}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Fee Management
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation('/fees')}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                View All Fees
              </Button>
              <Button 
                variant="outline"
                onClick={() => setViewingStudent(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}