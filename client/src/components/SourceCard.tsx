import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface SourceCardProps {
  name: string;
  description: string;
  url: string;
}

export default function SourceCard({ name, description, url }: SourceCardProps) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group"
      data-testid={`link-source-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Card className="transition-colors hover-elevate">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate" data-testid="text-source-name">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2" data-testid="text-source-description">
              {description}
            </p>
          </div>
          <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </CardContent>
      </Card>
    </a>
  );
}
