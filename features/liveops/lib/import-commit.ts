import type { EventInput, LiveOpsEvent } from '../types/events'

export function liveOpsEventsToEventInputs(events: LiveOpsEvent[]): EventInput[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    cohort: event.cohort,
    eventType: event.eventType,
    placement: event.placement,
    description: event.description,
    status: event.status,
    recurrence: event.recurrence,
  }))
}

interface AppendDeps {
  addMultipleEvents: (inputs: EventInput[]) => LiveOpsEvent[]
}

interface ReplaceDeps {
  replaceCalendarWithImported: (inputs: EventInput[]) => LiveOpsEvent[]
}

export function commitImportAppend(events: LiveOpsEvent[], deps: AppendDeps): void {
  deps.addMultipleEvents(liveOpsEventsToEventInputs(events))
}

export function commitImportReplace(events: LiveOpsEvent[], deps: ReplaceDeps): void {
  deps.replaceCalendarWithImported(liveOpsEventsToEventInputs(events))
}
