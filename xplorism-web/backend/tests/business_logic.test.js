import test from 'node:test';
import assert from 'node:assert/strict';

test('Business Logic & Schema Boundary Conditions Suite', async (t) => {
  await t.test('Trip Date Constraints: endDate must equal or exceed startDate', () => {
    function validateTripDates(startDateStr, endDateStr) {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { valid: false, error: 'Invalid ISO date string' };
      }
      if (end < start) {
        return { valid: false, error: 'End date cannot precede start date' };
      }
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return { valid: true, totalDays: diffDays };
    }

    assert.equal(validateTripDates('2026-10-01', '2026-09-25').valid, false);
    assert.equal(validateTripDates('2026-10-01', '2026-10-05').valid, true);
    assert.equal(validateTripDates('2026-10-01', '2026-10-05').totalDays, 5);
    assert.equal(validateTripDates('2026-10-01', '2026-10-01').totalDays, 1);
  });

  await t.test('Budget Calculation Logic: aggregates itinerary planned costs and expense items correctly', () => {
    const trip = { budget: 2000.0 };

    const itineraryItems = [
      { day: 1, estimated_cost: 150.0 },
      { day: 1, estimated_cost: 50.0 },
      { day: 2, estimated_cost: 200.0 }
    ];

    const expenses = [
      { day: 1, category: 'Food', planned_amount: 80.0, actual_amount: 95.0 },
      { day: 2, category: 'Transport', planned_amount: 120.0, actual_amount: 110.0 }
    ];

    const totalPlannedFromItinerary = itineraryItems.reduce((acc, i) => acc + i.estimated_cost, 0);
    const totalPlannedFromExpenses = expenses.reduce((acc, e) => acc + e.planned_amount, 0);
    const totalActual = expenses.reduce((acc, e) => acc + e.actual_amount, 0);

    const totalPlanned = totalPlannedFromItinerary + totalPlannedFromExpenses;
    const remainingBudget = trip.budget - totalActual;
    const utilizationPercent = Math.round((totalActual / trip.budget) * 100);

    assert.equal(totalPlannedFromItinerary, 400.0);
    assert.equal(totalPlannedFromExpenses, 200.0);
    assert.equal(totalPlanned, 600.0);
    assert.equal(totalActual, 205.0);
    assert.equal(remainingBudget, 1795.0);
    assert.equal(utilizationPercent, 10);
  });

  await t.test('Compound Index Uniqueness: prevents duplicate collaborator pairs (trip_id, user_id)', () => {
    const collaboratorStore = new Set();

    function addCollaboratorRecord(tripId, userId, status = 'pending') {
      const compoundKey = `${tripId}:${userId}`;
      if (collaboratorStore.has(compoundKey)) {
        throw new Error('UNIQUE constraint violation: (trip_id, user_id) duplicate');
      }
      collaboratorStore.add(compoundKey);
      return { tripId, userId, status };
    }

    // First addition succeeds
    const col1 = addCollaboratorRecord('trip-abc', 'user-101');
    assert.equal(col1.status, 'pending');

    // Duplicate addition throws unique constraint error
    assert.throws(
      () => addCollaboratorRecord('trip-abc', 'user-101'),
      /UNIQUE constraint violation/,
      'Cannot insert duplicate collaborator for same trip'
    );

    // Different user on same trip succeeds
    const col2 = addCollaboratorRecord('trip-abc', 'user-102');
    assert.equal(col2.userId, 'user-102');
  });

  await t.test('Compound Index Uniqueness: prevents duplicate poll votes (poll_id, user_id)', () => {
    const votesStore = new Map();

    function recordPollVote(pollId, userId, optionIndex) {
      const compoundKey = `${pollId}:${userId}`;
      // Simulate UPSERT behavior
      votesStore.set(compoundKey, { pollId, userId, optionIndex });
      return { updated: true, key: compoundKey };
    }

    recordPollVote('poll-1', 'user-alpha', 0);
    assert.equal(votesStore.get('poll-1:user-alpha').optionIndex, 0);

    // Vote change (upsert) maintains uniqueness
    recordPollVote('poll-1', 'user-alpha', 2);
    assert.equal(votesStore.get('poll-1:user-alpha').optionIndex, 2);
    assert.equal(votesStore.size, 1, 'Store must only contain 1 record for unique compound key');
  });

  await t.test('Itinerary Attraction Uniqueness: enforces strict no-repeat policy across days', () => {
    function validateItineraryUniqueness(itineraryDays) {
      const seenLocations = new Set();
      const duplicates = [];

      for (const day of itineraryDays) {
        for (const act of day.activities) {
          const normalized = act.location.trim().toLowerCase();
          if (seenLocations.has(normalized)) {
            duplicates.push(act.location);
          } else {
            seenLocations.add(normalized);
          }
        }
      }
      return { hasDuplicates: duplicates.length > 0, duplicates };
    }

    const validPlan = [
      { day: 1, activities: [{ location: 'Eiffel Tower' }, { location: 'Louvre Museum' }] },
      { day: 2, activities: [{ location: 'Notre Dame Cathedral' }, { location: 'Montmartre' }] }
    ];
    assert.equal(validateItineraryUniqueness(validPlan).hasDuplicates, false);

    const invalidPlan = [
      { day: 1, activities: [{ location: 'Eiffel Tower' }, { location: 'Louvre Museum' }] },
      { day: 2, activities: [{ location: 'eiffel tower' }, { location: 'Arc de Triomphe' }] }
    ];
    const check = validateItineraryUniqueness(invalidPlan);
    assert.equal(check.hasDuplicates, true);
    assert.deepEqual(check.duplicates, ['eiffel tower']);
  });

  await t.test('Post Like Toggle State Machine: idempotency and count integrity', () => {
    const post = {
      id: 'post-1',
      likes: 0,
      liked_by: []
    };

    function toggleLike(targetPost, userId) {
      const idx = targetPost.liked_by.indexOf(userId);
      if (idx === -1) {
        // Like
        targetPost.liked_by.push(userId);
        targetPost.likes += 1;
        return { isLiked: true, totalLikes: targetPost.likes };
      } else {
        // Unlike
        targetPost.liked_by.splice(idx, 1);
        targetPost.likes = Math.max(0, targetPost.likes - 1);
        return { isLiked: false, totalLikes: targetPost.likes };
      }
    }

    // User A likes
    const r1 = toggleLike(post, 'user-A');
    assert.equal(r1.isLiked, true);
    assert.equal(r1.totalLikes, 1);

    // User B likes
    const r2 = toggleLike(post, 'user-B');
    assert.equal(r2.isLiked, true);
    assert.equal(r2.totalLikes, 2);

    // User A unlikes
    const r3 = toggleLike(post, 'user-A');
    assert.equal(r3.isLiked, false);
    assert.equal(r3.totalLikes, 1);

    // User A unlikes again? No, next toggle re-likes
    const r4 = toggleLike(post, 'user-A');
    assert.equal(r4.isLiked, true);
    assert.equal(r4.totalLikes, 2);
  });
});

