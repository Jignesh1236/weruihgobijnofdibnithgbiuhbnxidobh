import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EnrollmentWithDetails } from "@shared/schema";

const paymentSchema = z.object({
  enrollmentId: z.string().min(1, "Please select a student"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Please enter a valid amount"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMode: z.enum(["cash", "card", "upi", "bank_transfer"], {
    required_error: "Please select a payment mode",
  }),
  transactionId: z.string().optional(),
  installmentNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentRecordFormProps {
  enrollment?: EnrollmentWithDetails | null;
  enrollments: EnrollmentWithDetails[];
  onClose: () => void;
}

export default function PaymentRecordForm({ enrollment, enrollments, onClose }: PaymentRecordFormProps) {
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      enrollmentId: enrollment?.id || "",
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: undefined,
      transactionId: "",
      installmentNumber: "",
      notes: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const payload = {
        ...data,
        installmentNumber: data.installmentNumber ? parseInt(data.installmentNumber) : null,
      };
      const response = await apiRequest("POST", "/api/payments", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Payment Recorded!",
        description: "Payment has been successfully recorded.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const selectedEnrollment = enrollments.find(e => e.id === form.watch("enrollmentId"));
  const totalFee = selectedEnrollment ? parseFloat(selectedEnrollment.totalFee) : 0;
  const paidAmount = selectedEnrollment ? 
    selectedEnrollment.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) : 0;
  const balance = totalFee - paidAmount;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-2xl bg-[#e6e8ed]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Record Payment
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection */}
            <FormField
              control={form.control}
              name="enrollmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Student *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {enrollments.map((enrollment) => (
                        <SelectItem key={enrollment.id} value={enrollment.id}>
                          {enrollment.studentName} - {enrollment.course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fee Information Display */}
            {selectedEnrollment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Fee Information</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral">Total Fee:</span>
                    <div className="font-medium">₹{totalFee.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-neutral">Paid Amount:</span>
                    <div className="font-medium">₹{paidAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-neutral">Balance:</span>
                    <div className="font-medium text-red-600">₹{balance.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Mode */}
              <FormField
                control={form.control}
                name="paymentMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction ID */}
              <FormField
                control={form.control}
                name="transactionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction ID</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Enter transaction ID (optional)" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedEnrollment?.studentName) {
                            // Take only first two names from student name
                            const nameParts = selectedEnrollment.studentName.trim().split(/\s+/);
                            const firstTwoNames = nameParts.slice(0, 2).join(' ');
                            // Convert to lowercase and remove spaces
                            const transactionId = firstTwoNames.toLowerCase().replace(/\s+/g, ' ');
                            form.setValue("transactionId", transactionId);
                          }
                        }}
                        className="whitespace-nowrap"
                      >
                        Auto Generate
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Installment Number */}
              {selectedEnrollment?.feePlan === "installments" && (
                <FormField
                  control={form.control}
                  name="installmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Installment Number</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select installment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Installment 1</SelectItem>
                          <SelectItem value="2">Installment 2</SelectItem>
                          <SelectItem value="3">Installment 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this payment (optional)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPaymentMutation.isPending}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 shadow-md hover:shadow-lg h-10 px-6 py-2 text-white hover:bg-primary/90 bg-[#2fa154]"
              >
                {createPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
