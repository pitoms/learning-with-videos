import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-4 py-2.5 border rounded-lg text-foreground placeholder:text-muted-foreground
            transition-colors duration-150 resize-y min-h-[100px]
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
            ${
              error
                ? "border-destructive focus:ring-destructive focus:border-destructive"
                : "border-input"
            }
            ${className}
          `}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : hint
              ? `${textareaId}-hint`
              : undefined
          }
          {...props}
        />
        {hint && !error && (
          <p
            id={`${textareaId}-hint`}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={`${textareaId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
