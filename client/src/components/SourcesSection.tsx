import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import type { SiteInfo } from "@shared/schema";

interface SourcesSectionProps {
  siteInfo?: SiteInfo;
}

export default function SourcesSection({ siteInfo }: SourcesSectionProps) {
  const title = siteInfo?.sourcesTitle || "Vérification des sources";
  const description = siteInfo?.sourcesDescription || "";

  return (
    <Card data-testid="section-sources">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl" data-testid="text-sources-title">
          {title}
        </CardTitle>
        {description && (
          <CardDescription data-testid="text-sources-description">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Link href="/sources">
          <Button className="w-full sm:w-auto gap-2" data-testid="button-verify-sources">
            <ExternalLink className="w-4 h-4" />
            Vérifier les sources
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
