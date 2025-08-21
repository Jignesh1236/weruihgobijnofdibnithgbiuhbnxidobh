import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Users, Search, Filter, Download, Trash2, Edit, Eye, UserCheck, Phone, Mail, Calendar, Clock, AlertTriangle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { EnrollmentWithDetails, Course, Payment } from "@shared/schema";
import { BATCHES } from "@shared/schema";

export default function StudentSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [viewingStudent, setViewingStudent] = useState<EnrollmentWithDetails | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { data: students, isLoading } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/enrollments/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete student");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch("/api/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "delete" }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete students");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      setSelectedStudents([]);
      toast({
        title: "Success",
        description: "Students deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete students",
        variant: "destructive",
      });
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
    const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => 
      sum + parseFloat(payment.amount.toString()), 0) || 0;
    const pendingAmount = totalFee - paidAmount;

    if (pendingAmount <= 0) {
      return { status: "Paid", variant: "default" as const, color: "bg-green-100 text-green-800" };
    } else if (paidAmount > 0) {
      return { status: "Partial", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { status: "Pending", variant: "outline" as const, color: "bg-red-100 text-red-800" };
    }
  };

  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select students to delete",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedStudents.length} student(s)?`)) {
      bulkDeleteMutation.mutate(selectedStudents);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents?.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents?.map(s => s.id) || []);
    }
  };

  const exportToCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No students to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Student Name", "Email", "Contact", "Father's Name", "Father's Contact", 
      "Course", "Batch", "Start Date", "End Date", "Total Fee", "Paid Amount", 
      "Pending Amount", "Payment Status", "Education", "Address"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredStudents.map(student => {
        const totalFee = parseFloat(student.totalFee.toString());
        const paidAmount = student.payments?.reduce((sum: number, payment: Payment) => 
          sum + parseFloat(payment.amount.toString()), 0) || 0;
        const pendingAmount = totalFee - paidAmount;
        const paymentStatus = getPaymentStatus(student);
        const batch = BATCHES.find(b => b.id === student.batchId);

        return [
          `"${student.studentName}"`,
          `"${student.studentEmail}"`,
          `"${student.contactNo}"`,
          `"${student.fatherName}"`,
          `"${student.fatherContactNo}"`,
          `"${student.course?.name || 'N/A'}"`,
          `"${batch?.name || student.batchId}"`,
          `"${student.startDate}"`,
          `"${student.endDate}"`,
          totalFee,
          paidAmount,
          pendingAmount,
          `"${paymentStatus.status}"`,
          `"${student.studentEducation}"`,
          `"${student.studentAddress}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${filteredStudents.length} students to CSV`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-xl mb-8">
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
                <Users className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Student Management</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Manage enrolled students, view details, and export student data
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg">
                <Users className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredStudents?.length || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</div>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 shadow-lg">
                <UserCheck className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Paid").length || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Fully Paid</div>
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
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Partial").length || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Partial Payment</div>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 shadow-lg">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Pending").length || 0}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Payment Pending</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="stat-card mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, contact, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by Course" />
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

              <Select value={batchFilter} onValueChange={setBatchFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {BATCHES.map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Fully Paid</SelectItem>
                  <SelectItem value="partial">Partial Payment</SelectItem>
                  <SelectItem value="pending">Payment Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={exportToCSV} className="button-secondary">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              
              {selectedStudents.length > 0 && (
                <Button 
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedStudents.length})
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Students Table */}
        <Card className="stat-card">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Enrolled Students ({filteredStudents?.length || 0})
              </h3>
              {filteredStudents && filteredStudents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedStudents.length === filteredStudents.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 text-center">Loading students...</div>
            ) : !filteredStudents || filteredStudents.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>No students found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === filteredStudents.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
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
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
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
                            <div className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {student.contactNo}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Father: {student.fatherContactNo}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {student.startDate}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              to {student.endDate}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">₹{totalFee.toLocaleString()}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Paid: ₹{paidAmount.toLocaleString()}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={paymentStatus.color}>
                            {paymentStatus.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => setViewingStudent(student)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => deleteMutation.mutate(student.id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1"
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
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

        {/* Student Details Modal */}
        {viewingStudent && (
          <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Student Details: {viewingStudent.studentName}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                {/* Course Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Course Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Course:</span>
                      <span className="text-gray-900 dark:text-gray-100">{viewingStudent.course?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Duration:</span>
                      <span className="text-gray-900 dark:text-gray-100">{viewingStudent.course?.duration} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Batch:</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {BATCHES.find((b: any) => b.id === viewingStudent.batchId)?.name || viewingStudent.batchId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Start Date:</span>
                      <span className="text-gray-900 dark:text-gray-100">{viewingStudent.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">End Date:</span>
                      <span className="text-gray-900 dark:text-gray-100">{viewingStudent.endDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Fee Plan:</span>
                      <span className="text-gray-900 dark:text-gray-100 capitalize">{viewingStudent.feePlan}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Payment Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">Payment Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Fee</div>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      ₹{parseFloat(viewingStudent.totalFee.toString()).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="text-sm text-green-600 dark:text-green-400">Paid Amount</div>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      ₹{(viewingStudent.payments?.reduce((sum: number, payment: Payment) => 
                        sum + parseFloat(payment.amount.toString()), 0) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <div className="text-sm text-red-600 dark:text-red-400">Pending Amount</div>
                    <div className="text-lg font-bold text-red-800 dark:text-red-200">
                      ₹{(parseFloat(viewingStudent.totalFee.toString()) - 
                        (viewingStudent.payments?.reduce((sum: number, payment: Payment) => 
                          sum + parseFloat(payment.amount.toString()), 0) || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="text-sm text-purple-600 dark:text-purple-400">Status</div>
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      {getPaymentStatus(viewingStudent).status}
                    </div>
                  </div>
                </div>

                {viewingStudent.payments && viewingStudent.payments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Payment History</h4>
                    <div className="space-y-2">
                      {viewingStudent.payments.map((payment: Payment, index: number) => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <div className="font-medium">₹{parseFloat(payment.amount.toString()).toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{payment.paymentMode}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{payment.paymentDate}</div>
                            {payment.transactionId && (
                              <div className="text-xs text-gray-500">ID: {payment.transactionId}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}