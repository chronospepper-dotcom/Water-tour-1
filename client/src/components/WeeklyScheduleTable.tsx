import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type ScheduleState, type ScheduleEntry, DAYS, SECTORS, type Day, type Sector } from "@shared/schema";

interface WeeklyScheduleTableProps {
  startDate: string;
  endDate: string;
  description: string;
  entries: ScheduleEntry[];
}

const stateConfig: Record<ScheduleState, { label: string; bgClass: string; textClass: string }> = {
  "OUVERT": { 
    label: "OUVERT", 
    bgClass: "bg-green-500 dark:bg-green-600", 
    textClass: "text-white" 
  },
  "FERME": { 
    label: "FERMÉ", 
    bgClass: "bg-red-500 dark:bg-red-600", 
    textClass: "text-white" 
  },
  "FERMETURE_6H": { 
    label: "FERMETURE 6h", 
    bgClass: "bg-orange-400 dark:bg-orange-500", 
    textClass: "text-white" 
  },
  "OUVERTURE_17H": { 
    label: "OUVERTURE 17h", 
    bgClass: "bg-amber-400 dark:bg-amber-500", 
    textClass: "text-black dark:text-white" 
  },
  "OUVERTURE_7H_FERMETURE_17H": { 
    label: "7h - 17h", 
    bgClass: "bg-blue-400 dark:bg-blue-500", 
    textClass: "text-white" 
  },
  "OUVERTURE_6H": { 
    label: "OUVERTURE 6h", 
    bgClass: "bg-amber-400 dark:bg-amber-500", 
    textClass: "text-black dark:text-white" 
  },
  "FERMETURE_17H": { 
    label: "FERMETURE 17h", 
    bgClass: "bg-orange-400 dark:bg-orange-500", 
    textClass: "text-white" 
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getEntryState(entries: ScheduleEntry[], dateStr: string, sector: Sector): ScheduleState {
  const entry = entries.find(e => e.date === dateStr && e.sector === sector);
  return entry?.state || "FERME";
}

export default function WeeklyScheduleTable({ startDate, endDate, description, entries }: WeeklyScheduleTableProps) {
  const sortedDates = Array.from(new Set(entries.map(e => e.date))).sort();
  const now = new Date();
  now.setHours(0,0,0,0);
  const futureDates = sortedDates.filter(d => new Date(d) >= now);

  if (futureDates.length === 0) {
    return (
      <Card data-testid="card-weekly-schedule">
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucun planning mis à jour disponible pour le moment.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-weekly-schedule">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-center" data-testid="text-schedule-title">
          PLANNING DES TOURS D'EAU
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center mt-2" data-testid="text-schedule-description">
          {description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" data-testid="table-schedule">
            <thead>
              <tr>
                <th className="border border-border bg-muted p-2 md:p-3 text-left font-semibold text-sm md:text-base" data-testid="header-day">
                  Date
                </th>
                {SECTORS.map(sector => (
                  <th 
                    key={sector} 
                    className="border border-border bg-muted p-2 md:p-3 text-center font-semibold text-sm md:text-base"
                    data-testid={`header-sector-${sector}`}
                  >
                    Secteur {sector}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {futureDates.map(dateStr => {
                const dateObj = new Date(dateStr);
                const displayDate = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
                return (
                  <tr key={dateStr} data-testid={`row-${dateStr}`}>
                    <td className="border border-border p-2 md:p-3 font-medium text-sm md:text-base bg-background capitalize">
                      {displayDate}
                    </td>
                    {SECTORS.map(sector => {
                      const state = getEntryState(entries, dateStr, sector);
                      const config = stateConfig[state];
                      return (
                        <td 
                          key={`${dateStr}-${sector}`}
                          className={`border border-border p-2 md:p-3 text-center text-xs md:text-sm font-medium ${config.bgClass} ${config.textClass}`}
                        >
                          {config.label}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2 justify-center" data-testid="legend">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Ouvert</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span>Fermé</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-4 h-4 rounded bg-orange-400"></div>
            <span>Fermeture programmée</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-4 h-4 rounded bg-amber-400"></div>
            <span>Ouverture programmée</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-4 h-4 rounded bg-blue-400"></div>
            <span>Plage horaire</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
