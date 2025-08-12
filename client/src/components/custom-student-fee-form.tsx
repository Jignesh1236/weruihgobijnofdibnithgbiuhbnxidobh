import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { X, Save, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { CustomStudentFeeWithCourse, Course, EnrollmentWithDetails } from "@shared/schema";

const customFeeSchema = z.object({
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  contactNo: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
  courseId: z.string().min(1, "Please select a course"),
  customFullFee: z.string().optional(),
  customInstallmentFee: z.string().optional(),
  customInstallment1: z.string().optional(),
  customInstallment2: z.string().optional(),
  customFeePlans: z.string().optional(),
  reason: z.string().min(1, "Please provide a reason for custom fee"),
  createdBy: z.string().min(1, "Created by is required"),
});

type CustomFeeFormData = z.infer<typeof customFeeSchema>;

interface CustomStudentFeeFormProps {
  customFee?: CustomStudentFeeWithCourse | null;
  onClose: () => void;
}

export default function CustomStudentFeeForm({ customFee, onClose }: CustomStudentFeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrolledStudents } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ["/api/enrollments"],
  });

  const form = useForm<CustomFeeFormData>({
    resolver: zodResolver(customFeeSchema),
    defaultValues: {
      studentName: "",
      contactNo: "",
      courseId: "",
      customFullFee: "",
      customInstallmentFee: "",
      customInstallment1: "",
      customInstallment2: "",
      customFeePlans: "",
      reason: "",
      createdBy: "Admin", // Default value
    },
  });

  // Handle student selection from dropdown
  const handleStudentSelect = (studentId: string) => {
    const selectedStudent = enrolledStudents?.find(s => s.id === studentId);
    if (selectedStudent) {
      setSelectedStudentId(studentId);
      form.setValue("studentName", selectedStudent.studentName);
      form.setValue("contactNo", selectedStudent.contactNo);
      form.setValue("courseId", selectedStudent.courseId);
      setStudentDropdownOpen(false);
    }
  };

  // Pre-populate form when editing
  useEffect(() => {
    if (customFee) {
      form.reset({
        studentName: customFee.studentName,
        contactNo: customFee.contactNo,
        courseId: customFee.courseId,
        customFullFee: customFee.customFullFee?.toString() || "",
        customInstallmentFee: customFee.customInstallmentFee?.toString() || "",
        customInstallment1: customFee.customInstallment1?.toString() || "",
        customInstallment2: customFee.customInstallment2?.toString() || "",
        customFeePlans: customFee.customFeePlans || "",
        reason: customFee.reason || "",
        createdBy: customFee.createdBy,
      });
      setShowAdvanced(true);
    }
  }, [customFee, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CustomFeeFormData) => {
      // Clean up the payload to match the schema
      const payload = {
        studentName: data.studentName,
        contactNo: data.contactNo,
        courseId: data.courseId,
        customFullFee: data.customFullFee ? data.customFullFee : undefined,
        customInstallmentFee: data.customInstallmentFee ? data.customInstallmentFee : undefined,
        customInstallment1: data.customInstallment1 ? data.customInstallment1 : undefined,
        customInstallment2: data.customInstallment2 ? data.customInstallment2 : undefined,
        customFeePlans: data.customFeePlans || undefined,
        reason: data.reason,
        createdBy: data.createdBy,
        isActive: true,
      };

      console.log("Sending payload:", payload);

      const response = await fetch("/api/custom-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Validation errors:", error);
        throw new Error(error.message || "Failed to create custom fee");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all fee-related caches
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Success",
        description: "Custom fee created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomFeeFormData) => {
      // Clean up the payload to match the schema
      const payload = {
        studentName: data.studentName,
        contactNo: data.contactNo,
        courseId: data.courseId,
        customFullFee: data.customFullFee ? data.customFullFee : undefined,
        customInstallmentFee: data.customInstallmentFee ? data.customInstallmentFee : undefined,
        customInstallment1: data.customInstallment1 ? data.customInstallment1 : undefined,
        customInstallment2: data.customInstallment2 ? data.customInstallment2 : undefined,
        customFeePlans: data.customFeePlans || undefined,
        reason: data.reason,
        createdBy: data.createdBy,
      };

      const response = await fetch(`/api/custom-fees/${customFee!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update custom fee");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all fee-related caches
      queryClient.invalidateQueries({ queryKey: ["/api/custom-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inquiries"] });
      toast({
        title: "Success",
        description: "Custom fee updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomFeeFormData) => {
    if (customFee) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedCourse = courses?.find(c => c.id === form.watch("courseId"));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {customFee ? "Edit Custom Fee" : "Add Custom Fee"}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set special fee structure for student (scholarship, discount, etc.)
                </p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Student Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Selection Dropdown with Search */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Enrolled Student
                  </Label>
                  <Popover open={studentDropdownOpen} onOpenChange={setStudentDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={studentDropdownOpen}
                        className="w-full justify-between mt-1 h-10"
                      >
                        {selectedStudentId
                          ? enrolledStudents?.find((student) => student.id === selectedStudentId)?.studentName
                          : "Choose from enrolled students..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search students..." className="h-9" />
                        <CommandEmpty>No student found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {enrolledStudents?.map((student) => (
                            <CommandItem
                              key={student.id}
                              value={`${student.studentName} ${student.contactNo} ${student.course?.name}`}
                              onSelect={() => handleStudentSelect(student.id)}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span className="font-medium">{student.studentName}</span>
                                  <span className="text-sm text-gray-500">
                                    {student.contactNo} • {student.course?.name}
                                  </span>
                                </div>
                                <Check
                                  className={`ml-auto h-4 w-4 ${
                                    selectedStudentId === student.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-gray-500 mt-1">
                    Search and select a student to auto-fill their details, or enter manually below
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter student name" />
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
                      <FormLabel>Contact Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter 10-digit mobile number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses?.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name} ({course.code})
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Custom Fee *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scholarship">Scholarship</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="financial_assistance">Financial Assistance</SelectItem>
                          <SelectItem value="family_discount">Family Discount</SelectItem>
                          <SelectItem value="early_bird_discount">Early Bird Discount</SelectItem>
                          <SelectItem value="bulk_enrollment">Bulk Enrollment</SelectItem>
                          <SelectItem value="special_case">Special Case</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Course Fee Reference */}
              {selectedCourse && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Standard Course Fees for {selectedCourse.name}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Full Fee:</span>
                      <div className="font-medium">₹{parseFloat(selectedCourse.fullFee.toString()).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Installment 1:</span>
                      <div className="font-medium">₹{parseFloat(selectedCourse.installment1?.toString() || '0').toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Installment 2:</span>
                      <div className="font-medium">₹{parseFloat(selectedCourse.installment2?.toString() || '0').toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Duration:</span>
                      <div className="font-medium">{selectedCourse.duration} months</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Fee Structure */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Custom Fee Structure</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Simple View" : "Advanced Options"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customFullFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Full Fee (₹)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Enter custom full fee" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {showAdvanced && (
                    <>
                      <FormField
                        control={form.control}
                        name="customInstallmentFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Installment Fee (₹)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Enter custom installment fee" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customInstallment1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Installment 1 (₹)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Enter first installment amount" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customInstallment2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Installment 2 (₹)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="Enter second installment amount" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customFeePlans"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Custom Fee Plans (JSON)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter custom fee plans in JSON format (optional)"
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="createdBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Created By *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter admin/creator name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="button-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {customFee ? "Update Custom Fee" : "Change to Custom Fee"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
}