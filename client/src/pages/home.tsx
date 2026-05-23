import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/Header";
import AlertBanner from "@/components/AlertBanner";
import ImportantNotice from "@/components/ImportantNotice";
import SourcesSection from "@/components/SourcesSection";
import WeeklyScheduleTable from "@/components/WeeklyScheduleTable";
import VillageBreakdown from "@/components/VillageBreakdown";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { type SiteConfig } from "@shared/schema";

export default function Home() {
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { data: config, isLoading } = useQuery<SiteConfig>({
    queryKey: ["/api/config"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  const alert = config?.alert;
  const schedule = config?.schedule;
  const villages = config?.villages;
  const siteInfo = config?.siteInfo;

  return (
    <div className="min-h-screen bg-background">
      <Header siteInfo={siteInfo} />
      
      {alert && (
        <AlertBanner
          isVisible={alert.isActive && !alertDismissed}
          message={alert.message}
          severity={alert.severity}
          onDismiss={() => setAlertDismissed(true)}
        />
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <ImportantNotice siteInfo={siteInfo} />
        
        <SourcesSection siteInfo={siteInfo} />
        
        {schedule && (
          <WeeklyScheduleTable 
            startDate={schedule.startDate}
            endDate={schedule.endDate}
            description={schedule.description}
            entries={schedule.entries}
          />
        )}
        
        {villages && (
          <VillageBreakdown villages={villages.villages} />
        )}
        
        <div className="flex justify-center pt-4">
          <Link href="/admin">
            <Button variant="outline" className="gap-2" data-testid="button-admin">
              <Settings className="w-4 h-4" />
              Administration
            </Button>
          </Link>
        </div>
        
        <footer className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center" data-testid="text-footer">
            {siteInfo?.footerText || ""}
          </p>
        </footer>
      </main>
    </div>
  );
}
