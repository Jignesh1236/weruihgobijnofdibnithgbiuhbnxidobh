import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, Edit, Trash2, Download, Filter, Search,
  Phone, Mail, User, Calendar, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EnrollmentWithDetails, Course, Payment } from "@shared/schema";
import { BATCHES } from "@shared/schema";

interface StudentManagementProps {
  onClose?: () => void;
}

export default function StudentManagement({ onClose }: StudentManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");

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
      const paidAmount = student.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
      const pendingAmount = totalFee - paidAmount;
      
      if (paymentStatusFilter === "paid" && pendingAmount > 0) matchesPaymentStatus = false;
      if (paymentStatusFilter === "pending" && pendingAmount <= 0) matchesPaymentStatus = false;
      if (paymentStatusFilter === "partial" && (pendingAmount <= 0 || pendingAmount >= totalFee)) matchesPaymentStatus = false;
    }
    
    return matchesSearch && matchesCourse && matchesBatch && matchesPaymentStatus;
  });

  const getPaymentStatus = (student: EnrollmentWithDetails) => {
    const totalFee = parseFloat(student.totalFee.toString());
    const paidAmount = student.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
    const pendingAmount = totalFee - paidAmount;
    
    if (pendingAmount <= 0) return { status: "Paid", variant: "default" as const, color: "text-green-600" };
    if (paidAmount === 0) return { status: "Pending", variant: "secondary" as const, color: "text-red-600" };
    return { status: "Partial", variant: "outline" as const, color: "text-yellow-600" };
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this student? This will also delete all payment records.")) {
      deleteMutation.mutate(id);
    }
  };

  const exportToCSV = () => {
    if (!filteredStudents || filteredStudents.length === 0) {
      toast({ title: "No Data", description: "No students to export", variant: "destructive" });
      return;
    }
    
    const csvData = filteredStudents.map(student => {
      const paymentStatus = getPaymentStatus(student);
      const totalFee = parseFloat(student.totalFee.toString());
      const paidAmount = student.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
      
      return {
        "Student Name": student.studentName,
        "Course": student.course?.name || "N/A",
        "Contact": student.contactNo,
        "Email": student.studentEmail,
        "Father Name": student.fatherName,
        "Education": student.studentEducation,
        "Batch": BATCHES.find(b => b.id === student.batchId)?.name || student.batchId,
        "Start Date": student.startDate,
        "End Date": student.endDate,
        "Fee Plan": student.feePlan === 'full' ? 'Full Payment' : 'Installments',
        "Total Fee": `₹${totalFee.toLocaleString('en-IN')}`,
        "Paid Amount": `₹${paidAmount.toLocaleString('en-IN')}`,
        "Pending Amount": `₹${(totalFee - paidAmount).toLocaleString('en-IN')}`,
        "Payment Status": paymentStatus.status,
      };
    });
    
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({ title: "Export Complete", description: "Student data exported to CSV successfully" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by course" />
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
          <SelectTrigger>
            <SelectValue placeholder="Filter by batch" />
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
          <SelectTrigger>
            <SelectValue placeholder="Payment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="paid">Fully Paid</SelectItem>
            <SelectItem value="partial">Partially Paid</SelectItem>
            <SelectItem value="pending">Payment Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{filteredStudents?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fully Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Paid").length || 0}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partial Payment</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Partial").length || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Pending</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredStudents?.filter(s => getPaymentStatus(s).status === "Pending").length || 0}
                </p>
              </div>
              <User className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students List ({filteredStudents?.length || 0} students)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents?.map((student) => {
                  const paymentStatus = getPaymentStatus(student);
                  const totalFee = parseFloat(student.totalFee.toString());
                  const paidAmount = student.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;
                  
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentName}</TableCell>
                      <TableCell>{student.course?.name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {student.contactNo}
                        </div>
                      </TableCell>
                      <TableCell>
                        {BATCHES.find(b => b.id === student.batchId)?.name || student.batchId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatus.variant}>
                          {paymentStatus.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">₹{totalFee.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">
                            Paid: ₹{paidAmount.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {(!filteredStudents || filteredStudents.length === 0) && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}