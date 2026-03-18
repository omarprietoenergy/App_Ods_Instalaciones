import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Installations from "./pages/Installations";
import InstallationDetail from "./pages/InstallationDetail";
import InstallationMaterials from "./pages/InstallationMaterials";
import DailyReports from "./pages/DailyReports";
import NewDailyReport from "./pages/NewDailyReport";
import DailyReportDetail from "./pages/DailyReportDetail";
import Users from "./pages/Users";
import EmailTemplates from "./pages/EmailTemplates";
import CalendarPage from "./pages/Calendar";
import MetricsPage from "./pages/Metrics";
import BulkExportPage from "./pages/BulkExport";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Home} />
      <Route path={"/dashboard"} component={Home} />
      <Route path={"/installations"} component={Installations} />
      <Route path={"/installations/:id"} component={InstallationDetail} />
      <Route path={"/installations/:id/materials"} component={InstallationMaterials} />
      <Route path={"/installations/:id/daily-reports/new"} component={NewDailyReport} />
      <Route path={"/daily-reports"} component={DailyReports} />
      <Route path={"/daily-reports/new"} component={NewDailyReport} />
      <Route path={"/daily-reports/:id"} component={DailyReportDetail} />
      <Route path={"/users"} component={Users} />
      <Route path={"/email-templates"} component={EmailTemplates} />
      <Route path={"/calendar"} component={CalendarPage} />
      <Route path={"/metrics"} component={MetricsPage} />
      <Route path={"/export-pdfs"} component={BulkExportPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
