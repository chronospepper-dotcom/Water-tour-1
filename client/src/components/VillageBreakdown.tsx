import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Village, SECTORS, type Sector } from "@shared/schema";

interface VillageBreakdownProps {
  villages: Village[];
}

function getVillagesBySector(villages: Village[], sector: Sector): Village[] {
  return villages.filter(v => v.sector === sector);
}

const sectorColors: Record<Sector, string> = {
  "01": "border-t-green-500",
  "02": "border-t-blue-500",
  "03": "border-t-purple-500",
  "04": "border-t-orange-500",
};

export default function VillageBreakdown({ villages }: VillageBreakdownProps) {
  return (
    <Card data-testid="card-village-breakdown">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl text-center" data-testid="text-villages-title">
          Découpage des villages par secteur
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-villages">
          {SECTORS.map(sector => {
            const sectorVillages = getVillagesBySector(villages, sector);
            return (
              <div 
                key={sector} 
                className={`bg-card border border-border rounded-md overflow-hidden border-t-4 ${sectorColors[sector]}`}
                data-testid={`sector-${sector}-container`}
              >
                <div className="bg-muted p-3 border-b border-border">
                  <h3 className="font-semibold text-center" data-testid={`sector-${sector}-title`}>
                    Secteur {sector}
                  </h3>
                </div>
                <ul className="p-3 space-y-1" data-testid={`sector-${sector}-list`}>
                  {sectorVillages.map((village, idx) => (
                    <li 
                      key={idx} 
                      className="text-sm py-1 border-b border-border last:border-b-0"
                      data-testid={`village-${sector}-${idx}`}
                    >
                      {village.name}
                    </li>
                  ))}
                  {sectorVillages.length === 0 && (
                    <li className="text-sm text-muted-foreground italic">
                      Aucun village
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
