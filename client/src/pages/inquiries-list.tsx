import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Search, Filter, Plus, Edit, Trash2, Eye, Check, Clock, UserCheck, MoreVertical, Download, FileSpreadsheet, Calendar, Users, BookOpen, CheckCircle, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InquiryWithCourse, Course } from "@shared/schema";
import { BATCHES } from "@shared/schema";

export default function InquiriesList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedInquiries, setSelectedInquiries] = useState<string[]>([]);
  const [viewingInquiry, setViewingInquiry] = useState<InquiryWithCourse | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: inquiries, isLoading } = useQuery<InquiryWithCourse[]>({
    queryKey: ["/api/inquiries"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/inquiries/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Status Updated",
        description: "Inquiry status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/inquiries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Inquiry Deleted",
        description: "Inquiry has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: async ({ ids, action, status }: { ids: string[]; action: string; status?: string }) => {
      await apiRequest("POST", "/api/inquiries/bulk", { ids, action, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedInquiries([]);
      toast({
        title: "Bulk Action Complete",
        description: "Selected inquiries have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnroll = (inquiryId: string) => {
    console.log("Enrolling inquiry:", inquiryId);
    setLocation(`/inquiry/enroll/${inquiryId}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInquiries(filteredInquiries.map(inquiry => inquiry.id));
    } else {
      setSelectedInquiries([]);
    }
  };

  const handleSelectInquiry = (inquiryId: string, checked: boolean) => {
    if (checked) {
      setSelectedInquiries(prev => [...prev, inquiryId]);
    } else {
      setSelectedInquiries(prev => prev.filter(id => id !== inquiryId));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedInquiries.length === 0) return;
    bulkActionMutation.mutate({ ids: selectedInquiries, action: "updateStatus", status });
  };

  // Helper function to check if an inquiry can be deleted (newer than 1 day, prevent old deletions)
  const canDeleteInquiry = (inquiry: InquiryWithCourse) => {
    if (!inquiry.createdAt) return false; // If no creation date, don't allow deletion
    const createdDate = new Date(inquiry.createdAt);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return createdDate >= oneDayAgo; // Allow deletion only if created within last 1 day
  };

  const handleBulkDelete = () => {
    if (selectedInquiries.length === 0) return;

    // Filter out inquiries that cannot be deleted (less than 1 day old)
    const deletableInquiries = selectedInquiries.filter(id => {
      const inquiry = filteredInquiries.find(i => i.id === id);
      return inquiry && canDeleteInquiry(inquiry);
    });

    if (deletableInquiries.length === 0) {
      toast({
        title: "Cannot Delete",
        description: "Selected inquiries are more than 1 day old and cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    if (deletableInquiries.length < selectedInquiries.length) {
      toast({
        title: "Partial Deletion",
        description: `Only ${deletableInquiries.length} out of ${selectedInquiries.length} inquiries can be deleted. Items more than 1 day old will be skipped.`,
      });
    }

    bulkActionMutation.mutate({ ids: deletableInquiries, action: "delete" });
  };

  const exportToCSV = (exportType: 'basic' | 'detailed' | 'summary' = 'detailed') => {
    let headers: string[] = [];
    let csvData: string[][] = [];
    let filename = '';

    switch (exportType) {
      case 'basic':
        headers = ["Student Name", "Course", "Contact", "Status"];
        csvData = filteredInquiries.map(inquiry => [
          `"${inquiry.studentName}"`,
          `"${inquiry.course.name}"`,
          `"${inquiry.contactNo}"`,
          `"${inquiry.status.toUpperCase()}"`
        ]);
        filename = `inquiries-basic-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case 'detailed':
        headers = [
          "Student Name", "Course", "Course Duration (Months)", "Course Full Fee", "Course Installment Fee",
          "Contact Number", "Father Contact", "Address", "Batch Time", "Status", 
          "Created Date", "Last Updated", "Days Since Created"
        ];
        csvData = filteredInquiries.map(inquiry => {
          const createdDate = inquiry.createdAt ? new Date(inquiry.createdAt) : null;
          const daysSince = createdDate ? Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
          const batchInfo = BATCHES.find(b => b.id === inquiry.batchId);

          return [
            `"${inquiry.studentName}"`,
            `"${inquiry.course.name}"`,
            `"${inquiry.course.duration}"`,
            `"₹${parseFloat(inquiry.course.fullFee).toLocaleString()}"`,
            `"₹${parseFloat(inquiry.course.installmentFee).toLocaleString()}"`,
            `"${inquiry.contactNo}"`,
            `"${inquiry.fatherContactNo}"`,
            `"${inquiry.address}"`,
            `"${batchInfo?.name || 'N/A'} (${batchInfo?.time || 'N/A'})"`,
            `"${inquiry.status.toUpperCase()}"`,
            `"${createdDate ? createdDate.toLocaleDateString('en-IN') : 'N/A'}"`,
            `"${inquiry.updatedAt ? new Date(inquiry.updatedAt).toLocaleDateString('en-IN') : 'N/A'}"`,
            `"${daysSince} days"`
          ];
        });
        filename = `inquiries-detailed-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case 'summary':
        // Group by status and course
        const statusCounts = filteredInquiries.reduce((acc, inquiry) => {
          acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const courseCounts = filteredInquiries.reduce((acc, inquiry) => {
          acc[inquiry.course.name] = (acc[inquiry.course.name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        headers = ["Summary Type", "Category", "Count", "Percentage"];
        csvData = [
          // Status summary
          ...Object.entries(statusCounts).map(([status, count]) => [
            `"Status Summary"`,
            `"${status.toUpperCase()}"`,
            `"${count}"`,
            `"${((count / filteredInquiries.length) * 100).toFixed(1)}%"`
          ]),
          // Course summary
          ...Object.entries(courseCounts).map(([course, count]) => [
            `"Course Summary"`,
            `"${course}"`,
            `"${count}"`,
            `"${((count / filteredInquiries.length) * 100).toFixed(1)}%"`
          ])
        ];
        filename = `inquiries-summary-${new Date().toISOString().split("T")[0]}.csv`;
        break;
    }

    // Add BOM for proper Excel Unicode support
    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...csvData].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${exportType.charAt(0).toUpperCase() + exportType.slice(1)} CSV exported with ${filteredInquiries.length} records.`,
    });
  };

  const exportSelectedOnly = () => {
    if (selectedInquiries.length === 0) {
      toast({
        title: "No Inquiries Selected",
        description: "Please select some inquiries to export.",
        variant: "destructive",
      });
      return;
    }

    const selectedData = filteredInquiries.filter(inquiry => selectedInquiries.includes(inquiry.id));

    const headers = [
      "Student Name", "Course", "Course Duration (Months)", "Course Full Fee", "Course Installment Fee",
      "Contact Number", "Father Contact", "Address", "Batch Time", "Status", 
      "Created Date", "Last Updated", "Days Since Created"
    ];

    const csvData = selectedData.map(inquiry => {
      const createdDate = inquiry.createdAt ? new Date(inquiry.createdAt) : null;
      const daysSince = createdDate ? Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      const batchInfo = BATCHES.find(b => b.id === inquiry.batchId);

      return [
        `"${inquiry.studentName}"`,
        `"${inquiry.course.name}"`,
        `"${inquiry.course.duration}"`,
        `"₹${parseFloat(inquiry.course.fullFee).toLocaleString()}"`,
        `"₹${parseFloat(inquiry.course.installmentFee).toLocaleString()}"`,
        `"${inquiry.contactNo}"`,
        `"${inquiry.fatherContactNo}"`,
        `"${inquiry.address}"`,
        `"${batchInfo?.name || 'N/A'} (${batchInfo?.time || 'N/A'})"`,
        `"${inquiry.status.toUpperCase()}"`,
        `"${createdDate ? createdDate.toLocaleDateString('en-IN') : 'N/A'}"`,
        `"${inquiry.updatedAt ? new Date(inquiry.updatedAt).toLocaleDateString('en-IN') : 'N/A'}"`,
        `"${daysSince} days"`
      ];
    });

    const BOM = '\uFEFF';
    const csvContent = BOM + [headers, ...csvData].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected-inquiries-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Selected ${selectedData.length} inquiries exported successfully.`,
    });
  };

  // Filter inquiries based on search and filters
  const filteredInquiries = inquiries?.filter((inquiry) => {
    const matchesSearch = 
      inquiry.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.contactNo.includes(searchTerm) ||
      inquiry.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = !selectedCourse || selectedCourse === "all" || inquiry.courseId === selectedCourse;
    const matchesStatus = !selectedStatus || selectedStatus === "all" || inquiry.status === selectedStatus;
    const matchesBatch = !selectedBatch || selectedBatch === "all" || inquiry.batchId === selectedBatch;

    return matchesSearch && matchesCourse && matchesStatus && matchesBatch;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <Check className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>;
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <UserCheck className="w-3 h-3 mr-1" />
          Enrolled
        </Badge>;
      case "books_given":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <BookOpen className="w-3 h-3 mr-1" />
          Books Given
        </Badge>;
      case "exam_completed":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Exam Completed
        </Badge>;
      case "certificate_issued":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          <Award className="w-3 h-3 mr-1" />
          Certificate Issued
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const InquiryDetailModal = ({ inquiry }: { inquiry: InquiryWithCourse }) => (
    <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Inquiry Details</DialogTitle>
        <DialogDescription className="text-gray-600 dark:text-gray-400">
          Complete information for {inquiry.studentName}'s inquiry
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4 py-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Student Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {inquiry.studentName}</div>
            <div><span className="font-medium">Contact:</span> {inquiry.contactNo}</div>
            <div><span className="font-medium">Father's Contact:</span> {inquiry.fatherContactNo}</div>
            <div><span className="font-medium">Address:</span> {inquiry.address}</div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Course & Schedule</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Course:</span> {inquiry.course.name}</div>
            <div><span className="font-medium">Duration:</span> {inquiry.course.duration} months</div>
            <div><span className="font-medium">Full Fee:</span> ₹{parseFloat(inquiry.course.fullFee).toLocaleString()}</div>
            <div><span className="font-medium">Installment Fee:</span> ₹{parseFloat(inquiry.course.installmentFee).toLocaleString()}</div>
            <div><span className="font-medium">Batch:</span> {BATCHES.find(b => b.id === inquiry.batchId)?.name} ({BATCHES.find(b => b.id === inquiry.batchId)?.time})</div>
          </div>
        </div>
        <div className="col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Status & Timeline</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Status:</span> 
              {getStatusBadge(inquiry.status)}
            </div>
            <div><span className="font-medium">Created:</span> {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : "N/A"}</div>
            <div><span className="font-medium">Last Updated:</span> {inquiry.updatedAt ? new Date(inquiry.updatedAt).toLocaleString() : "N/A"}</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-4 border-t">
        {inquiry.status !== "enrolled" && (
          <Button 
            onClick={() => handleEnroll(inquiry.id)}
            className="bg-secondary text-white hover:bg-secondary/90"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>
        )}
        <Button 
          variant="outline"
          onClick={() => setLocation(`/inquiry/edit/${inquiry.id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
        {inquiry.status === "pending" && (
          <Button 
            variant="outline"
            onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "confirmed" })}
          >
            <Check className="w-4 h-4 mr-2" />
            Confirm
          </Button>
        )}
      </div>
    </DialogContent>
  );

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
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">All Inquiries</h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Manage and track all student inquiries with comprehensive tools and bulk actions.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setLocation("/inquiry/new")} className="button-primary">
                <Plus className="mr-2 h-4 w-4" />
                New Inquiry
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => exportToCSV('basic')}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Basic Export
                    <span className="ml-auto text-xs text-gray-500">Name, Course, Contact</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV('detailed')}>
                    <Users className="w-4 h-4 mr-2" />
                    Detailed Export
                    <span className="ml-auto text-xs text-gray-500">All Information</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV('summary')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Summary Report
                    <span className="ml-auto text-xs text-gray-500">Statistics & Counts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => exportSelectedOnly()}>
                    <Check className="w-4 h-4 mr-2" />
                    Export Selected Only
                    <span className="ml-auto text-xs text-gray-500">{selectedInquiries.length} selected</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

      {/* Filter and Search */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Search & Filter</h3>
          <Button
            variant="ghost"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        <div className="space-y-4">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, contact, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="books_given">Books Given</SelectItem>
                    <SelectItem value="exam_completed">Exam Completed</SelectItem>
                    <SelectItem value="certificate_issued">Certificate Issued</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Batches</SelectItem>
                    {BATCHES.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCourse("all");
                    setSelectedStatus("all");
                    setSelectedBatch("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedInquiries.length > 0 && (
        <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              {selectedInquiries.length} inquir{selectedInquiries.length === 1 ? 'y' : 'ies'} selected
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("pending")}>
                    <Clock className="w-4 h-4 mr-2" />
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("confirmed")}>
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Confirmed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("books_given")}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Mark as Books Given
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("exam_completed")}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Exam Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate("certificate_issued")}>
                    <Award className="w-4 h-4 mr-2" />
                    Mark as Certificate Issued
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Bulk Enroll Button */}
              {selectedInquiries.some(id => {
                const inquiry = filteredInquiries.find(i => i.id === id);
                return inquiry && (inquiry.status === "pending" || inquiry.status === "confirmed");
              }) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                  onClick={() => {
                    // For bulk enroll, we'll take the first eligible inquiry and redirect to enroll
                    const eligibleInquiry = selectedInquiries.find(id => {
                      const inquiry = filteredInquiries.find(i => i.id === id);
                      return inquiry && (inquiry.status === "pending" || inquiry.status === "confirmed");
                    });
                    if (eligibleInquiry) {
                      handleEnroll(eligibleInquiry);
                    }
                  }}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Enroll Selected
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700"
                    disabled={selectedInquiries.length === 0 || selectedInquiries.every(id => {
                      const inquiry = filteredInquiries.find(i => i.id === id);
                      return inquiry && !canDeleteInquiry(inquiry);
                    })}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Inquiries</AlertDialogTitle>
                    <AlertDialogDescription>
                      {(() => {
                        const deletableCount = selectedInquiries.filter(id => {
                          const inquiry = filteredInquiries.find(i => i.id === id);
                          return inquiry && canDeleteInquiry(inquiry);
                        }).length;
                        const nonDeletableCount = selectedInquiries.length - deletableCount;

                        if (nonDeletableCount > 0) {
                          return `${deletableCount} out of ${selectedInquiries.length} selected inquiries can be deleted. ${nonDeletableCount} inquir${nonDeletableCount === 1 ? 'y is' : 'ies are'} more than 1 day old and will be skipped. This will also remove all related enrollments and payment records. This action cannot be undone.`;
                        } else {
                          return `Are you sure you want to delete ${selectedInquiries.length} selected inquir${selectedInquiries.length === 1 ? 'y' : 'ies'}? This will also remove all related enrollments and payment records. This action cannot be undone.`;
                        }
                      })()}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBulkDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete {(() => {
                        const deletableCount = selectedInquiries.filter(id => {
                          const inquiry = filteredInquiries.find(i => i.id === id);
                          return inquiry && canDeleteInquiry(inquiry);
                        }).length;
                        return deletableCount > 0 ? `(${deletableCount})` : '';
                      })()}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="ghost" size="sm" onClick={() => setSelectedInquiries([])}>
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Inquiries Table */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Student Inquiries ({filteredInquiries.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">Loading inquiries...</div>
          ) : filteredInquiries.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {inquiries?.length === 0 ? "No inquiries found. Start by creating a new inquiry." : "No inquiries match your filters. Try adjusting your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedInquiries.length === filteredInquiries.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Course & Batch</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <Checkbox
                        checked={selectedInquiries.includes(inquiry.id)}
                        onCheckedChange={(checked) => handleSelectInquiry(inquiry.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{inquiry.studentName}</div>
                        <div className="text-sm text-neutral truncate max-w-32">{inquiry.address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{inquiry.course.name}</div>
                      <div className="text-sm text-neutral">
                        {inquiry.course.duration} months • ₹{parseFloat(inquiry.course.fullFee).toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {BATCHES.find(b => b.id === inquiry.batchId)?.name} ({BATCHES.find(b => b.id === inquiry.batchId)?.time})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{inquiry.contactNo}</div>
                      <div className="text-sm text-neutral">Father: {inquiry.fatherContactNo}</div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(inquiry.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-neutral">
                        {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString() : 'N/A'}
                        {!canDeleteInquiry(inquiry) && (
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                            🔒 Protected (Old)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 min-w-[200px]">
                        {/* Dedicated Enroll Button for Pending and Confirmed */}
                        {(inquiry.status === "pending" || inquiry.status === "confirmed") && (
                          <Button 
                            size="sm" 
                            onClick={() => handleEnroll(inquiry.id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm min-w-[80px] flex-shrink-0"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Enroll
                          </Button>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <InquiryDetailModal inquiry={inquiry} />
                        </Dialog>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/inquiry/edit/${inquiry.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {inquiry.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "confirmed" })}>
                                  <Check className="w-4 h-4 mr-2" />
                                  Confirm
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEnroll(inquiry.id)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Enroll Directly
                                </DropdownMenuItem>
                              </>
                            )}
                            {inquiry.status === "confirmed" && (
                              <DropdownMenuItem onClick={() => handleEnroll(inquiry.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Enroll Student
                              </DropdownMenuItem>
                            )}
                            {inquiry.status === "enrolled" && (
                              <>
                                <DropdownMenuItem onClick={() => setLocation(`/enrollments`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Enrollment
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "books_given" })}>
                                  <BookOpen className="w-4 h-4 mr-2" />
                                  Mark Books Given
                                </DropdownMenuItem>
                              </>
                            )}
                            {inquiry.status === "books_given" && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "exam_completed" })}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark Exam Completed
                              </DropdownMenuItem>
                            )}
                            {inquiry.status === "exam_completed" && (
                              <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: inquiry.id, status: "certificate_issued" })}>
                                <Award className="w-4 h-4 mr-2" />
                                Issue Certificate
                              </DropdownMenuItem>
                            )}
                            {inquiry.status === "certificate_issued" && (
                              <DropdownMenuItem onClick={() => setLocation(`/enrollments`)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Enrollment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {canDeleteInquiry(inquiry) ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg bg-[#ffffff]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {inquiry.studentName}'s inquiry? This will also remove all related enrollments and payment records. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteInquiryMutation.mutate(inquiry.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <DropdownMenuItem 
                                disabled
                                className="text-gray-400 cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete (More than 1 day old)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
      </div>
    </div>
  );
}