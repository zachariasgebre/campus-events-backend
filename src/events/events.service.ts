import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { Event, PaginatedEvents, Session } from './event.model';

const dateFromToday = (offsetDays: number, hour = 17) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

@Injectable()
export class EventsService {
  private readonly events: Event[] = [
    { id: 1, title: 'Welcome Week Meetup', description: 'Meet new students and campus clubs.', location: 'Student Union', eventDate: dateFromToday(-12), category: 'Community', isPublished: true },
    { id: 2, title: 'Intro to Robotics', description: 'Build and program a small robot with the engineering club.', location: 'Engineering Lab 2', eventDate: dateFromToday(3), category: 'Workshop', isPublished: true },
    { id: 3, title: 'Spring Arts Showcase', description: 'Student performances and gallery exhibits.', location: 'Arts Center', eventDate: dateFromToday(15), category: 'Arts', isPublished: true },
    { id: 4, title: 'Career Paths in Climate Tech', description: 'A panel with alumni working in climate technology.', location: 'Science Hall 110', eventDate: dateFromToday(9), category: 'Talk', isPublished: true },
    { id: 5, title: 'Open Mic Night', description: 'An evening of student music, poetry, and comedy.', location: 'The Commons', eventDate: dateFromToday(22), category: 'Arts', isPublished: false },
    { id: 6, title: 'Data Visualization Lab', description: 'A hands-on introduction to visual storytelling with data.', location: 'Library Learning Studio', eventDate: dateFromToday(6), category: 'Workshop', isPublished: true },
    { id: 7, title: 'Volunteer Park Cleanup', description: 'Join the campus service group for a neighborhood cleanup.', location: 'North Gate', eventDate: dateFromToday(-2), category: 'Community', isPublished: true },
    { id: 8, title: 'Student Research Lightning Talks', description: 'Short presentations of current undergraduate research.', location: 'Research Commons', eventDate: dateFromToday(30), category: 'Talk', isPublished: false },
    { id: 9, title: 'New Student Game Night', description: 'Board games and casual games for all experience levels.', location: 'Residence Hall East', eventDate: dateFromToday(1), category: 'Community', isPublished: true },
    { id: 10, title: 'Portfolio Review Workshop', description: 'Get feedback on a creative portfolio from faculty and peers.', location: 'Design Studio', eventDate: dateFromToday(12), category: 'Workshop', isPublished: true },
  ];

  private readonly sessions: Session[] = [
    { id: 1, eventId: 2, title: 'Robot Basics', speaker: 'Prof. Maya Chen', startTime: '10:00', endTime: '10:45' },
    { id: 2, eventId: 2, title: 'Build and Test', speaker: 'Robotics Club', startTime: '11:00', endTime: '12:00' },
    { id: 3, eventId: 4, title: 'Finding Your First Role', speaker: 'Jordan Lee', startTime: '16:00', endTime: '16:40' },
    { id: 4, eventId: 4, title: 'Alumni Q&A', speaker: 'Climate Tech Alumni Panel', startTime: '16:45', endTime: '17:30' },
    { id: 5, eventId: 3, title: 'Gallery Opening', speaker: 'Student Arts Council', startTime: '18:00', endTime: '19:00' },
  ];
  private nextEventId = 11;

  findAll(query: ListEventsQueryDto): PaginatedEvents {
    let results = [...this.events];
    if (query.category) {
      results = results.filter((event) => event.category.toLowerCase() === query.category!.toLowerCase());
    }
    if (query.isPublished !== undefined) {
      results = results.filter((event) => event.isPublished === query.isPublished);
    }
    const sortBy = query.sortBy ?? 'eventDate';
    const direction = query.order === 'desc' ? -1 : 1;
    results.sort((a, b) => a[sortBy].localeCompare(b[sortBy]) * direction);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = results.length;
    const start = (page - 1) * limit;
    return { items: results.slice(start, start + limit), total, page, limit };
  }

  findUpcoming(): Event[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.events
      .filter((event) => new Date(event.eventDate) >= today)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }

  findOne(id: number): Event {
    const event = this.events.find((item) => item.id === id);
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  findSessions(id: number): Session[] {
    this.findOne(id);
    return this.sessions.filter((session) => session.eventId === id);
  }

  create(dto: CreateEventDto): Event {
    const event: Event = { id: this.nextEventId++, ...dto };
    this.events.push(event);
    return event;
  }
}
