import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SourceCard from "@/components/SourceCard";

const sources = [
  {
    name: "Préfecture de Mayotte",
    description: "Communiqués officiels et informations sur la gestion de l'eau",
    url: "https://www.mayotte.gouv.fr/"
  },
  {
    name: "Mahoraise des Eaux (SMAE)",
    description: "Service gestionnaire de l'eau potable à Mayotte",
    url: "https://www.smae.yt/"
  },
  {
    name: "Journal de Mayotte",
    description: "Actualités locales sur la distribution d'eau",
    url: "https://lejournaldemayotte.yt/"
  },
  {
    name: "Mayotte Hebdo",
    description: "Hebdomadaire d'information locale",
    url: "https://www.mayottehebdo.com/"
  }
];

export default function Sources() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 md:h-18 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-page-title">
            Sources
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <p className="text-muted-foreground mb-6" data-testid="text-sources-intro">
          Voici les sources utilisées pour vérifier les informations sur la distribution d'eau à Mayotte. 
          Cliquez sur une source pour visiter son site.
        </p>

        <div className="space-y-3" data-testid="list-sources">
          {sources.map((source) => (
            <SourceCard
              key={source.name}
              name={source.name}
              description={source.description}
              url={source.url}
            />
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center" data-testid="text-sources-footer">
            Ces liens pointent vers des sites externes. 
            Nous ne sommes pas responsables de leur contenu.
          </p>
        </div>
      </main>
    </div>
  );
}
