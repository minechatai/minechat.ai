import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ResizableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

const ResizableTextarea = forwardRef<
  HTMLTextAreaElement,
  ResizableTextareaProps
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-both",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

ResizableTextarea.displayName = "ResizableTextarea";

export { ResizableTextarea };