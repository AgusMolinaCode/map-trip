import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TripProvider } from "@/contexts/TripContext";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TripProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <SidebarTrigger className="bg-background border shadow-md" />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TripProvider>
  );
}
