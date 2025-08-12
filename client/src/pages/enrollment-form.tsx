import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InquiryWithCourse } from "@shared/schema";
import { BATCHES } from "@shared/schema";

const enrollmentSchema = z.object({
  inquiryId: z.string(),
  studentName: z.string(),
  courseId: z.string(),
  contactNo: z.string(),
  fatherName: z.string().min(2, "Father name must be at least 2 characters"),
  fatherContactNo: z.string(),
  studentEducation: z.string().min(2, "Education field is required"),
  studentEmail: z.string().email("Please enter a valid email address"),
  studentAddress: z.string(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  feePlan: z.string().min(1, "Please select a fee plan"),
  totalFee: z.string(),
  batchId: z.string(),
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

export default function EnrollmentForm() {
  const [, params] = useRoute("/inquiry/enroll/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const inquiryId = params?.id;

  const { data: inquiry } = useQuery<InquiryWithCourse>({
    queryKey: ["/api/inquiries", inquiryId],
    enabled: !!inquiryId,
  });

  // Check for custom fees for this student
  const { data: customFee } = useQuery({
    queryKey: ["/api/custom-fees/check", inquiry?.studentName, inquiry?.contactNo, inquiry?.courseId],
    queryFn: async () => {
      if (!inquiry?.studentName || !inquiry?.contactNo || !inquiry?.courseId) return null;
      
      const response = await fetch(`/api/custom-fees/check/${encodeURIComponent(inquiry.studentName)}/${encodeURIComponent(inquiry.contactNo)}/${inquiry.courseId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.hasCustomFee ? data.customFee : null;
    },
    enabled: !!inquiry?.studentName && !!inquiry?.contactNo && !!inquiry?.courseId,
  });

  const form = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      inquiryId: inquiryId || "",
      studentName: "",
      courseId: "",
      contactNo: "",
      fatherName: "",
      fatherContactNo: "",
      studentEducation: "",
      studentEmail: "",
      studentAddress: "",
      startDate: "",
      endDate: "",
      feePlan: undefined,
      totalFee: "",
      batchId: "",
    },
  });

  // Auto-fill form when inquiry data is loaded
  useEffect(() => {
    if (inquiry) {
      // Use custom fee if available, otherwise use course fee
      const defaultFee = customFee?.customFullFee || inquiry.course.fullFee;
      
      form.reset({
        inquiryId: inquiry.id,
        studentName: inquiry.studentName,
        courseId: inquiry.courseId,
        contactNo: inquiry.contactNo,
        fatherName: "",
        fatherContactNo: inquiry.fatherContactNo,
        studentEducation: "",
        studentEmail: "",
        studentAddress: inquiry.address,
        startDate: "",
        endDate: "",
        feePlan: undefined,
        totalFee: defaultFee,
        batchId: inquiry.batchId || "batch1", // Ensure we always have a batchId
      });
    }
  }, [inquiry, customFee, form]);

  const createEnrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      const response = await apiRequest("POST", "/api/enrollments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Enrollment Complete!",
        description: "Student has been successfully enrolled. Welcome to the course!",
      });
      setTimeout(() => setLocation("/"), 2000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create enrollment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EnrollmentFormData) => {
    // Update totalFee based on selected fee plan and custom fees if available
    let totalFee: string;
    
    if (customFee) {
      // Use custom fees if available
      totalFee = data.feePlan === "full" 
        ? (customFee.customFullFee || inquiry!.course.fullFee)
        : (customFee.customInstallmentFee || inquiry!.course.installmentFee);
    } else {
      // Use default course fees
      totalFee = data.feePlan === "full" ? inquiry!.course.fullFee : inquiry!.course.installmentFee;
    }
    
    const updatedData = {
      ...data,
      totalFee,
      batchId: data.batchId || inquiry!.batchId // Ensure batchId is always present
    };
    
    createEnrollmentMutation.mutate(updatedData);
  };

  const calculateEndDate = (startDate: string) => {
    if (startDate && inquiry?.course.duration) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + inquiry.course.duration);
      form.setValue("endDate", end.toISOString().split('T')[0]);
    }
  };

  if (!inquiry) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <Card className="p-8 text-center">
          <p>Loading inquiry details...</p>
        </Card>
      </div>
    );
  }

  // Calculate fees based on custom fee or course defaults
  const displayFullFee = customFee?.customFullFee 
    ? parseFloat(customFee.customFullFee) 
    : parseFloat(inquiry.course.fullFee);
    
  const displayInstallmentFee = customFee?.customInstallmentFee 
    ? parseFloat(customFee.customInstallmentFee) 
    : parseFloat(inquiry.course.installmentFee);
    
  const displayInstallment1 = customFee?.customInstallment1 
    ? parseFloat(customFee.customInstallment1) 
    : parseFloat(inquiry.course.installment1 || '0');
    
  const displayInstallment2 = customFee?.customInstallment2 
    ? parseFloat(customFee.customInstallment2) 
    : parseFloat(inquiry.course.installment2 || '0');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-[#00ffcc]">
        <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/inquiry/new")}
            className="text-white hover:bg-white/20 mb-6 rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inquiry
          </Button>
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Complete Enrollment</h1>
          </div>
          <p className="text-green-100 text-lg">Complete the enrollment process with additional details and fee plan selection.</p>
        </div>

        {/* Auto-filled Information Section */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-5 h-5 bg-secondary rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">✓</span>
            </span>
            Pre-filled Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral">Student Name:</span>
              <span className="font-medium ml-2">{inquiry.studentName}</span>
            </div>
            <div>
              <span className="text-neutral">Course:</span>
              <span className="font-medium ml-2">{inquiry.course.name}</span>
            </div>
            <div>
              <span className="text-neutral">Student Contact:</span>
              <span className="font-medium ml-2">{inquiry.contactNo}</span>
            </div>
            <div>
              <span className="text-neutral">Father Contact:</span>
              <span className="font-medium ml-2">{inquiry.fatherContactNo}</span>
            </div>
            <div>
              <span className="text-neutral">Selected Batch:</span>
              <span className="font-medium ml-2 text-blue-600">
                {BATCHES.find(b => b.id === inquiry.batchId)?.name} ({BATCHES.find(b => b.id === inquiry.batchId)?.time})
              </span>
            </div>
          </div>
          {customFee && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📌 <strong>Custom Fee Applied:</strong> {customFee.reason}
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father Name */}
              <FormField
                control={form.control}
                name="fatherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter father's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student Education */}
              <FormField
                control={form.control}
                name="studentEducation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Education *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., B.Tech, BCA, 12th Pass" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Student Email */}
              <FormField
                control={form.control}
                name="studentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Email ID *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Duration (Read-only) */}
              <div className="form-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Duration</label>
                <Input 
                  value={`${inquiry.course.duration} months`}
                  readOnly
                  className="bg-gray-50 text-gray-600"
                />
              </div>

              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          calculateEndDate(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date (Auto-calculated) */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        readOnly
                        className="bg-gray-50 text-gray-600"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Student Address */}
            <FormField
              control={form.control}
              name="studentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Address *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter complete address" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fee Plan Selection */}
            <FormField
              control={form.control}
              name="feePlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Plan Selection *</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-4">
                      {/* Full Payment Option */}
                      <div className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="full" id="full" className="mt-1 mr-3" />
                        <div className="flex-1">
                          <label htmlFor="full" className="font-medium text-gray-900 cursor-pointer">
                            Full Payment (Save Money!)
                          </label>
                          <div className="text-sm text-neutral mt-1">Pay the complete fee upfront and save on processing charges</div>
                          <div className="text-lg font-semibold text-green-600 mt-2">₹{displayFullFee.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Installment Plans */}
                      <div className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <RadioGroupItem value="installments" id="installments" className="mt-1 mr-3" />
                        <div className="flex-1">
                          <label htmlFor="installments" className="font-medium text-gray-900 cursor-pointer">
                            Installment Payment Plan
                          </label>
                          <div className="text-sm text-neutral mt-1">
                            Installment 1: ₹{displayInstallment1.toLocaleString()} + 
                            Installment 2: ₹{displayInstallment2.toLocaleString()}
                          </div>
                          <div className="text-lg font-semibold text-primary mt-2">
                            Total: ₹{displayInstallmentFee.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/inquiry/new")}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                disabled={createEnrollmentMutation.isPending}
                className="text-white hover:bg-secondary/90 bg-[#00ff51d4]"
              >
                {createEnrollmentMutation.isPending ? "Processing..." : "Complete Enrollment"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
        </Card>
      </div>
    </div>
  );
}
