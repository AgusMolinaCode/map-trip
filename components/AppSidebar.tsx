"use client";

import { Map, Plus, Loader2, LogOut } from "lucide-react";
import { signout } from "@/app/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { DayItem } from "@/components/DayItem";
import { TouristPinSearch } from "@/components/TouristPinSearch";
import { useTripStore } from "@/hooks/useTripStore";
import { useTripContext } from "@/contexts/TripContext";
import { SyncStatusIndicator } from "@/components/SyncStatusIndicator";

export function AppSidebar() {
  const days = useTripStore((state) => state.days);
  const addDay = useTripStore((state) => state.addDay);
  const { handlePlaceClick, handleFlyToCoordinates, isLoading } =
    useTripContext();

  return (
    <Sidebar className="w-120">
      {/* Header: Branding + Add Day */}
      <SidebarHeader className="border-b p-4 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 md:h-6 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-bold">Planea tu viaje</h1>
          </div>
          <SyncStatusIndicator />
        </div>
        <Button
          variant={"outline"}
          onClick={addDay}
          disabled={isLoading}
          className="w-full font-semibold hover:shadow-md hover:cursor-pointer duration-300 bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Cargando..." : "Agregar"}
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Tourist Place Search */}
        {/* <SidebarGroup className="shrink-0">
          <SidebarGroupLabel>Buscar lugares</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <TouristPinSearch onPinAdded={handleFlyToCoordinates} />
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Trip Days Group */}
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel>Dias de viaje</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            {isLoading ? (
              // Loading state
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 px-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Cargando viaje...
                  </p>
                </div>
                {/* Skeleton placeholders */}
                {/* <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div> */}
              </div>
            ) : days.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-sm text-muted-foreground mb-2">
                  No hay días planeados aún.
                </p>
                <p className="text-xs text-muted-foreground">
                  Clic en &quot;Agregar&quot; para comenzar a planear tu viaje.
                </p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full min-w-0">
                {days.map((day, index) => (
                  <DayItem
                    key={day.id}
                    day={day}
                    dayIndex={index}
                    onPlaceClick={handlePlaceClick}
                  />
                ))}
              </Accordion>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: Statistics + Logout */}
      <SidebarFooter className="border-t p-4 shrink-0 space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Sincronizando datos...</span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Dias totales: {days.length}</p>
            <p>
              Lugares:{" "}
              {days.reduce(
                (acc, day) =>
                  acc +
                  day.routes.reduce(
                    (sum, route) => sum + route.places.length,
                    0
                  ),
                0
              )}
            </p>
          </div>
        )}
        <form action={signout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:bg-red-300/70 bg-red-200"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
