import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckInAlert } from '@shared/schema';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { getTimezones, getUserTimezone, formatTimeWithTimezone } from '@/lib/timezoneUtils';

// Create a schema for form validation
const alertFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  days: z.array(z.string()).min(1, 'Select at least one day'),
  timezone: z.string().min(1, 'Please select a timezone'),
  enabled: z.boolean().default(true),
});

type AlertFormValues = z.infer<typeof alertFormSchema>;

interface CheckInAlertFormProps {
  alert?: CheckInAlert;
  onSubmit: (values: AlertFormValues) => void;
  isSubmitting: boolean;
  isEditing?: boolean;
  onCancel: () => void;
}

const daysOfWeek = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export default function CheckInAlertForm({ 
  alert, 
  onSubmit, 
  isSubmitting, 
  isEditing = false, 
  onCancel 
}: CheckInAlertFormProps) {
  const form = useForm<AlertFormValues>({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      title: alert?.title || '',
      message: alert?.message || '',
      time: alert?.time || '09:00',
      days: alert?.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: alert?.timezone || getUserTimezone(),
      enabled: alert?.enabled ?? true,
    },
  });

  function handleSubmit(values: AlertFormValues) {
    onSubmit(values);
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          {isEditing ? 'Edit Check-in Alert' : 'Create Check-in Alert'}
        </CardTitle>
        <CardDescription>
          Set up reminders to keep you accountable for your daily check-ins
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Daily Morning Check-in" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="It's time for your daily check-in. What progress have you made today?" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Active Days</FormLabel>
              <div className="flex flex-wrap gap-3">
                {daysOfWeek.map(day => (
                  <FormField
                    key={day.id}
                    control={form.control}
                    name="days"
                    render={({ field }) => (
                      <FormItem key={day.id} className="flex flex-row items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            id={day.id}
                            checked={field.value?.includes(day.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, day.id]);
                              } else {
                                field.onChange(field.value?.filter(value => value !== day.id));
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel htmlFor={day.id} className="m-0 cursor-pointer text-sm">
                          {day.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              {form.formState.errors.days && (
                <p className="text-sm text-destructive">{form.formState.errors.days.message}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimezones().map(timezone => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div className="space-y-0">
                    <FormLabel>Enable Alert</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Alert' : 'Create Alert'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}