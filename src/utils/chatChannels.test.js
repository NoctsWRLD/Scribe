import { describe, expect, it } from 'vitest';
import { channelSlug, schoolChatId, subjectChatId } from './chatChannels';

describe('channel ids', () => {
  it('derives one id per name, the same way everywhere', () => {
    expect(subjectChatId('Matematika')).toBe('subject_matematika');
    expect(subjectChatId('Zgodovina 2. letnik')).toBe('subject_zgodovina_2._letnik');
  });

  it('ignores case and surrounding space', () => {
    expect(subjectChatId('  Matematika ')).toBe(subjectChatId('matematika'));
  });

  it('keeps school channels separate from subject channels', () => {
    expect(schoolChatId('Gimnazija Ljubljana')).toBe('school_gimnazija_ljubljana');
    expect(schoolChatId('Gimnazija Ljubljana')).not.toBe(subjectChatId('Gimnazija Ljubljana'));
  });

  it('returns null for a name that is not set, so no empty channel is opened', () => {
    expect(schoolChatId('')).toBeNull();
    expect(schoolChatId(undefined)).toBeNull();
    expect(subjectChatId('   ')).toBeNull();
  });

  it('collapses runs of whitespace into one separator', () => {
    expect(channelSlug('Prvi  letnik')).toBe('prvi_letnik');
  });
});
