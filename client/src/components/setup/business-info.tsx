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
import { countries, detectCountryFromPhone } from "@/data/countries";

const businessSchema = z.object({
  companyName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  companyStory: z.string().optional(),
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

type BusinessFormData = z.infer<typeof businessSchema>;
type ProductFormData = z.infer<typeof productSchema>;

export default function BusinessInfo() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProductImages, setNewProductImages] = useState<string[]>([]);
  const [uploadingNewImage, setUploadingNewImage] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductImages, setEditProductImages] = useState<string[]>([]);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countries.find(c => c.phoneCode === "+1") || countries[0]);
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

  const newProductForm = useForm<ProductFormData>({
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

  const editProductForm = useForm<ProductFormData>({
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

  // Update business form when data is loaded
  useEffect(() => {
    if (business && typeof business === 'object' && 'companyName' in business) {
      const phoneNumber = (business as any).phoneNumber || "";
      
      // Auto-detect country from saved phone number
      if (phoneNumber) {
        const detectedCountry = detectCountryFromPhone(phoneNumber);
        if (detectedCountry) {
          setSelectedCountry(detectedCountry);
        }
      }
      
      businessForm.reset({
        companyName: (business as any).companyName || "",
        phoneNumber: phoneNumber,
        address: (business as any).address || "",
        email: (business as any).email || "",
        companyStory: (business as any).companyStory || "",
      });
    }
  }, [business, businessForm]);

  // Don't auto-load any product into the main form - let it be empty for new products

  useEffect(() => {
    if (documents && Array.isArray(documents)) {
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
      // Always create new product since main form is for adding new products
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
      // Reset form for next product
      productForm.reset();
      setProductImages([]);
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
        description: "Failed to save product information",
        variant: "destructive",
      });
    },
  });

  const createNewProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      console.log("Making API request to create new product:", data);
      return await apiRequest("POST", "/api/products", data);
    },
    onSuccess: (result) => {
      console.log("New product created successfully:", result);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAddProductForm(false);
      newProductForm.reset();
      setNewProductImages([]);
      toast({
        title: "Success",
        description: "New product created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating new product:", error);
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
        description: "Failed to create new product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductFormData }) => {
      return await apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProductId(null);
      editProductForm.reset();
      setEditProductImages([]);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
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

  const handleNewProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingNewImage(true);
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
      setNewProductImages(prev => [...prev, newImageUrl]);
      
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
      setUploadingNewImage(false);
    }
  };

  const onBusinessSubmit = (data: BusinessFormData) => {
    // Phone number should already include country code since user types it directly
    businessMutation.mutate(data);
  };

  const onProductSubmit = (data: ProductFormData) => {
    productMutation.mutate({
      ...data,
      imageUrl: productImages[0] || "",
    });
  };

  const onNewProductSubmit = (data: ProductFormData) => {
    console.log("New product form submission data:", data);
    console.log("New product images:", newProductImages);
    console.log("Form errors:", newProductForm.formState.errors);
    
    const submissionData = {
      ...data,
      imageUrl: newProductImages[0] || "",
    };
    
    console.log("Final submission data:", submissionData);
    createNewProductMutation.mutate(submissionData);
  };

  const startEditingProduct = (product: any) => {
    setEditingProductId(product.id);
    editProductForm.reset({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      faqs: product.faqs || "",
      paymentDetails: product.paymentDetails || "",
      discounts: product.discounts || "",
      policy: product.policy || "",
      additionalNotes: product.additionalNotes || "",
      thankYouMessage: product.thankYouMessage || "",
    });
    setEditProductImages(product.imageUrl ? [product.imageUrl] : []);
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    editProductForm.reset();
    setEditProductImages([]);
  };

  const onEditProductSubmit = (data: ProductFormData) => {
    if (editingProductId) {
      const submissionData = {
        ...data,
        imageUrl: editProductImages[0] || "",
      };
      updateProductMutation.mutate({ id: editingProductId, data: submissionData });
    }
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
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
      {/* Business Information Section */}
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
                        <div className="flex items-center gap-2 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 min-w-[80px]">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
                        </div>
                        <Input 
                          placeholder="Enter phone number with country code (e.g., +63 9171234567)" 
                          className="rounded-l-none border-l-0"
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value);
                            
                            // Auto-detect country when user types
                            if (value.startsWith('+') || value.match(/^\d+/)) {
                              const detectedCountry = detectCountryFromPhone(value);
                              if (detectedCountry && detectedCountry.phoneCode !== selectedCountry.phoneCode) {
                                setSelectedCountry(detectedCountry);
                              }
                            }
                          }}
                        />
                        <div className="ml-2">
                          <Select 
                            value={selectedCountry.phoneCode} 
                            onValueChange={(value) => {
                              const country = countries.find(c => c.phoneCode === value);
                              if (country) {
                                setSelectedCountry(country);
                                // Auto-update input with country code if not already present
                                const currentValue = field.value || '';
                                if (!currentValue.startsWith(country.phoneCode)) {
                                  field.onChange(country.phoneCode + ' ');
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="w-8 h-8 p-1">
                              <SelectValue>
                                <span>⌄</span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.phoneCode}>
                                  <div className="flex items-center gap-3 min-w-[200px]">
                                    <span className="text-lg">{country.flag}</span>
                                    <span className="font-medium">{country.phoneCode}</span>
                                    <span className="text-sm text-gray-600 truncate">{country.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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

            <div className="flex justify-end space-x-3 pt-6">
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
          </form>
        </Form>
      </div>

      {/* Existing Products Section */}
      {Array.isArray(products) && products.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Products</h2>
          <div className="space-y-4 mb-8">
            {products.map((product: any) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                {editingProductId === product.id ? (
                  /* Edit Form */
                  <Form {...editProductForm}>
                    <form onSubmit={editProductForm.handleSubmit(onEditProductSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={editProductForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter Product Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editProductForm.control}
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
                      </div>
                      
                      <FormField
                        control={editProductForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter Description" rows={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4 pt-4">
                        <Button type="submit" disabled={updateProductMutation.isPending}>
                          {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button type="button" variant="outline" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  /* Display Mode */
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {product.name || "Unnamed Product"}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 mb-3">{product.description}</p>
                      )}
                      {product.price && (
                        <p className="text-xl font-bold text-green-600">${product.price}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditingProduct(product)}
                        >
                          Edit Product
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deleteProductMutation.isPending}
                        >
                          {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                    {product.imageUrl && (
                      <div className="ml-6 w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name || "Product"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Product Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Product</h2>
        
        <Form {...productForm}>
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-6">
            <FormField
              control={productForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Name</FormLabel>
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
                  <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Description" 
                      rows={3}
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
                  <FormLabel className="text-sm font-medium text-gray-700">Price</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload Section */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">Upload Images</FormLabel>
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img 
                      src={image} 
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setProductImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {productImages.length < 4 && (
                  <label htmlFor="product-image-upload" className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Camera className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500">Add Image</span>
                    <input
                      id="product-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
              {uploadingImage && (
                <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
              )}
            </div>



            {/* Add Another Product Button */}
            {!showAddProductForm && (
              <div className="flex justify-center pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => {
                    // Clear cache and refresh products
                    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                    setShowAddProductForm(true);
                    newProductForm.reset();
                    setNewProductImages([]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Product
                </Button>
              </div>
            )}

            {/* New Product Form - appears right here */}
            {showAddProductForm && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 mt-4 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setShowAddProductForm(false);
                      newProductForm.reset();
                      setNewProductImages([]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <Form {...newProductForm}>
                  <form onSubmit={newProductForm.handleSubmit(onNewProductSubmit)} className="space-y-6">
                    <FormField
                      control={newProductForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Product Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newProductForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter Product Description" 
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newProductForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Price</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter Price" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Image Upload Section for New Product */}
                    <div>
                      <FormLabel className="text-sm font-medium text-gray-700 mb-3 block">Upload Product Images</FormLabel>
                      <div className="grid grid-cols-4 gap-4">
                        {newProductImages.map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <img 
                              src={image} 
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => setNewProductImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {newProductImages.length < 4 && (
                          <label htmlFor="new-product-image-upload" className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                            <Camera className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add Image</span>
                            <input
                              id="new-product-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleNewProductImageUpload}
                              disabled={uploadingNewImage}
                            />
                          </label>
                        )}
                      </div>
                      {uploadingNewImage && (
                        <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setShowAddProductForm(false);
                          newProductForm.reset();
                          setNewProductImages([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        className="bg-green-600 text-white hover:bg-green-700 px-4 mr-2"
                        onClick={() => {
                          console.log("TEST: Direct API call");
                          const testData = {
                            name: "Test Product",
                            description: "Test Description", 
                            price: "99",
                            imageUrl: newProductImages[0] || "",
                            faqs: "",
                            paymentDetails: "",
                            discounts: "",
                            policy: "",
                            additionalNotes: "",
                            thankYouMessage: ""
                          };
                          console.log("TEST: Calling mutation with:", testData);
                          createNewProductMutation.mutate(testData);
                        }}
                      >
                        TEST
                      </Button>
                      <Button 
                        type="button" 
                        className="bg-primary text-white hover:bg-primary-dark px-6"
                        disabled={createNewProductMutation.isPending}
                        onClick={() => {
                          console.log("Add Product button clicked!");
                          const formValues = newProductForm.getValues();
                          console.log("Form values:", formValues);
                          
                          const submissionData = {
                            ...formValues,
                            imageUrl: newProductImages[0] || "",
                          };
                          
                          console.log("Submitting product:", submissionData);
                          createNewProductMutation.mutate(submissionData);
                        }}
                      >
                        {createNewProductMutation.isPending ? "Creating..." : "Add Product"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            <FormField
              control={productForm.control}
              name="faqs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">FAQs</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter FAQs" 
                      rows={3}
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
                  <FormLabel className="text-sm font-medium text-gray-700">Payment Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Payment Details" 
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={productForm.control}
              name="discounts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Discounts</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Discounts" 
                      rows={3}
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
                  <FormLabel className="text-sm font-medium text-gray-700">Policy</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Policy" 
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={productForm.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Additional Notes" 
                      rows={3}
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
                  <FormLabel className="text-sm font-medium text-gray-700">Thank you message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter Thank you message" 
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => productForm.reset()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary text-white hover:bg-primary-dark px-6"
                disabled={productMutation.isPending}
              >
                {productMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </div>


    </div>
  );
}