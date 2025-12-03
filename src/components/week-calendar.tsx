/**
 * WeekCalendar - Orchestrator Component
 * Manages Desktop/Mobile calendar views using extracted hook and components
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WeekCalendarProps } from "@/types";
import { CalendarErrorBoundary } from "@/components/common/error-boundary";
import { DayViewContent } from "@/components/calendar/day-view-content";
import { DesktopWeekGrid } from "@/components/calendar/desktop-week-grid";
import { useWeekCalendar } from "@/components/calendar/hooks/use-week-calendar";

export function WeekCalendar({ onSlotEdit, selectedDate, selectedDay: propSelectedDay, viewMode = "week", slots: propSlots, isLoading: propIsLoading }: WeekCalendarProps) {
  return (
    <CalendarErrorBoundary>
      <WeekCalendarContent 
        onSlotEdit={onSlotEdit} 
        selectedDate={selectedDate} 
        selectedDay={propSelectedDay} 
        viewMode={viewMode}
        slots={propSlots}
        isLoading={propIsLoading}
      />
    </CalendarErrorBoundary>
  );
}

function WeekCalendarContent({ onSlotEdit, selectedDate, selectedDay: propSelectedDay, viewMode = "week", slots: propSlots, isLoading: propIsLoading }: WeekCalendarProps) {
  const calendar = useWeekCalendar({
    selectedDate,
    selectedDay: propSelectedDay,
    propSlots,
    propIsLoading,
    onSlotEdit,
  });

  return (
    <div className="w-full space-y-4">
      {/* Desktop Calendar View - Week or Day */}
      <div className="hidden md:block">
        {viewMode === "week" ? (
          <DesktopWeekGrid
            weekDays={calendar.weekDays}
            timeSlots={calendar.timeSlots}
            weekSlots={calendar.weekSlots}
            canManageSlots={calendar.canManageSlots}
            canBookSlots={calendar.canBookSlots}
            currentRole={calendar.currentRole}
            getSlotStatus={calendar.getSlotStatus}
            getSlotColors={calendar.getSlotColors}
            getMiniSlotsForDayHourMinute={calendar.getMiniSlotsForDayHourMinute}
            isMiniSlotAvailable={calendar.isMiniSlotAvailable}
            dayHasSlots={calendar.dayHasSlots}
            onHourClick={calendar.handleHourClick}
            onSlotEdit={(slot) => onSlotEdit(slot)}
            onBlockedSlotClick={calendar.handleBlockedSlotToast}
          />
        ) : (
          /* Desktop Day View */
          <Card className="card-maritime-hero">
            <CardHeader className="pb-2" />
            <CardContent className="space-y-2">
              <DayViewContent
                selectedDay={calendar.selectedDay}
                selectedDaySlots={calendar.selectedDaySlots}
                allSlots={calendar.weekSlots}
                getSlotStatus={calendar.getSlotStatus}
                getSlotColors={calendar.getSlotColors}
                canManageSlots={calendar.canManageSlots}
                canBookSlots={calendar.canBookSlots}
                currentUserId={calendar.currentUser?.id}
                userRole={calendar.currentRole}
                onSlotClick={calendar.handleDayViewSlotClick}
                onSlotEdit={calendar.handleDayViewSlotEdit}
                onSlotCancel={calendar.handleCancelSlot}
                onSlotDelete={calendar.handleDeleteSlotConfirm}
                onCreateSlot={calendar.handleCreateSlot}
                onBlockedSlotClick={calendar.handleBlockedSlotToast}
                showHeader={true}
                variant="desktop"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tablet/Mobile Calendar View */}
      <div className="md:hidden">
        <DayViewContent
          selectedDay={calendar.selectedDay}
          selectedDaySlots={calendar.selectedDaySlots}
          allSlots={calendar.weekSlots}
          getSlotStatus={calendar.getSlotStatus}
          getSlotColors={calendar.getSlotColors}
          canManageSlots={calendar.canManageSlots}
          canBookSlots={calendar.canBookSlots}
          currentUserId={calendar.currentUser?.id}
          userRole={calendar.currentRole}
          onSlotClick={calendar.handleDayViewSlotClick}
          onSlotEdit={calendar.handleDayViewSlotEdit}
          onSlotCancel={calendar.handleCancelSlot}
          onSlotDelete={calendar.handleDeleteSlotConfirm}
          onCreateSlot={calendar.handleCreateSlot}
          onBlockedSlotClick={calendar.handleBlockedSlotToast}
          showHeader={true}
          variant="mobile"
        />
      </div>

      {/* Confirmation Dialogs */}
      <AlertDialog open={calendar.deleteDialogOpen} onOpenChange={calendar.setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slot löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Slot wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={calendar.confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={calendar.cancelDialogOpen} onOpenChange={calendar.setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slot stornieren</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diesen Slot wirklich stornieren? Der Slot wird wieder verfügbar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={calendar.confirmCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
