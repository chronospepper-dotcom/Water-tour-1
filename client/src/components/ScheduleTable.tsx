import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Schedule {
  zone: string;
  districts: string;
  days: string;
  time: string;
}

interface ScheduleTableProps {
  title: string;
  schedules: Schedule[];
}

export default function ScheduleTable({ title, schedules }: ScheduleTableProps) {
  return (
    <Card data-testid="card-schedule">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl" data-testid="text-schedule-title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead data-testid="header-zone">Zone</TableHead>
                <TableHead data-testid="header-districts">Quartiers/Villes</TableHead>
                <TableHead data-testid="header-days">Jours</TableHead>
                <TableHead data-testid="header-time">Horaires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule, idx) => (
                <TableRow key={idx} data-testid={`row-schedule-${idx}`}>
                  <TableCell className="font-medium text-primary" data-testid={`cell-zone-${idx}`}>
                    {schedule.zone}
                  </TableCell>
                  <TableCell data-testid={`cell-districts-${idx}`}>
                    {schedule.districts}
                  </TableCell>
                  <TableCell data-testid={`cell-days-${idx}`}>
                    {schedule.days}
                  </TableCell>
                  <TableCell data-testid={`cell-time-${idx}`}>
                    {schedule.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
