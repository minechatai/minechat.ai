import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const emailLoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email format is invalid"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type EmailLoginForm = z.infer<typeof emailLoginSchema>;

interface EmailLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailLoginModal({ isOpen, onClose }: EmailLoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
  });

  const onSubmit = async (data: EmailLoginForm) => {
    setIsLoading(true);
    try {
      // Log the form data for debugging
      console.log("Email login form submitted with valid data:", {
        email: data.email,
        password: "***" + data.password.slice(-3), // Partially masked for security
        timestamp: new Date().toISOString()
      });
      
      // Simulate a brief loading state for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal and redirect to dashboard
      handleClose();
      window.location.href = '/';
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white p-8 rounded-2xl border-0 shadow-xl">
        <DialogHeader className="space-y-4">
          {/* Back button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Title and subtitle */}
          <div className="text-left">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Login Minechat.ai
            </h2>
            <p className="text-sm text-gray-500">
              Minechat.ai Connections start here
            </p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder="maxwell43@gmail.com"
                className="pl-10 h-12 border-gray-300 focus:border-minechat-red focus:ring-minechat-red"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="4351fasforysaω@2η"
                className="pl-10 pr-10 h-12 border-gray-300 focus:border-minechat-red focus:ring-minechat-red"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <a href="#" className="text-sm text-minechat-red hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-minechat-red hover:bg-minechat-red/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 h-12 rounded-lg"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>

          {/* Terms and Privacy */}
          <div className="text-center text-sm text-gray-500">
            <p>By signing up, you agree to minechat.ai</p>
            <p>
              <a href="#" className="text-minechat-red hover:underline">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#" className="text-minechat-red hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}