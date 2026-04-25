import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCheckInAlerts } from '@/hooks/use-check-in-alerts';
import { CheckInAlert } from '@shared/schema';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import CheckInAlertForm from '@/components/forms/CheckInAlertForm';
import { formatTime } from '@/lib/dateUtils';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, Clock, CalendarDays, Edit, Trash2, Globe, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTimeWithTimezone } from '@/lib/timezoneUtils';
import { useAlertChecker } from '@/components/providers/AlertCheckerProvider';

export default function CheckInAlerts() {
  const { 
    alerts, 
    isLoading, 
    selectedAlert, 
    setSelectedAlert, 
    createAlertMutation, 
    updateAlertMutation,
    deleteAlertMutation,
  } = useCheckInAlerts();
  
  const { triggerAlert } = useAlertChecker();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleCreateAlert = (data: Omit<CheckInAlert, 'id' | 'userId'>) => {
    createAlertMutation.mutate(data as any);
    setIsFormOpen(false);
  };

  const handleUpdateAlert = (data: Omit<CheckInAlert, 'id' | 'userId'>) => {
    if (selectedAlert) {
      updateAlertMutation.mutate({
        id: selectedAlert.id,
        ...data,
      });
      setIsFormOpen(false);
    }
  };

  const handleDeleteAlert = () => {
    if (selectedAlert) {
      deleteAlertMutation.mutate(selectedAlert.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleToggleAlert = (alert: CheckInAlert) => {
    updateAlertMutation.mutate({
      id: alert.id,
      enabled: !alert.enabled,
    });
  };

  const openEditForm = (alert: CheckInAlert) => {
    setSelectedAlert(alert);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (alert: CheckInAlert) => {
    setSelectedAlert(alert);
    setIsDeleteDialogOpen(true);
  };

  const formatDays = (days: string[]): string => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && 
        days.includes('monday') && 
        days.includes('tuesday') && 
        days.includes('wednesday') && 
        days.includes('thursday') && 
        days.includes('friday')) {
      return 'Weekdays';
    }
    if (days.length === 2 && 
        days.includes('saturday') && 
        days.includes('sunday')) {
      return 'Weekends';
    }
    
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(', ');
  };

  const isMutating = createAlertMutation.isPending || 
                     updateAlertMutation.isPending || 
                     deleteAlertMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-forest/55 dark:text-parchment/55">
          Set reminders to keep your daily check-ins consistent.
        </p>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setSelectedAlert(null)}
              className="bg-clay hover:bg-clay/90 text-white rounded-2xl px-4 text-sm"
            >
              Add reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <CheckInAlertForm
              alert={selectedAlert || undefined}
              onSubmit={selectedAlert ? handleUpdateAlert : handleCreateAlert}
              isSubmitting={isMutating}
              isEditing={!!selectedAlert}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-clay border-t-transparent" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10 rounded-2xl border border-dashed border-earth/30 dark:border-earth/15 bg-earth/5 dark:bg-earth/5">
          <Bell className="mx-auto h-7 w-7 text-forest/30 dark:text-parchment/30 mb-3" />
          <p className="text-sm font-medium text-forest/60 dark:text-parchment/60">No reminders yet</p>
          <p className="text-xs text-forest/40 dark:text-parchment/35 mt-1">
            Add one above to start getting nudged.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                alert.enabled
                  ? 'border-earth/20 dark:border-earth/10 bg-cream/50 dark:bg-dark-bg/30'
                  : 'border-earth/10 dark:border-earth/10 bg-earth/5 dark:bg-earth/5 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${alert.enabled ? 'bg-clay/15 text-clay' : 'bg-earth/10 text-forest/40 dark:text-parchment/30'}`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forest dark:text-parchment">{alert.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-forest/50 dark:text-parchment/50">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(new Date(`2000-01-01T${alert.time}:00`))}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDays(alert.days)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {alert.timezone || 'UTC'}
                    </span>
                  </div>
                  {alert.timezone && (
                    <p className="text-[10px] text-forest/35 dark:text-parchment/30 mt-0.5">
                      {formatTimeWithTimezone(alert.time, alert.timezone)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                <Switch
                  checked={alert.enabled}
                  onCheckedChange={() => handleToggleAlert(alert)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditForm(alert)}
                  title="Edit"
                  className="text-forest/50 dark:text-parchment/50 hover:text-forest dark:hover:text-parchment"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(alert)}
                  title="Delete"
                  className="text-forest/50 dark:text-parchment/50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Test notification"
                  onClick={() => { if (alert && triggerAlert) triggerAlert(alert.id); }}
                  className="text-forest/50 dark:text-parchment/50 hover:text-sage"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-forest dark:text-parchment">Delete reminder</AlertDialogTitle>
            <AlertDialogDescription className="text-forest/55 dark:text-parchment/55">
              This can't be undone. The reminder will stop firing immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlert}
              className="bg-red-500 hover:bg-red-600 text-white rounded-2xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}