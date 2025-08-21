import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertInquirySchema, type Course, type InquiryWithCourse } from "@shared/schema";
import { BATCHES } from "@shared/schema";
import { z } from "zod";

const editInquirySchema = insertInquirySchema.extend({
  id: z.string(),
});

type EditInquiryFormData = z.infer<typeof editInquirySchema>;

export default function InquiryEdit() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/inquiry/edit/:id");
  const { toast } = useToast();

  const { data: inquiry, isLoading } = useQuery<InquiryWithCourse>({
    queryKey: ["/api/inquiries", params?.id],
    queryFn: async () => {
      const response = await fetch(`/api/inquiries/${params?.id}`);
      if (!response.ok) throw new Error("Failed to fetch inquiry");
      return response.json();
    },
    enabled: !!params?.id,
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const form = useForm<EditInquiryFormData>({
    resolver: zodResolver(editInquirySchema),
    defaultValues: {
      id: "",
      studentName: "",
      courseId: "",
      contactNo: "",
      address: "",
      fatherContactNo: "",
      batchId: "",
      status: "pending",
    },
  });

  // Load inquiry data into form
  useEffect(() => {
    if (inquiry) {
      form.reset({
        id: inquiry.id,
        studentName: inquiry.studentName,
        courseId: inquiry.courseId,
        contactNo: inquiry.contactNo,
        address: inquiry.address,
        fatherContactNo: inquiry.fatherContactNo,
        batchId: inquiry.batchId || "batch1",
        status: inquiry.status,
      });
    }
  }, [inquiry, form]);

  const updateInquiryMutation = useMutation({
    mutationFn: async (data: EditInquiryFormData) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/inquiries/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries", params?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      toast({
        title: "Inquiry Updated",
        description: "Inquiry details have been updated successfully.",
      });
      setLocation("/inquiries");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditInquiryFormData) => {
    updateInquiryMutation.mutate(data);
  };

  if (!match) {
    return <div>Invalid inquiry ID</div>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">Loading inquiry details...</div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">Inquiry not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/inquiries")}
          className="text-neutral hover:text-primary mb-4 p-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inquiries
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Edit Inquiry</h2>
        <p className="text-neutral">Update student inquiry details and preferences.</p>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Student Information</h3>

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

                <FormField
                  control={form.control}
                  name="contactNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Contact Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fatherContactNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father's Contact Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father's contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              {/* Course and Schedule Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Course & Schedule</h3>

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              <div className="flex flex-col">
                                <span>{course.name}</span>
                                <span className="text-sm text-gray-500">
                                  {course.duration} months • ₹{parseFloat(course.fullFee).toLocaleString()}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Batch *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch timing" />
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="enrolled">Enrolled</SelectItem>
                          <SelectItem value="books_given">Books Given</SelectItem>
                          <SelectItem value="exam_completed">Exam Completed</SelectItem>
                          <SelectItem value="certificate_issued">Certificate Issued</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Display selected course details */}
                {form.watch("courseId") && courses && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Course Details</h4>
                    {(() => {
                      const selectedCourse = courses.find(c => c.id === form.watch("courseId"));
                      return selectedCourse ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>Duration: {selectedCourse.duration} months</div>
                          <div>Full Fee: ₹{parseFloat(selectedCourse.fullFee).toLocaleString()}</div>
                          <div>Installment Fee: ₹{parseFloat(selectedCourse.installmentFee).toLocaleString()}</div>
                          <div>{selectedCourse.description}</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setLocation("/inquiries")}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateInquiryMutation.isPending}
                className="text-white hover:bg-secondary/90 bg-[#27db33c7]"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateInquiryMutation.isPending ? "Updating..." : "Update Inquiry"}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}