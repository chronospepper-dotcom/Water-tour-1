import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  isVisible: boolean;
  message: string;
  severity?: "warning" | "danger";
  onDismiss?: () => void;
}

export default function AlertBanner({ isVisible, message, severity = "danger", onDismiss }: AlertBannerProps) {
  if (!isVisible || !message) {
    return null;
  }

  const bgColor = severity === "danger" 
    ? "bg-red-600 dark:bg-red-700" 
    : "bg-orange-500 dark:bg-orange-600";

  return (
    <div 
      className={`${bgColor} text-white`}
      role="alert"
      aria-live="assertive"
      data-testid="banner-alert"
    >
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm md:text-base font-medium" data-testid="text-alert-message">
            {message}
          </p>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Fermer l'alerte"
            data-testid="button-dismiss-alert"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
