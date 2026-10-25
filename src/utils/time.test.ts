import { describe, expect, it } from 'vitest';
import { eventDuration, formatRunTime } from './time';

describe('eventDuration', () => {
  it('counts the hours between start and end on the same day', () => {
    expect(eventDuration('06:00', '18:00')).toEqual({ minutes: 720, nextDay: false });
    expect(eventDuration('09:15', '10:00')).toEqual({ minutes: 45, nextDay: false });
  });

  it('reads an end before the start as the next day', () => {
    expect(eventDuration('18:00', '06:00')).toEqual({ minutes: 720, nextDay: true });
    expect(eventDuration('22:30', '02:00')).toEqual({ minutes: 210, nextDay: true });
  });

  it('has no duration without both times, or when they are the same', () => {
    expect(eventDuration('18:00', '')).toBeNull();
    expect(eventDuration('18:00', '18:00')).toBeNull();
  });
});

describe('formatRunTime', () => {
  it('says hours and minutes in words', () => {
    expect(formatRunTime(720)).toBe('12 hours');
    expect(formatRunTime(210)).toBe('3 hours 30 minutes');
    expect(formatRunTime(60)).toBe('1 hour');
    expect(formatRunTime(45)).toBe('45 minutes');
  });
});
