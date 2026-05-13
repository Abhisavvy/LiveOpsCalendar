'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { buttonVariants } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  LiveOpsEvent,
  EventFormSchema,
  type EventFormInput,
  EventInput,
  EVENT_TYPES,
  EVENT_STATUSES,
  COHORT_OPTIONS,
  normalizeCohorts,
} from '../types/events'
import { useEventStore } from '../hooks/useEventStore'
import { RecurrenceConfig as RecurrenceConfigComponent } from './RecurrenceConfig'
import { formatDateTimeForInput, inputDateToISO, addDurationToDate, nowISO } from '../lib/date-utils'
import { Trash2, Copy } from 'lucide-react'

interface EventDetailSheetProps {
  event?: LiveOpsEvent | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  defaultStart?: string
  defaultEnd?: string
}

export function EventDetailSheet({ 
  event, 
  isOpen, 
  onOpenChange, 
  defaultStart, 
  defaultEnd 
}: EventDetailSheetProps) {
  const { toast } = useToast()
  const addEvent = useEventStore(state => state.addEvent)
  const updateEvent = useEventStore(state => state.updateEvent)
  const deleteEvent = useEventStore(state => state.deleteEvent)
  const restoreEvent = useEventStore(state => state.restoreEvent)
  const duplicateEvent = useEventStore(state => state.duplicateEvent)
  
  const isEditing = Boolean(event)
  const title = isEditing ? 'Edit Event' : 'Create Event'
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const form = useForm<EventFormInput>({
    resolver: zodResolver(EventFormSchema),
    defaultValues: {
      title: '',
      start: nowISO(),
      end: addDurationToDate(nowISO(), '1d'),
      cohort: ['All'],
      eventType: 'Unknown',
      placement: '',
      description: '',
      status: 'Draft',
      neverEnds: false,
    },
  })

  const neverEndsWatched = form.watch('neverEnds')

  // Reset form when event changes or sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      form.reset()
      return
    }

    if (event) {
      // Editing existing event
      form.reset({
        title: event.title,
        start: event.start,
        end: event.end,
        cohort: normalizeCohorts(event.cohort),
        eventType: event.eventType,
        placement: event.placement,
        description: event.description,
        status: event.status,
        recurrence: event.recurrence,
        neverEnds: event.end === null,
      })
    } else {
      // Creating new event
      form.reset({
        title: '',
        start: defaultStart || nowISO(),
        end: defaultEnd || addDurationToDate(defaultStart || nowISO(), '1d'),
        cohort: ['All'],
        eventType: 'Unknown',
        placement: '',
        description: '',
        status: 'Draft',
        neverEnds: false,
      })
    }
  }, [event, isOpen, defaultStart, defaultEnd, form])

  const onSubmit = (data: EventFormInput) => {
    const { neverEnds: _neverEnds, ...payload } = data
    const normalized: EventInput = {
      ...payload,
      cohort: normalizeCohorts(payload.cohort),
      end: data.neverEnds ? null : payload.end,
    }
    try {
      if (isEditing && event) {
        const success = updateEvent(event.id, normalized)
        if (success) {
          toast({
            title: "Event Updated",
            description: `${normalized.title} has been updated successfully.`,
          })
          onOpenChange(false)
        } else {
          toast({
            title: "Update Failed",
            description: "Could not update the event. Please try again.",
            variant: "destructive",
          })
        }
      } else {
        const newEvent = addEvent(normalized)
        toast({
          title: "Event Created",
          description: `${newEvent.title} has been created successfully.`,
        })
        onOpenChange(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!event) return
    
    const success = deleteEvent(event.id)
    if (success) {
      toast({
        title: "Event Deleted",
        description: `${event.title} has been deleted.`,
        action: (
          <ToastAction
            altText="Undo delete"
            onClick={() => {
              const restored = restoreEvent(event)
              if (restored) {
                toast({
                  title: "Event Restored",
                  description: `${event.title} has been restored.`,
                })
              }
            }}
          >
            Undo
          </ToastAction>
        ),
      })
      setIsDeleteConfirmOpen(false)
      onOpenChange(false)
    } else {
      toast({
        title: "Delete Failed",
        description: "Could not delete the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = () => {
    if (!event) return
    
    const duplicated = duplicateEvent(event.id)
    if (duplicated) {
      toast({
        title: "Event Duplicated",
        description: `Created a copy of ${event.title}.`,
      })
      onOpenChange(false)
    } else {
      toast({
        title: "Duplication Failed",
        description: "Could not duplicate the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {isEditing 
              ? 'Modify the event details below.' 
              : 'Fill in the details to create a new LiveOps event.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive name for your event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={formatDateTimeForInput(field.value)}
                        onChange={(e) => {
                          const next = inputDateToISO(e.target.value)
                          if (next) field.onChange(next)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time *</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        aria-label="End date"
                        disabled={neverEndsWatched}
                        value={formatDateTimeForInput(field.value)}
                        onChange={(e) => {
                          const next = inputDateToISO(e.target.value)
                          if (next) field.onChange(next)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="neverEnds"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      aria-label="Never ends"
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => {
                        const next = Boolean(checked)
                        field.onChange(next)
                        if (next) {
                          form.setValue('end', null)
                        } else if (!form.getValues('end')) {
                          form.setValue('end', addDurationToDate(form.getValues('start'), '1d'))
                        }
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 text-sm font-normal">Never ends</FormLabel>
                </FormItem>
              )}
            />
            {/* Event Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Cohort and Placement */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cohort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cohort *</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {COHORT_OPTIONS.map((cohort) => {
                          const checked = field.value.includes(cohort)
                          return (
                            <label key={cohort} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                aria-label={cohort}
                                onCheckedChange={(nextChecked) => {
                                  const isChecked = Boolean(nextChecked)
                                  if (cohort === 'All') {
                                    field.onChange(isChecked ? ['All'] : [])
                                    return
                                  }
                                  const withoutAll = field.value.filter((value) => value !== 'All')
                                  const next = isChecked
                                    ? [...withoutAll, cohort]
                                    : withoutAll.filter((value) => value !== cohort)
                                  field.onChange(next.length ? next : ['All'])
                                }}
                              />
                              <span>{cohort}</span>
                            </label>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormDescription>Target audience for this event</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placement *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Homescreen | Left" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where the event appears in-game
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter event description, conditions, or fine print..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the event mechanics and requirements
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurrence Configuration */}
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurrence (Optional)</FormLabel>
                  <FormControl>
                    <RecurrenceConfigComponent
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Configure repeating events (experimental feature)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <SheetFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between">
              <div className="flex gap-2">
                {isEditing && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicate}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove <span className="font-medium">{event?.title}</span>. You can undo right after deleting.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            onClick={handleConfirmDelete}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}