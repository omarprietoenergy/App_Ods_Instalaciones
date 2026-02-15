import DashboardLayout from "@/components/DashboardLayout";
import { DailyPlan } from "@/components/technician/DailyPlan";
import { ShiftControl } from "@/components/technician/ShiftControl";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function TechnicianHome() {
    const { user } = useAuth();
    const [viewDate, setViewDate] = useState<Date>(new Date());

    const today = new Date();
    const tomorrow = addDays(today, 1);
    const isToday = isSameDay(viewDate, today);

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-4 pb-20 px-1 sm:px-0">
                <header className="mb-4">
                    <h1 className="text-2xl font-bold tracking-tight">Hola, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-muted-foreground text-sm">
                        {format(today, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                </header>

                {/* 1. Shift Control (Sticky or Top) */}
                <ShiftControl />

                {/* 2. Date Toggle */}
                <div className="flex items-center justify-between bg-muted/30 p-1 rounded-lg border">
                    <Button
                        variant={isToday ? "secondary" : "ghost"}
                        className={`flex-1 text-sm ${isToday ? 'bg-white shadow-sm font-semibold' : 'text-muted-foreground'}`}
                        onClick={() => setViewDate(today)}
                    >
                        HOY
                    </Button>
                    <Button
                        variant={!isToday ? "secondary" : "ghost"}
                        className={`flex-1 text-sm ${!isToday ? 'bg-white shadow-sm font-semibold' : 'text-muted-foreground'}`}
                        onClick={() => setViewDate(tomorrow)}
                    >
                        MAÑANA
                    </Button>
                </div>

                {/* 3. Daily Plan List */}
                <div className="min-h-[400px]">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-lg">
                            {isToday ? "Tu plan de hoy" : "Plan para mañana"}
                        </h2>
                    </div>

                    <DailyPlan date={viewDate} isToday={isToday} />
                </div>
            </div>
        </DashboardLayout>
    );
}
