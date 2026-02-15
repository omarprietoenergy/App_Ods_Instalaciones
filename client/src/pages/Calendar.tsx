import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addMonths, subMonths, setMonth, setYear, isSameMonth, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "./calendar.css";

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay eventos en este rango',
};

// Year View Component
const YearView = ({
    date,
    events,
    onNavigate,
    onView
}: {
    date: Date;
    events: any[];
    onNavigate: (date: Date) => void;
    onView: (view: View) => void;
}) => {
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
        <div className="year-view-grid">
            {months.map((month, index) => {
                const monthDate = setMonth(date, index);
                const monthEvents = events.filter(e => isSameMonth(e.start, monthDate) && e.start.getFullYear() === date.getFullYear());

                return (
                    <div
                        key={month}
                        className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors bg-white shadow-sm"
                        onClick={() => {
                            onNavigate(monthDate);
                            onView(Views.MONTH);
                        }}
                    >
                        <div className="font-semibold text-lg mb-2 text-gray-700">{month}</div>
                        <div className="text-sm text-gray-500 mb-2">{monthEvents.length} instalaciones</div>
                        <div className="space-y-1">
                            {monthEvents.slice(0, 3).map(e => (
                                <div key={e.id} className="text-xs truncate px-2 py-1 rounded text-white" style={e.resource.style}>
                                    {e.title}
                                </div>
                            ))}
                            {monthEvents.length > 3 && (
                                <div className="text-xs text-gray-400 pl-1">
                                    +{monthEvents.length - 3} más...
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default function CalendarPage() {
    const { user } = useAuth();
    const [, setLocation] = useLocation();
    const [selectedTechnician, setSelectedTechnician] = useState<string>("all");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<View>(Views.MONTH);
    const [showYearView, setShowYearView] = useState(false);

    // Queries
    const installationsQuery = trpc.installations.list.useQuery();
    const techniciansQuery = trpc.users.listTechnicians.useQuery(undefined, {
        enabled: ['admin', 'project_manager'].includes(user?.role || ''),
    });

    // Filter Logic
    const filteredInstallations = useMemo(() => {
        if (!installationsQuery.data) return [];
        if (selectedTechnician === "all") return installationsQuery.data;

        return installationsQuery.data.filter(inst => {
            const assignedIds = inst.assignedTechnicianIds as number[] | null;
            return Array.isArray(assignedIds) && assignedIds.includes(parseInt(selectedTechnician));
        });
    }, [installationsQuery.data, selectedTechnician]);

    // Event Mapping
    const events = useMemo(() => {
        return filteredInstallations.map(inst => {
            const startDate = new Date(inst.startDate);
            // Default to 2 hours duration if logic requires end date, or use same day
            // Most calendar libs prefer valid end date > start date.
            let endDate = inst.endDate ? new Date(inst.endDate) : new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
            if (endDate <= startDate) {
                endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000));
            }

            let backgroundColor = '#374151'; // Gray default
            switch (inst.status) {
                case 'pending': backgroundColor = '#f59e0b'; break; // Orange
                case 'in_progress': backgroundColor = '#3b82f6'; break; // Blue
                case 'completed': backgroundColor = '#10b981'; break; // Green
                case 'cancelled': backgroundColor = '#ef4444'; break; // Red
            }

            return {
                id: inst.id,
                title: inst.clientName,
                start: startDate,
                end: endDate,
                resource: {
                    status: inst.status,
                    workOrderType: inst.workOrderType,
                    style: { backgroundColor }
                }
            };
        });
    }, [filteredInstallations]);

    const eventStyleGetter = (event: any) => {
        return {
            style: {
                backgroundColor: event.resource.style.backgroundColor,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    const handleNavigate = (newDate: Date) => setCurrentDate(newDate);

    const handleYearSelect = (year: number) => {
        const newDate = setYear(currentDate, year);
        setCurrentDate(newDate);
    };

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = setMonth(currentDate, monthIndex);
        setCurrentDate(newDate);
    };

    // Years for Popover (Current - 2 to Current + 2)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col h-full gap-4 p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
                        <p className="text-muted-foreground">
                            Planificación de instalaciones y averías
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Technician Filter */}
                        {['admin', 'project_manager'].includes(user?.role || '') && (
                            <div className="w-[200px]">
                                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por técnico" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los técnicos</SelectItem>
                                        {techniciansQuery.data?.map((tech) => (
                                            <SelectItem key={tech.id} value={tech.id.toString()}>
                                                {tech.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* View Toggle */}
                        <Button
                            variant={showYearView ? "default" : "outline"}
                            onClick={() => setShowYearView(!showYearView)}
                        >
                            {showYearView ? "Vista Mensual" : "Vista Anual"}
                        </Button>
                    </div>
                </div>

                <Card className="flex-1 min-h-[700px]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-bold">
                            {!showYearView ? (
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => handleNavigate(subMonths(currentDate, 1))}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="text-lg font-semibold">
                                                <CalendarIcon className="mr-2 h-5 w-5" />
                                                {format(currentDate, 'MMMM yyyy', { locale: es })}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-4" align="start">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-3 gap-2">
                                                    {months.map((m, i) => (
                                                        <Button
                                                            key={m}
                                                            variant={currentDate.getMonth() === i ? "default" : "ghost"}
                                                            size="sm"
                                                            onClick={() => handleMonthSelect(i)}
                                                        >
                                                            {m.substring(0, 3)}
                                                        </Button>
                                                    ))}
                                                </div>
                                                <div className="border-t pt-2 grid grid-cols-5 gap-1">
                                                    {years.map(y => (
                                                        <Button
                                                            key={y}
                                                            variant={currentDate.getFullYear() === y ? "default" : "ghost"}
                                                            size="sm"
                                                            onClick={() => handleYearSelect(y)}
                                                        >
                                                            {y}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    <Button variant="outline" size="icon" onClick={() => handleNavigate(addMonths(currentDate, 1))}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>

                                    <Button variant="outline" size="sm" onClick={() => handleNavigate(new Date())}>
                                        Hoy
                                    </Button>
                                </div>
                            ) : (
                                <span>Vista Anual {format(currentDate, 'yyyy')}</span>
                            )}
                        </CardTitle>

                        <div className="flex items-center gap-4 text-sm hidden md:flex">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-yellow-500"></div> <span>Pendiente</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-500"></div> <span>Iniciada</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-green-500"></div> <span>Completada</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="h-full p-4">
                        {showYearView ? (
                            <YearView
                                date={currentDate}
                                events={events}
                                onNavigate={(d) => {
                                    handleNavigate(d);
                                    setShowYearView(false);
                                }}
                                onView={setView}
                            />
                        ) : (
                            <BigCalendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}
                                messages={messages}
                                culture="es"
                                eventPropGetter={eventStyleGetter}
                                onSelectEvent={(event) => setLocation(`/installations/${event.id}`)}
                                date={currentDate}
                                onNavigate={handleNavigate}
                                view={view}
                                onView={setView}
                                views={['month', 'week', 'day', 'agenda']}
                                toolbar={false} // Custom toolbar above
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
