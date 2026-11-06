import { describe, expect, it } from 'vitest';

import { getAvailableTransitions } from './status';

describe('getAvailableTransitions', () => {
  it('allows an assigned executor to start a new task', () => {
    expect(getAvailableTransitions('new', 'executor', true)).toEqual([
      expect.objectContaining({ target: 'in_progress' }),
    ]);
  });

  it('does not expose executor actions for another user task', () => {
    expect(getAvailableTransitions('new', 'executor', false)).toEqual([]);
  });

  it('allows a manager to accept or return a task in review', () => {
    expect(getAvailableTransitions('in_review', 'manager', false).map(({ target }) => target)).toEqual([
      'accepted',
      'needs_revision',
    ]);
  });
});
