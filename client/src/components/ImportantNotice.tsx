import { AlertCircle } from "lucide-react";
import type { SiteInfo } from "@shared/schema";

interface ImportantNoticeProps {
  siteInfo?: SiteInfo;
}

export default function ImportantNotice({ siteInfo }: ImportantNoticeProps) {
  const title = siteInfo?.noticeTitle || "Important";
  const text = siteInfo?.noticeText || "";

  if (!title && !text) return null;

  return (
    <div 
      className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-md p-4 md:p-6"
      role="region"
      aria-labelledby="notice-title"
      data-testid="section-important-notice"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          {title && (
            <h2 
              id="notice-title" 
              className="text-base md:text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2"
              data-testid="text-notice-title"
            >
              {title}
            </h2>
          )}
          {text && (
            <p 
              className="text-sm md:text-base text-amber-900 dark:text-amber-100 leading-relaxed"
              data-testid="text-notice-content"
            >
              {text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
