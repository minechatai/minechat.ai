import React, { useRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

export interface RichTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
}

const RichTextarea = React.forwardRef<HTMLTextAreaElement, RichTextareaProps>(
  ({ className, value, onChange, onPaste, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => textareaRef.current!);

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      // Call original onPaste handler if provided
      if (onPaste) {
        onPaste(e);
      }

      // Get clipboard data
      const clipboardData = e.clipboardData;
      const plainText = clipboardData.getData('text/plain');
      
      // Don't prevent default - let the browser handle pasting
      // The formatting will be preserved in the textarea value
      
      // Update the onChange handler with the new value after paste
      setTimeout(() => {
        if (textareaRef.current && onChange) {
          onChange(textareaRef.current.value);
        }
      }, 0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        style={{
          whiteSpace: 'pre-wrap', // Preserve whitespace and line breaks
          lineHeight: '1.5',
        }}
        {...props}
      />
    );
  }
);

RichTextarea.displayName = "RichTextarea";

export { RichTextarea };