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
import { CloudUpload, FileText, X, Plus, Camera } from "lucide-react";

const businessSchema = z.object({
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  companyStory: z.string().optional(),
  paymentDetails: z.string().optional(),
  discounts: z.string().optional(),
  policy: z.string().optional(),
  additionalNotes: z.string().optional(),
  thankYouMessage: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  faqs: z.string().optional(),
  paymentDetails: z.string().optional(),
  discounts: z.string().optional(),
  policy: z.string().optional(),
  additionalNotes: z.string().optional(),
  thankYouMessage: z.string().optional(),
  imageUrl: z.string().optional(),
});

const faqSchema = z.object({
  faqs: z.string().optional(),
});

const individualFaqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

type BusinessFormData = z.infer<typeof businessSchema>;
type ProductFormData = z.infer<typeof productSchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type IndividualFaqData = z.infer<typeof individualFaqSchema>;

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export default function BusinessInfo() {
  const [currentSubSection, setCurrentSubSection] = useState("business-information");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [faqEntries, setFaqEntries] = useState<FaqEntry[]>([]);
  const [showAddFaqForm, setShowAddFaqForm] = useState(false);
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
      paymentDetails: "",
      discounts: "",
      policy: "",
      additionalNotes: "",
      thankYouMessage: "",
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

  const faqForm = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      faqs: "",
    },
  });

  const individualFaqForm = useForm<IndividualFaqData>({
    resolver: zodResolver(individualFaqSchema),
    defaultValues: {
      question: "",
      answer: "",
    },
  });

  // Function to parse FAQ entries from saved text
  const parseFaqEntries = (faqText: string): FaqEntry[] => {
    const entries: FaqEntry[] = [];
    const lines = faqText.split('\n');
    let currentQuestion = '';
    let currentAnswer = '';
    let isQuestion = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if line starts with ### (our FAQ format)
      if (line.startsWith('###')) {
        // Save previous entry if exists
        if (currentQuestion && currentAnswer) {
          entries.push({
            id: Date.now().toString() + Math.random(),
            question: currentQuestion,
            answer: currentAnswer.trim(),
          });
        }
        
        // Start new entry
        currentQuestion = line.replace('###', '').trim();
        currentAnswer = '';
        isQuestion = true;
      } else if (isQuestion && line) {
        // This is the answer part
        currentAnswer += (currentAnswer ? '\n' : '') + line;
      }
    }
    
    // Add last entry
    if (currentQuestion && currentAnswer) {
      entries.push({
        id: Date.now().toString() + Math.random(),
        question: currentQuestion,
        answer: currentAnswer.trim(),
      });
    }
    
    return entries;
  };

  // Update form when data is loaded
  useEffect(() => {
    console.log("Business data from API:", business);
    console.log("Business loading:", businessLoading);
    
    if (business && typeof business === 'object') {
      console.log("All business fields:", Object.keys(business));
      console.log("Company name specifically:", (business as any).companyName);
      
      // Update business form
      const formData = {
        companyName: (business as any).companyName || "",
        phoneNumber: (business as any).phoneNumber || "",
        address: (business as any).address || "",
        email: (business as any).email || "",
        companyStory: (business as any).companyStory || "",
        paymentDetails: (business as any).paymentDetails || "",
        discounts: (business as any).discounts || "",
        policy: (business as any).policy || "",
        additionalNotes: (business as any).additionalNotes || "",
        thankYouMessage: (business as any).thankYouMessage || "",
      };
      
      console.log("Form data to populate:", formData);
      businessForm.reset(formData);
      
      // Update FAQ form
      const faqData = {
        faqs: (business as any).faqs || "",
      };
      
      console.log("FAQ data to populate:", faqData);
      faqForm.reset(faqData);
      
      // Parse individual FAQ entries from saved text
      if (faqData.faqs) {
        const parsedEntries = parseFaqEntries(faqData.faqs);
        setFaqEntries(parsedEntries);
      }
      
      console.log("Forms updated successfully!");
    }
  }, [business, businessForm, faqForm, businessLoading]);

  useEffect(() => {
    if (documents && Array.isArray(documents)) {
      setUploadedFiles(documents);
    }
  }, [documents]);

  // Don't auto-load products into form - let user explicitly choose to add/edit

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

  const faqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      await apiRequest("POST", "/api/business", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({
        title: "Success",
        description: "FAQ information saved successfully",
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
        description: "Failed to save FAQ information",
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
      setProductImages([]);
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

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select a valid image file",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
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
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const newImageUrl = data.imageUrl;
      setProductImages(prev => [...prev, newImageUrl]);
      
      toast({
        title: "Success",
        description: "Product image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const onBusinessSubmit = (data: BusinessFormData) => {
    businessMutation.mutate(data);
  };

  const onFaqSubmit = (data: FaqFormData) => {
    // Combine individual FAQ entries with the main FAQ text
    let combinedFaqs = data.faqs || "";
    
    if (faqEntries.length > 0) {
      const individualFaqsText = faqEntries.map(entry => 
        `### ${entry.question}\n\n${entry.answer}`
      ).join('\n\n');
      
      if (combinedFaqs) {
        combinedFaqs = `${combinedFaqs}\n\n${individualFaqsText}`;
      } else {
        combinedFaqs = individualFaqsText;
      }
    }
    
    faqMutation.mutate({ faqs: combinedFaqs });
  };

  // Individual FAQ functions
  const addFaqEntry = (data: IndividualFaqData) => {
    const newEntry: FaqEntry = {
      id: Date.now().toString(),
      question: data.question,
      answer: data.answer,
    };
    
    const updatedEntries = [newEntry, ...faqEntries];
    setFaqEntries(updatedEntries);
    
    // Automatically save to database with combined FAQs
    const currentFaqText = faqForm.getValues().faqs || "";
    const individualFaqsText = updatedEntries.map(entry => 
      `### ${entry.question}\n\n${entry.answer}`
    ).join('\n\n');
    
    const combinedFaqs = currentFaqText ? 
      `${currentFaqText}\n\n${individualFaqsText}` : 
      individualFaqsText;
    
    faqMutation.mutate({ faqs: combinedFaqs });
    
    individualFaqForm.reset();
    setShowAddFaqForm(false);
    toast({
      title: "Success",
      description: "FAQ entry added and saved successfully",
    });
  };

  const removeFaqEntry = (id: string) => {
    const updatedEntries = faqEntries.filter(entry => entry.id !== id);
    setFaqEntries(updatedEntries);
    
    // Automatically save to database with updated combined FAQs
    const currentFaqText = faqForm.getValues().faqs || "";
    const individualFaqsText = updatedEntries.map(entry => 
      `### ${entry.question}\n\n${entry.answer}`
    ).join('\n\n');
    
    const combinedFaqs = currentFaqText && updatedEntries.length > 0 ? 
      `${currentFaqText}\n\n${individualFaqsText}` : 
      (updatedEntries.length > 0 ? individualFaqsText : currentFaqText);
    
    faqMutation.mutate({ faqs: combinedFaqs });
    
    toast({
      title: "Success", 
      description: "FAQ entry removed and saved successfully",
    });
  };

  const onIndividualFaqSubmit = (data: IndividualFaqData) => {
    addFaqEntry(data);
  };

  const handleOpenAddFaqForm = () => {
    setShowAddFaqForm(true);
  };

  const onProductSubmit = (data: ProductFormData) => {
    const productData = {
      ...data,
      imageUrl: productImages[0] || "",
    };

    if (editingProduct) {
      // Update existing product
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      // Create new product
      productMutation.mutate(productData);
    }
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return await apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowProductForm(false);
      setEditingProduct(null);
      productForm.reset();
      setProductImages([]);
      toast({
        title: "Success",
        description: "Product updated successfully",
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
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

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
    <div className="space-y-8">
      {/* Sub-section Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setCurrentSubSection("business-information")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentSubSection === "business-information"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Business Information
          </button>
          <button
            onClick={() => setCurrentSubSection("products-services")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentSubSection === "products-services"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Products & Services
          </button>
          <button
            onClick={() => setCurrentSubSection("faqs")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentSubSection === "faqs"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            FAQs
          </button>
        </nav>
      </div>

      {/* Business Information Section */}
      {currentSubSection === "business-information" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
            <span className="text-sm text-blue-600 cursor-pointer hover:underline">(watch tutorial video)</span>
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
                CHOOSE FILE
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
            <div className="space-y-3 mb-8">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">{file.originalName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {file.uploadStatus === 'completed' ? 'Complete' : 'Processing...'}
                    </span>
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
                    <FormLabel className="text-sm font-medium text-gray-700">Company Name</FormLabel>
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
                    <FormLabel className="text-sm font-medium text-gray-700">Phone Number</FormLabel>
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

            <FormField
              control={businessForm.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Address</FormLabel>
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
                  <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter Email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={businessForm.control}
              name="companyStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Company Story or Other Information</FormLabel>
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



            <FormField
              control={businessForm.control}
              name="paymentDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Payment Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter payment information and methods" 
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
              control={businessForm.control}
              name="discounts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Discounts</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter discount information and promotions" 
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
              control={businessForm.control}
              name="policy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Policy</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter business policies and terms" 
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
              control={businessForm.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional information" 
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
              control={businessForm.control}
              name="thankYouMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Thank You Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter thank you message for customers" 
                      rows={3}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Information Form Buttons */}
            <div className="border-t pt-6 mt-6">
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => businessForm.reset()}
                >
                  Reset
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white hover:bg-primary-dark px-6"
                  disabled={businessMutation.isPending}
                >
                  {businessMutation.isPending ? "Saving..." : "Save Business Information"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
        </div>
      )}

      {/* Products and Services Section - Coming Soon */}
      {currentSubSection === "products-services" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Products & Services</h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      )}

      {/* FAQs Section */}
      {currentSubSection === "faqs" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">FAQs</h2>
            <span className="text-sm text-blue-600 cursor-pointer hover:underline">(watch tutorial video)</span>
          </div>
          
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-4">Upload files you want to import FAQ documents</p>
            
            {/* File Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag & Drop files here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label htmlFor="faq-file-upload">
                <Button className="bg-primary text-white hover:bg-primary-dark cursor-pointer">
                  CHOOSE FILE
                </Button>
                <input
                  id="faq-file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            
            {/* Display uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3 mb-8">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">{file.originalName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {file.uploadStatus === 'completed' ? 'Complete' : 'Processing...'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDocumentMutation.mutate(file.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Individual FAQ Management */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Individual FAQ Entries</h3>
              <Button 
                onClick={handleOpenAddFaqForm}
                className="bg-primary text-white hover:bg-primary-dark"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New FAQ
              </Button>
            </div>
            
            {/* Display existing FAQ entries */}
            {faqEntries.length > 0 && (
              <div className="space-y-4 mb-6">
                {faqEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">Q: {entry.question}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFaqEntry(entry.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-gray-700">A: {entry.answer}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add FAQ Form */}
            {showAddFaqForm && (
              <Card className="p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Add New FAQ</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddFaqForm(false);
                      individualFaqForm.reset();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <Form {...individualFaqForm}>
                  <form onSubmit={individualFaqForm.handleSubmit(onIndividualFaqSubmit)} className="space-y-4">
                    <FormField
                      control={individualFaqForm.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Question</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your question" 
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={individualFaqForm.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Answer</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your answer" 
                              rows={3}
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowAddFaqForm(false);
                          individualFaqForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-primary text-white hover:bg-primary-dark"
                      >
                        Add FAQ
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            )}
          </div>
          
          <Form {...faqForm}>
            <form onSubmit={faqForm.handleSubmit(onFaqSubmit)} className="space-y-6">
              <FormField
                control={faqForm.control}
                name="faqs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Frequently Asked Questions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter frequently asked questions and their answers" 
                        rows={6}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* FAQ Form Buttons */}
              <div className="border-t pt-6 mt-6">
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => faqForm.reset()}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-white hover:bg-primary-dark px-6"
                    disabled={faqMutation.isPending}
                  >
                    {faqMutation.isPending ? "Saving..." : "Save FAQ"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
