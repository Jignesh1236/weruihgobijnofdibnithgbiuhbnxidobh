import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText, Table as TableIcon } from "lucide-react";
import type { Course, EnrollmentWithDetails } from "@shared/schema";

interface ExportReportsProps {
  onClose: () => void;
}

export default function ExportReports({ onClose }: ExportReportsProps) {
  const [reportType, setReportType] = useState("enrollment");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [includePayments, setIncludePayments] = useState(true);
  const [includeStats, setIncludeStats] = useState(true);

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const generateCSV = () => {
    if (!enrollments) return;

    const filteredData = selectedCourse === "all" 
      ? enrollments 
      : enrollments.filter(e => e.courseId === selectedCourse);

    let csvContent = "";
    
    if (reportType === "enrollment") {
      csvContent = "Student Name,Course,Contact,Father Name,Father Contact,Email,Address,Start Date,End Date,Fee Plan,Total Fee,Paid Amount,Balance\n";
      
      filteredData.forEach(enrollment => {
        const paidAmount = enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
        const balance = parseFloat(enrollment.totalFee) - paidAmount;
        
        csvContent += [
          enrollment.studentName,
          enrollment.course.name,
          enrollment.contactNo,
          enrollment.fatherName,
          enrollment.fatherContactNo,
          enrollment.studentEmail,
          enrollment.studentAddress,
          enrollment.startDate,
          enrollment.endDate,
          enrollment.feePlan,
          enrollment.totalFee,
          paidAmount,
          balance
        ].join(",") + "\n";
      });
    } else if (reportType === "payments") {
      csvContent = "Student Name,Course,Payment Date,Amount,Payment Mode,Transaction ID\n";
      
      filteredData.forEach(enrollment => {
        enrollment.payments?.forEach(payment => {
          csvContent += [
            enrollment.studentName,
            enrollment.course.name,
            payment.paymentDate,
            payment.amount,
            payment.paymentMode,
            payment.transactionId || "N/A"
          ].join(",") + "\n";
        });
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    if (!enrollments) return;

    const filteredData = selectedCourse === "all" 
      ? enrollments 
      : enrollments.filter(e => e.courseId === selectedCourse);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportType === "enrollment" ? "Enrollment" : "Payment"} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            .header p { color: #6b7280; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary-card { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
            .summary-card h3 { margin: 0; color: #2563eb; }
            .summary-card p { margin: 5px 0; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Student Management System</h1>
            <p>${reportType === "enrollment" ? "Enrollment Report" : "Payment Report"}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
    `;

    if (includeStats && reportType === "enrollment") {
      const totalStudents = filteredData.length;
      const totalRevenue = filteredData.reduce((sum, e) => {
        const paid = e.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount), 0) || 0;
        return sum + paid;
      }, 0);
      const pendingFees = filteredData.reduce((sum, e) => {
        const paid = e.payments?.reduce((pSum, p) => pSum + parseFloat(p.amount), 0) || 0;
        return sum + (parseFloat(e.totalFee) - paid);
      }, 0);

      htmlContent += `
        <div class="summary">
          <div class="summary-card">
            <h3>${totalStudents}</h3>
            <p>Total Students</p>
          </div>
          <div class="summary-card">
            <h3>₹${totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
          <div class="summary-card">
            <h3>₹${pendingFees.toLocaleString()}</h3>
            <p>Pending Fees</p>
          </div>
        </div>
      `;
    }

    if (reportType === "enrollment") {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Course</th>
              <th>Contact</th>
              <th>Father Name</th>
              <th>Email</th>
              <th>Start Date</th>
              <th>Fee Plan</th>
              <th>Total Fee</th>
              <th>Paid Amount</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
      `;

      filteredData.forEach(enrollment => {
        const paidAmount = enrollment.payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
        const balance = parseFloat(enrollment.totalFee) - paidAmount;
        
        htmlContent += `
          <tr>
            <td>${enrollment.studentName}</td>
            <td>${enrollment.course.name}</td>
            <td>${enrollment.contactNo}</td>
            <td>${enrollment.fatherName}</td>
            <td>${enrollment.studentEmail}</td>
            <td>${enrollment.startDate}</td>
            <td>${enrollment.feePlan}</td>
            <td>₹${parseFloat(enrollment.totalFee).toLocaleString()}</td>
            <td>₹${paidAmount.toLocaleString()}</td>
            <td>₹${balance.toLocaleString()}</td>
          </tr>
        `;
      });

      htmlContent += `
          </tbody>
        </table>
      `;
    } else if (reportType === "payments") {
      htmlContent += `
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Course</th>
              <th>Payment Date</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
      `;

      filteredData.forEach(enrollment => {
        enrollment.payments?.forEach(payment => {
          htmlContent += `
            <tr>
              <td>${enrollment.studentName}</td>
              <td>${enrollment.course.name}</td>
              <td>${payment.paymentDate}</td>
              <td>₹${parseFloat(payment.amount).toLocaleString()}</td>
              <td>${payment.paymentMode}</td>
              <td>${payment.transactionId || "N/A"}</td>
            </tr>
          `;
        });
      });

      htmlContent += `
          </tbody>
        </table>
      `;
    }

    htmlContent += `
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-md bg-[#ffffff]" aria-describedby="export-dialog-description">
        <DialogHeader>
          <DialogTitle>Export Reports</DialogTitle>
          <DialogDescription>
            Export enrollment and payment reports in CSV or PDF format with various filtering options.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Report Type */}
          <div>
            <Label className="text-base font-medium">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollment">Enrollment Report</SelectItem>
                <SelectItem value="payments">Payment Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter */}
          <div>
            <Label className="text-base font-medium">Course Filter</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="mt-2">
                <SelectValue />
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

          {/* Export Options */}
          <div>
            <Label className="text-base font-medium">Export Options</Label>
            <div className="mt-3 space-y-3">
              {reportType === "enrollment" && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeStats" 
                    checked={includeStats}
                    onCheckedChange={(checked) => setIncludeStats(checked === true)}
                  />
                  <Label htmlFor="includeStats">Include summary statistics</Label>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includePayments" 
                  checked={includePayments}
                  onCheckedChange={(checked) => setIncludePayments(checked === true)}
                />
                <Label htmlFor="includePayments">Include payment details</Label>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={generateCSV}
              variant="outline" 
              className="flex items-center justify-center gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              onClick={generatePDF}
              className="flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}