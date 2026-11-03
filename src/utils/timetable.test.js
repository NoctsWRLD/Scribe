import { describe, expect, it } from 'vitest';
import { detectDay, parseTimetableText } from './timetable';

describe('detectDay', () => {
  it('reads Slovenian day names and short forms', () => {
    expect(detectDay('Ponedeljek')).toBe(0);
    expect(detectDay('čet.')).toBe(3);
    expect(detectDay('Cetrtek')).toBe(3);
  });

  it('reads the other interface languages', () => {
    expect(detectDay('Monday')).toBe(0);
    expect(detectDay('Wed:')).toBe(2);
    expect(detectDay('Donnerstag')).toBe(3);
    expect(detectDay('venerdì')).toBe(4);
    expect(detectDay('Subota')).toBe(5);
    expect(detectDay('Nedjelja')).toBe(6);
  });

  it('takes two-letter German forms only when they stand alone', () => {
    expect(detectDay('Mo')).toBe(0);
    expect(detectDay('Fr.')).toBe(4);
    expect(detectDay('Do 8:00')).toBe(-1);
    expect(detectDay('Sonata za klavir')).toBe(-1);
  });

  it('does not read a lesson that merely starts like a day', () => {
    expect(detectDay('Matematika')).toBe(-1);
    expect(detectDay('Petrova ura')).toBe(-1);
  });
});

describe('parseTimetableText', () => {
  it('assigns lessons to the day above them', () => {
    const rows = parseTimetableText('Monday\n8:00 Maths\nTuesday\n9:00 Physics', []);
    expect(rows.map((row) => [row.weekday, row.title])).toEqual([
      [0, 'Maths'],
      [1, 'Physics'],
    ]);
  });
});
