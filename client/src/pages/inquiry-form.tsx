import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { BATCHES } from "@shared/schema";

const inquirySchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  courseId: z.string().min(1, "Please select a course"),
  contactNo: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  fatherContactNo: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
  batchId: z.string().min(1, "Please select a batch"),
  status: z.enum(["pending", "confirm"], { required_error: "Please select an action status" }),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

export default function InquiryForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      studentName: "",
      courseId: "",
      contactNo: "",
      address: "",
      fatherContactNo: "",
      batchId: "",
      status: undefined,
    },
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const response = await apiRequest("POST", "/api/inquiries", data);
      return response.json();
    },
    onSuccess: (inquiry) => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      const status = form.getValues("status");
      if (status === "pending") {
        toast({
          title: "Inquiry Saved!",
          description: "Student inquiry has been saved successfully. You can review it later from the inquiries list.",
        });
        setTimeout(() => setLocation("/"), 2000);
      } else if (status === "confirm") {
        toast({
          title: "Inquiry Confirmed!",
          description: "Proceeding to enrollment form...",
        });
        setTimeout(() => setLocation(`/inquiry/enroll/${inquiry.id}`), 1500);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    createInquiryMutation.mutate(data);
  };

  const handleCourseChange = (courseId: string) => {
    const course = courses?.find(c => c.id === courseId);
    setSelectedCourse(course || null);
    form.setValue("courseId", courseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/10">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
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
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">New Student Inquiry</h1>
            </div>
            <p className="text-blue-100 text-lg">Fill in the student details to create a new inquiry record with course preferences and batch selection.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-8 bg-white dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Name */}
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter student's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Selection */}
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course *</FormLabel>
                    <Select onValueChange={handleCourseChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.duration} months)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Number */}
              <FormField
                control={form.control}
                name="contactNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Contact No *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Father Contact Number */}
              <FormField
                control={form.control}
                name="fatherContactNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Contact No *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter 10-digit mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Batch Selection */}
            <FormField
              control={form.control}
              name="batchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Batch *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time batch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BATCHES.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name} ({batch.time})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
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

            {/* Action Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending - Save for later review</SelectItem>
                      <SelectItem value="confirm">Confirm - Proceed to enrollment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Course Details Preview */}
            {selectedCourse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Course Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-neutral">Duration:</span>
                    <span className="font-medium ml-2">{selectedCourse.duration} months</span>
                  </div>
                  <div>
                    <span className="text-neutral">Full Fee:</span>
                    <span className="font-medium ml-2 text-green-600">₹{parseFloat(selectedCourse.fullFee).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-neutral">Installment Fee:</span>
                    <span className="font-medium ml-2 text-blue-600">₹{parseFloat(selectedCourse.installmentFee).toLocaleString()}</span>
                  </div>
                </div>
                {selectedCourse.description && (
                  <div className="mt-3">
                    <span className="text-neutral">Description:</span>
                    <span className="ml-2 text-gray-700">{selectedCourse.description}</span>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1 sm:flex-none px-8 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInquiryMutation.isPending}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg h-10 px-6 py-2 flex-1 sm:flex-none button-primary bg-[#52ff7d]"
              >
                {createInquiryMutation.isPending ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
