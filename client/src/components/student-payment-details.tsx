import { useQuery } from "@tanstack/react-query";
import { X, Calendar, CreditCard, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { EnrollmentWithDetails, Payment } from "@shared/schema";

interface StudentPaymentDetailsProps {
  enrollment: EnrollmentWithDetails;
  onClose: () => void;
}

export default function StudentPaymentDetails({ enrollment, onClose }: StudentPaymentDetailsProps) {
  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ["/api/enrollments", enrollment.id, "payments"],
  });

  const totalFee = parseFloat(enrollment.totalFee);
  const paidAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const balance = totalFee - paidAmount;

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case "cash":
        return "💵";
      case "card":
        return "💳";
      case "upi":
        return "📱";
      case "bank_transfer":
        return "🏦";
      default:
        return "💰";
    }
  };

  const generateReceipt = (payment: Payment) => {
    const receiptData = {
      receiptNumber: `RCPT-${payment.id.slice(-8).toUpperCase()}`,
      studentName: enrollment.studentName,
      course: enrollment.course.name,
      amount: parseFloat(payment.amount),
      paymentDate: new Date(payment.paymentDate).toLocaleDateString('en-IN'),
      paymentMode: payment.paymentMode,
      transactionId: payment.transactionId || "N/A",
      contactNo: enrollment.contactNo,
      batchTime: enrollment.batchId ? `Batch ${enrollment.batchId}` : "Not assigned"
    };

    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
        .receipt-container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 25px -30px; }
        .header h1 { color: #1e40af; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px; }
        .header .tagline { color: #64748b; font-style: italic; margin: 5px 0 15px 0; font-size: 14px; }
        .receipt-no { font-size: 18px; font-weight: bold; color: #2563eb; background: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
        .section { margin: 20px 0; }
        .section h3 { color: #1e40af; margin-bottom: 10px; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
        .label { font-weight: 600; color: #374151; width: 40%; }
        .value { color: #111827; font-weight: 500; }
        .amount { font-size: 28px; font-weight: bold; color: #059669; text-align: center; 
                 background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid #22c55e; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; 
                 border-top: 2px solid #e2e8f0; color: #6b7280; background: #f8fafc; margin-left: -30px; margin-right: -30px; padding-left: 30px; padding-right: 30px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { padding: 12px 0; border-bottom: 1px dotted #d1d5db; }
        .no-border { border-bottom: none; }
        .institution-name { color: #1e40af; font-weight: bold; font-size: 16px; }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <h1>SANTMEGH COMPUTER EDUCATION</h1>
            <p class="tagline">Excellence in Computer Education</p>
            <p style="margin: 10px 0; font-weight: 600; font-size: 18px;">Payment Receipt</p>
            <div class="receipt-no">Receipt No: ${receiptData.receiptNumber}</div>
            <p style="margin: 10px 0; font-size: 14px;">Date: ${new Date().toLocaleDateString('en-IN')}</p>
        </div>

    <div class="section">
        <h3>Student Information</h3>
        <table>
            <tr><td class="label">Name:</td><td class="value">${receiptData.studentName}</td></tr>
            <tr><td class="label">Contact:</td><td class="value">${receiptData.contactNo}</td></tr>
            <tr><td class="label">Course:</td><td class="value">${receiptData.course}</td></tr>
            <tr><td class="label">Batch:</td><td class="value no-border">${receiptData.batchTime}</td></tr>
        </table>
    </div>

    <div class="amount">₹${receiptData.amount.toLocaleString()}</div>

    <div class="section">
        <h3>Payment Information</h3>
        <table>
            <tr><td class="label">Payment Date:</td><td class="value">${receiptData.paymentDate}</td></tr>
            <tr><td class="label">Payment Method:</td><td class="value">${receiptData.paymentMode.replace('_', ' ').toUpperCase()}</td></tr>
            <tr><td class="label">Transaction ID:</td><td class="value no-border">${receiptData.transactionId}</td></tr>
        </table>
    </div>

    <div class="footer">
        <p><strong>Thank you for your payment!</strong></p>
        <p>This is a computer generated receipt.</p>
        <p class="institution-name">SANTMEGH COMPUTER EDUCATION</p>
        <p style="font-size: 12px; margin: 2px 0;">Excellence in Computer Education</p>
        <p style="font-size: 12px; margin: 2px 0;">For any queries, please contact the institute office.</p>
        <p style="font-size: 11px; color: #9ca3af; margin-top: 10px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
    </div>
    </div>
</body>
</html>
    `.trim();

    // Create a downloadable HTML file
    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${receiptData.receiptNumber}-${receiptData.studentName.replace(/\s+/g, '_')}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="bg-white dark:bg-gray-800">
          <DialogTitle className="flex items-center justify-between text-gray-900 dark:text-gray-100">
            Payment Details - {enrollment.studentName}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Summary */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Student Name</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{enrollment.studentName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Course</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{enrollment.course.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Contact</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{enrollment.contactNo}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Course Duration</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{enrollment.course.duration} months</div>
              </div>
            </div>
          </Card>

          {/* Fee Summary */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Fee Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalFee.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Fee</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{paidAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">₹{balance.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Payment Progress</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 dark:bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((paidAmount / totalFee) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {((paidAmount / totalFee) * 100).toFixed(1)}% completed
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment History</h3>
              <Badge variant="outline" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">{payments.length} payments made</Badge>
            </div>
            
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No payments recorded yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 dark:border-gray-700">
                    <TableHead className="text-gray-900 dark:text-gray-100">Date</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Amount</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Mode</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Transaction ID</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Installment</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Notes</TableHead>
                    <TableHead className="text-gray-900 dark:text-gray-100">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700">
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        ₹{parseFloat(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        <div className="flex items-center">
                          <span className="mr-2">{getPaymentModeIcon(payment.paymentMode)}</span>
                          <span className="capitalize">{payment.paymentMode.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.transactionId || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {payment.installmentNumber ? (
                          <Badge variant="outline" className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                            Installment {payment.installmentNumber}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.notes || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateReceipt(payment)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}