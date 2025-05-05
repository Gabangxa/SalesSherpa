import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAlertChecker } from '@/hooks/use-alert-checker';

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
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">Check-in Alerts</CardTitle>
          <CardDescription>
            Set up reminders to keep you accountable for your daily check-ins
          </CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => setSelectedAlert(null)}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              Add Alert
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
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading alerts...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-muted/50">
            <Bell className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No alerts configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an alert to receive daily check-in reminders
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-4 border rounded-md flex items-center justify-between transition-all ${
                  alert.enabled ? 'bg-card' : 'bg-muted/30 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${alert.enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{alert.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> 
                        {formatTime(new Date(`2000-01-01T${alert.time}:00`))}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> 
                        {formatDays(alert.days)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> 
                        {alert.timezone || 'UTC'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {alert.timezone && formatTimeWithTimezone(alert.time, alert.timezone)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={alert.enabled} 
                    onCheckedChange={() => handleToggleAlert(alert)} 
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openEditForm(alert)}
                    title="Edit alert"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => openDeleteDialog(alert)}
                    title="Delete alert"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    title="Test alert notification"
                    onClick={() => {
                      if (alert && triggerAlert) triggerAlert(alert.id);
                    }}
                  >
                    <Play className="h-4 w-4 text-green-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Check-in Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this alert? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlert}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}