'use client'

import { Map, Home, Search, Calendar, Settings, Plus } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { DayItem } from '@/components/DayItem'
import { useTripStore } from '@/hooks/useTripStore'
import { useTripContext } from '@/contexts/TripContext'

// Navigation items
const navItems = [
  { title: 'Home', url: '/dashboard', icon: Home },
  { title: 'Search', url: '/dashboard/search', icon: Search },
  { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
]

export function AppSidebar() {
  const days = useTripStore((state) => state.days)
  const addDay = useTripStore((state) => state.addDay)
  const { handlePlaceClick } = useTripContext()

  return (
    <Sidebar className="w-120">
      {/* Header: Branding + Add Day */}
      <SidebarHeader className="border-b p-4 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <Map className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Planea tu viaje</h1>
        </div>
        <Button variant={'outline'} onClick={addDay} className="w-full font-semibold hover:shadow-md hover:cursor-pointer duration-300 bg-accent">
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Navigation Group */}
        {/* <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        {/* Trip Days Group */}
        <SidebarGroup className="flex-1 overflow-y-auto">
          <SidebarGroupLabel>Dias de viaje</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            {days.length === 0 ? (
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

      {/* Footer: Statistics */}
      <SidebarFooter className="border-t p-4 shrink-0">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Total days: {days.length}</p>
          <p>
            Total places: {days.reduce((acc, day) => acc + day.places.length, 0)}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar