import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message,
  title = "Something went wrong",
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
