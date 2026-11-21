export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  category: string;
  isPublished: boolean;
}

export interface Session {
  id: number;
  eventId: number;
  title: string;
  speaker: string;
  startTime: string;
  endTime: string;
}

export type EventSortField = 'eventDate' | 'title' | 'category';
export type SortOrder = 'asc' | 'desc';

export interface PaginatedEvents {
  items: Event[];
  total: number;
  page: number;
  limit: number;
}
