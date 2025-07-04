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
import { CloudUpload, FileText, X, Plus, Camera, Edit } from "lucide-react";

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
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
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
    
    // Split by ### to get sections
    const sections = faqText.split('###').filter(section => section.trim());
    
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      if (lines.length >= 2) {
        const question = lines[0].trim();
        // Join all remaining lines as the answer, filtering out empty lines
        const answer = lines.slice(1).filter(line => line.trim()).join('\n').trim();
        
        if (question && answer) {
          entries.push({
            id: Date.now().toString() + Math.random(),
            question: question,
            answer: answer,
          });
        }
      }
    });
    
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

  const businessResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/business");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      businessForm.reset({
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
      });
      toast({
        title: "Success",
        description: "Business information reset successfully",
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
        description: "Failed to reset business information",
        variant: "destructive",
      });
    },
  });

  const handleBusinessReset = () => {
    businessResetMutation.mutate();
  };

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

  const faqResetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/business", { faqs: "" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      faqForm.reset({
        faqs: "",
      });
      setFaqEntries([]);
      toast({
        title: "Success",
        description: "FAQ information reset successfully",
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
        description: "Failed to reset FAQ information",
        variant: "destructive",
      });
    },
  });

  const handleFaqReset = () => {
    faqResetMutation.mutate();
  };

  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowProductForm(false);
      setEditingProduct(null);
      productForm.reset({
        name: "",
        description: "",
        price: "",
      });
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

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & ProductFormData) => {
      return await apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      setShowProductForm(false);
      productForm.reset({
        name: "",
        description: "",
        price: "",
      });
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
  }

  const startEditingFaq = (faq: FaqEntry) => {
    // Close add form if open
    if (showAddFaqForm) {
      setShowAddFaqForm(false);
    }
    setEditingFaqId(faq.id);
    individualFaqForm.reset({
      question: faq.question,
      answer: faq.answer,
    });
  };

  const cancelEditingFaq = () => {
    setEditingFaqId(null);
    individualFaqForm.reset();
  };

  const updateFaqEntry = (data: IndividualFaqData) => {
    const updatedEntries = faqEntries.map(entry => 
      entry.id === editingFaqId 
        ? { ...entry, question: data.question, answer: data.answer }
        : entry
    );
    setFaqEntries(updatedEntries);
    
    // Automatically save to database with updated combined FAQs
    const currentFaqText = faqForm.getValues().faqs || "";
    const individualFaqsText = updatedEntries.map(entry => 
      `### ${entry.question}\n\n${entry.answer}`
    ).join('\n\n');
    
    const combinedFaqs = currentFaqText ? 
      `${currentFaqText}\n\n${individualFaqsText}` : 
      individualFaqsText;
    
    faqMutation.mutate({ faqs: combinedFaqs });
    
    setEditingFaqId(null);
    individualFaqForm.reset();
    toast({
      title: "Success",
      description: "FAQ entry updated and saved successfully",
    });
  };;

  const onIndividualFaqSubmit = (data: IndividualFaqData) => {
    addFaqEntry(data);
  };

  const handleOpenAddFaqForm = () => {
    // Cancel editing if currently editing an FAQ
    if (editingFaqId) {
      setEditingFaqId(null);
      individualFaqForm.reset();
    }
    setShowAddFaqForm(true);
  };

  const onProductSubmit = (data: ProductFormData) => {
    const productData = {
      ...data,
      imageUrl: productImages[0] || "", // Keep first image for backward compatibility
      imageUrls: productImages, // Save all images
    };

    console.log("Product submission data:", productData);
    console.log("Current productImages:", productImages);
    console.log("Is editing:", !!editingProduct);

    if (editingProduct) {
      // Update existing product
      console.log("Updating product with ID:", editingProduct.id);
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      // Create new product
      console.log("Creating new product");
      productMutation.mutate(productData);
    }
  }

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log("Starting image upload for", files.length, "files");
    setUploadingImage(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload each file separately
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Uploading file ${i + 1}:`, file.name, file.type, file.size, "bytes");
        
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData,
          credentials: 'include', // Include cookies for authentication
        });

        console.log(`Response for ${file.name}:`, response.status, response.statusText);

        if (response.ok) {
          const result = await response.json();
          uploadedUrls.push(result.imageUrl);
          console.log(`Successfully uploaded ${file.name}:`, result);
        } else {
          const errorText = await response.text();
          console.error(`Failed to upload ${file.name}:`, response.status, errorText);
          throw new Error(`Failed to upload ${file.name}: ${response.status} - ${errorText}`);
        }
      }

      // Add all uploaded images to the state
      setProductImages([...productImages, ...uploadedUrls]);
      toast({
        title: "Success",
        description: `${uploadedUrls.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeProductImage = (index: number) => {
    const updatedImages = productImages.filter((_, i) => i !== index);
    setProductImages(updatedImages);
  };

  const startEditingProduct = (product: any) => {
    console.log("Starting to edit product:", product);
    setEditingProduct(product);
    setShowProductForm(true);
    productForm.reset({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
    });
    // Set existing product images (prioritize imageUrls array, fallback to single imageUrl)
    if (product.imageUrls && product.imageUrls.length > 0) {
      setProductImages(product.imageUrls);
    } else if (product.imageUrl) {
      setProductImages([product.imageUrl]);
    } else {
      setProductImages([]);
    }
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
                  onClick={handleBusinessReset}
                  disabled={businessResetMutation.isPending}
                >
                  {businessResetMutation.isPending ? "Resetting..." : "Reset"}
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
            
            {/* Add FAQ Form */}
            {showAddFaqForm && (
              <Card className="p-6 border border-gray-200 mb-6">
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
            
            {/* Display existing FAQ entries */}
            {faqEntries.length > 0 && (
              <div className="space-y-4 mb-6">
                {faqEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    {editingFaqId === entry.id ? (
                      /* Edit mode */
                      <Form {...individualFaqForm}>
                        <form onSubmit={individualFaqForm.handleSubmit(updateFaqEntry)} className="space-y-4">
                          <FormField
                            control={individualFaqForm.control}
                            name="question"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Question</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter your question"
                                    className="bg-white dark:bg-gray-700"
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
                                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Answer</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter the answer"
                                    rows={3}
                                    className="resize-none bg-white dark:bg-gray-700"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={cancelEditingFaq}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              size="sm"
                              className="bg-primary text-white hover:bg-primary-dark"
                            >
                              Save
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      /* View mode */
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">Q: {entry.question}</h4>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingFaq(entry)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFaqEntry(entry.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">A: {entry.answer}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
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
                    onClick={handleFaqReset}
                    disabled={faqResetMutation.isPending}
                  >
                    {faqResetMutation.isPending ? "Resetting..." : "Reset"}
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

      {/* Products & Services Section */}
      {currentSubSection === "products-services" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Products & Services</h2>
            <span className="text-sm text-blue-600 cursor-pointer hover:underline">(watch tutorial video)</span>
          </div>

          <div className="mb-8">
            {/* Display existing products first */}
            {Array.isArray(products) && products.length > 0 && (
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      {/* Show multiple images if available */}
                      {product.imageUrls && product.imageUrls.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {product.imageUrls.map((imageUrl: string, index: number) => (
                              <img 
                                key={index}
                                src={imageUrl} 
                                alt={`${product.name} ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">{product.name}</h5>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingProduct(product)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProductMutation.mutate(product.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            disabled={deleteProductMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{product.description}</p>
                      <p className="text-primary font-semibold">${product.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Product Management</h3>
              <Button 
                onClick={() => {
                  console.log("Add New Product clicked - clearing form");
                  console.log("Current form values before reset:", productForm.getValues());
                  setEditingProduct(null);
                  setProductImages([]);
                  productForm.reset({
                    name: "",
                    description: "",
                    price: "",
                  });
                  console.log("Form values after reset:", productForm.getValues());
                  setShowProductForm(true);
                }}
                className="bg-primary text-white hover:bg-primary-dark"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            </div>

            {/* Add Product Form */}
            {showProductForm && (
              <Card className={`p-6 mb-6 ${editingProduct 
                ? 'border-2 border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                : 'border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowProductForm(false);
                      productForm.reset();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <Form {...productForm}>
                  <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={productForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter product name" 
                                className="bg-white dark:bg-gray-700"
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
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Price</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter price (e.g. 29.99)" 
                                type="number"
                                step="0.01"
                                className="bg-white dark:bg-gray-700"
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
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter product description"
                              rows={3}
                              className="resize-none bg-white dark:bg-gray-700"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />



                    {/* Product Image Upload */}
                    <div>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">Product Image</FormLabel>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">Upload product image</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="cursor-pointer"
                          disabled={uploadingImage}
                          onClick={() => document.getElementById('product-image-upload')?.click()}
                        >
                          {uploadingImage ? "Uploading..." : "Choose Images"}
                        </Button>
                        <input
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleProductImageUpload}
                        />
                        
                        {productImages.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {productImages.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <img 
                                  src={imageUrl} 
                                  alt={`Product ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded border"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
                                  onClick={() => removeProductImage(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowProductForm(false);
                          setEditingProduct(null);
                          setProductImages([]);
                          productForm.reset({
                            name: "",
                            description: "",
                            price: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary text-white hover:bg-primary-dark"
                        disabled={productMutation.isPending || updateProductMutation.isPending}
                      >
                        {editingProduct 
                          ? (updateProductMutation.isPending ? "Saving..." : "Save Changes")
                          : (productMutation.isPending ? "Adding..." : "Add Product")
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </Card>
            )}


          </div>
        </div>
      )}
    </div>
  );
}
