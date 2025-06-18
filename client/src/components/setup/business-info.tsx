import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CloudUpload, FileText, X, RotateCcw, Plus, Camera } from "lucide-react";

const businessSchema = z.object({
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  companyStory: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.string().optional(),
  faqs: z.string().optional(),
  paymentDetails: z.string().optional(),
  discounts: z.string().optional(),
  policy: z.string().optional(),
  additionalNotes: z.string().optional(),
  thankYouMessage: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function BusinessInfo() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["/api/business"],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const businessForm = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      companyName: "",
      phoneNumber: "",
      address: "",
      email: "",
      companyStory: "",
    },
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      faqs: "",
      paymentDetails: "",
      discounts: "",
      policy: "",
      additionalNotes: "",
      thankYouMessage: "",
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (business) {
      businessForm.reset({
        companyName: business.companyName || "",
        phoneNumber: business.phoneNumber || "",
        address: business.address || "",
        email: business.email || "",
        companyStory: business.companyStory || "",
      });
    }
  }, [business, businessForm]);

  useEffect(() => {
    if (documents) {
      setUploadedFiles(documents);
    }
  }, [documents]);

  const businessMutation = useMutation({
    mutationFn: async (data: BusinessFormData) => {
      await apiRequest("POST", "/api/business", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({
        title: "Success",
        description: "Business information saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save business information",
        variant: "destructive",
      });
    },
  });

  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      productForm.reset();
      toast({
        title: "Success",
        description: "Product saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        await apiRequest("POST", "/api/documents/upload", formData);
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  const onBusinessSubmit = (data: BusinessFormData) => {
    businessMutation.mutate(data);
  };

  const onProductSubmit = (data: ProductFormData) => {
    productMutation.mutate(data);
  };

  if (businessLoading || documentsLoading || productsLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Information Section */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
            <span className="text-sm text-red-600">(upload business docs)</span>
          </div>
          
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">Upload files you want to import new business document</p>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag & Drop files here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label htmlFor="file-upload">
                <Button className="bg-primary text-white hover:bg-primary-dark cursor-pointer">
                  Browse Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{file.originalName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.uploadStatus === 'failed' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // TODO: Implement retry logic
                            toast({
                              title: "Info",
                              description: "Retry functionality not implemented yet",
                            });
                          }}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {file.uploadStatus === 'completed' ? 'Complete' : '85%'}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocumentMutation.mutate(file.id)}
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Business Details Form */}
          <Form {...businessForm}>
            <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={businessForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Select defaultValue="+44">
                            <SelectTrigger className="w-20 rounded-r-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="+44">🇬🇧 +44</SelectItem>
                              <SelectItem value="+1">🇺🇸 +1</SelectItem>
                              <SelectItem value="+880">🇧🇩 +880</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="XXXX XXX XXXX" 
                            className="rounded-l-none"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={businessForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={businessForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={businessForm.control}
                name="companyStory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Story or Other Information</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter company story or other information" 
                        rows={4}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-primary text-white hover:bg-primary-dark"
                  disabled={businessMutation.isPending}
                >
                  {businessMutation.isPending ? "Saving..." : "Save Business Info"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Products and Services Section */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Products and Services</h2>
          
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
              <FormField
                control={productForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter Description" 
                        rows={3}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Price" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel className="mb-2 block">Upload Image</FormLabel>
                <div className="border-2 border-dashed border-primary border-opacity-30 rounded-lg p-8 text-center bg-red-50">
                  <div className="w-12 h-12 mx-auto mb-4 bg-primary rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your image here</p>
                  <Button className="bg-primary text-white hover:bg-primary-dark">
                    Upload Image
                  </Button>
                </div>
                <div className="mt-4">
                  <Button type="button" variant="ghost" className="text-primary hover:text-primary-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Add more
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={productForm.control}
                  name="faqs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FAQs</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter FAQs" 
                          rows={3}
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="paymentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter Payment Details" 
                          rows={3}
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={productForm.control}
                  name="discounts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discounts</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter Discounts" 
                          rows={3}
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="policy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Policy</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter Policy" 
                          rows={3}
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={productForm.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter Additional Notes" 
                        rows={3}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="thankYouMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thank you message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter Thank you message" 
                        rows={3}
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  className="bg-primary text-white hover:bg-primary-dark"
                  disabled={productMutation.isPending}
                >
                  {productMutation.isPending ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
