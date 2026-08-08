import { query } from '../config/db.js';
import { getBudgetInsightsFromGemini, scanReceiptWithGemini } from '../services/geminiService.js';
import { createTripNotification } from './notificationController.js';

/**
 * GET /api/trips/:id/budget
 * Returns budget overview: totals, category breakdown, daily breakdown, budget utilization %
 */
export const getBudgetOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check trip ownership
    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = tripResult.rows[0];
    if (trip.user_id !== userId) {
      const collabCheck = await query(
        `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND status = 'approved'`,
        [id, userId]
      );
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const totalBudget = parseFloat(trip.budget) || 0;

    // 1. Get all itinerary items (planned costs)
    const itineraryResult = await query(
      'SELECT * FROM itinerary WHERE trip_id = $1 ORDER BY day ASC',
      [id]
    );
    const itineraryItems = itineraryResult.rows;

    // 2. Get all expenses (actual costs)
    const expensesResult = await query(
      'SELECT * FROM expenses WHERE trip_id = $1 ORDER BY day ASC, created_at ASC',
      [id]
    );
    const expenses = expensesResult.rows;

    // 3. Calculate totals
    const totalPlannedFromItinerary = itineraryItems.reduce(
      (sum, item) => sum + parseFloat(item.estimated_cost || 0),
      0
    );
    const totalPlannedFromExpenses = expenses.reduce(
      (sum, e) => sum + parseFloat(e.planned_amount || 0),
      0
    );
    const totalActual = expenses.reduce(
      (sum, e) => sum + parseFloat(e.actual_amount || 0),
      0
    );

    // Combine planned: itinerary costs + expense planned amounts
    const totalPlanned = totalPlannedFromItinerary + totalPlannedFromExpenses;
    const remaining = totalBudget - totalActual;
    const utilizationPercent = totalBudget > 0
      ? Math.min(100, Math.round((totalActual / totalBudget) * 100))
      : 0;

    // 4. Category breakdown (standardized percentages of totalBudget)
    const standardCategories = {
      'Accommodation': 0.35,
      'Food & Dining': 0.25,
      'Activities & Tours': 0.15,
      'Transportation': 0.15,
      'Shopping': 0.10
    };

    const categoryMap = {};
    Object.entries(standardCategories).forEach(([cat, pct]) => {
      categoryMap[cat] = {
        category: cat,
        planned: parseFloat((totalBudget * pct).toFixed(2)),
        actual: 0,
        count: 0,
        items: []
      };
    });

    const autoCategorize = (item) => {
      const name = (item.activity || '').toLowerCase() + ' ' + (item.location || '').toLowerCase();
      if (name.includes('food') || name.includes('restaurant') || name.includes('dinner') || name.includes('lunch') || name.includes('breakfast') || name.includes('cafe') || name.includes('market') || name.includes('tasting') || name.includes('meal')) {
        return 'Food & Dining';
      }
      if (name.includes('museum') || name.includes('gallery') || name.includes('tour') || name.includes('guide') || name.includes('ticket') || name.includes('entrance') || name.includes('admission')) {
        return 'Activities & Tours';
      }
      if (name.includes('hotel') || name.includes('hostel') || name.includes('resort') || name.includes('stay') || name.includes('lodging') || name.includes('accommodation')) {
        return 'Accommodation';
      }
      if (name.includes('flight') || name.includes('train') || name.includes('bus') || name.includes('taxi') || name.includes('uber') || name.includes('ferry') || name.includes('transport') || name.includes('cab') || name.includes('rental') || name.includes('gas') || name.includes('fuel')) {
        return 'Transportation';
      }
      if (name.includes('shop') || name.includes('souvenir') || name.includes('gift') || name.includes('boutique') || name.includes('mall') || name.includes('bazaar')) {
        return 'Shopping';
      }
      return 'Miscellaneous';
    };

    const findStandardCategory = (cat) => {
      const match = Object.keys(standardCategories).find(sc => 
        sc.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(sc.toLowerCase())
      );
      return match || 'Miscellaneous';
    };

    // Count itinerary items
    itineraryItems.forEach(item => {
      const cat = autoCategorize(item);
      const standardCat = findStandardCategory(cat);
      if (!categoryMap[standardCat]) {
        categoryMap[standardCat] = { category: standardCat, planned: 0, actual: 0, count: 0, items: [] };
      }
      categoryMap[standardCat].count += 1;
    });

    // Process expenses actual spent
    expenses.forEach(e => {
      const cat = e.category || 'Miscellaneous';
      const standardCat = findStandardCategory(cat);
      if (!categoryMap[standardCat]) {
        categoryMap[standardCat] = { category: standardCat, planned: 0, actual: 0, count: 0, items: [] };
      }
      categoryMap[standardCat].actual += parseFloat(e.actual_amount || 0);
      categoryMap[standardCat].count += 1;
    });

    const categoryBreakdown = Object.values(categoryMap).map(c => ({
      ...c,
      planned: parseFloat(c.planned.toFixed(2)),
      actual: parseFloat(c.actual.toFixed(2)),
      diff: parseFloat((c.actual - c.planned).toFixed(2)),
    }));

    // 5. Daily breakdown
    const dailyMap = {};
    itineraryItems.forEach(item => {
      const day = item.day;
      if (!dailyMap[day]) dailyMap[day] = { day, planned: 0, actual: 0, items: [] };
      dailyMap[day].planned += parseFloat(item.estimated_cost || 0);
      dailyMap[day].items.push({
        type: 'itinerary',
        name: item.activity,
        location: item.location,
        planned: parseFloat(item.estimated_cost || 0),
        actual: 0,
        time: item.time,
      });
    });
    expenses.forEach(e => {
      const day = e.day || 0;
      if (!dailyMap[day]) dailyMap[day] = { day, planned: 0, actual: 0, items: [] };
      dailyMap[day].planned += parseFloat(e.planned_amount || 0);
      dailyMap[day].actual += parseFloat(e.actual_amount || 0);
      dailyMap[day].items.push({
        type: 'expense',
        id: e.id,
        name: e.item_name,
        category: e.category,
        planned: parseFloat(e.planned_amount || 0),
        actual: parseFloat(e.actual_amount || 0),
        notes: e.notes,
      });
    });

    const dailyBreakdown = Object.values(dailyMap).sort((a, b) => a.day - b.day);

    res.json({
      tripId: id,
      destination: trip.destination,
      totalBudget,
      totalPlanned: parseFloat(totalPlanned.toFixed(2)),
      totalActual: parseFloat(totalActual.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      utilizationPercent,
      status: totalActual > totalBudget ? 'over_budget' : totalActual / totalBudget > 0.8 ? 'warning' : 'on_track',
      categoryBreakdown,
      dailyBreakdown,
      expenses,
    });
  } catch (error) {
    console.error('Budget overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/trips/:id/expenses
 * Log a new expense (actual spend)
 */
export const createExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { day, category, itemName, plannedAmount, actualAmount, currency, date, notes, paidBy } = req.body;

    // Check trip ownership
    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (tripResult.rows[0].user_id !== userId) {
      const collabCheck = await query(
        `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND status = 'approved'`,
        [id, userId]
      );
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const result = await query(
      `INSERT INTO expenses (trip_id, day, category, item_name, planned_amount, actual_amount, currency, date, notes, paid_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        id,
        day || null,
        category || 'Miscellaneous',
        itemName || 'Unnamed Expense',
        parseFloat(plannedAmount || 0),
        parseFloat(actualAmount || 0),
        currency || 'USD',
        date || null,
        notes || '',
        paidBy || 'Me'
      ]
    );

    const expense = result.rows[0];

    try {
      const userRes = await query('SELECT name FROM users WHERE id = $1', [userId]);
      const senderName = userRes.rows[0]?.name || 'Co-traveler';
      await createTripNotification(id, userId, senderName, 'Expense Logged', `logged a new bill/expense: "${expense.item_name}"`);
    } catch (notifErr) {
      console.error('Failed to trigger createExpense notification:', notifErr);
    }

    res.status(201).json({
      id: expense.id,
      tripId: expense.trip_id,
      day: expense.day,
      category: expense.category,
      itemName: expense.item_name,
      plannedAmount: expense.planned_amount,
      actualAmount: expense.actual_amount,
      currency: expense.currency,
      date: expense.date,
      notes: expense.notes,
      paidBy: expense.paid_by,
      createdAt: expense.created_at,
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUT /api/trips/:id/expenses/:expenseId
 * Update an expense entry
 */
export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, expenseId } = req.params;
    const { day, category, itemName, plannedAmount, actualAmount, currency, date, notes, paidBy } = req.body;

    // Check trip ownership
    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (tripResult.rows[0].user_id !== userId) {
      const collabCheck = await query(
        `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND status = 'approved'`,
        [id, userId]
      );
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // Check expense exists
    const expenseResult = await query('SELECT * FROM expenses WHERE id = $1 AND trip_id = $2', [expenseId, id]);
    if (expenseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const existing = expenseResult.rows[0];
    const result = await query(
      `UPDATE expenses 
       SET day = $1, category = $2, item_name = $3, planned_amount = $4, actual_amount = $5, 
           currency = $6, date = $7, notes = $8, paid_by = $9
       WHERE id = $10 RETURNING *`,
      [
        day !== undefined ? day : existing.day,
        category || existing.category,
        itemName || existing.item_name,
        plannedAmount !== undefined ? parseFloat(plannedAmount) : existing.planned_amount,
        actualAmount !== undefined ? parseFloat(actualAmount) : existing.actual_amount,
        currency || existing.currency,
        date !== undefined ? date : existing.date,
        notes !== undefined ? notes : existing.notes,
        paidBy || existing.paid_by,
        expenseId,
      ]
    );

    const expense = result.rows[0];

    try {
      const userRes = await query('SELECT name FROM users WHERE id = $1', [userId]);
      const senderName = userRes.rows[0]?.name || 'Co-traveler';
      await createTripNotification(id, userId, senderName, 'Expense Updated', `updated the bill/expense: "${expense.item_name}"`);
    } catch (notifErr) {
      console.error('Failed to trigger updateExpense notification:', notifErr);
    }

    res.json({
      id: expense.id,
      tripId: expense.trip_id,
      day: expense.day,
      category: expense.category,
      itemName: expense.item_name,
      plannedAmount: expense.planned_amount,
      actualAmount: expense.actual_amount,
      currency: expense.currency,
      date: expense.date,
      notes: expense.notes,
      paidBy: expense.paid_by
    });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE /api/trips/:id/expenses/:expenseId
 * Delete an expense entry
 */
export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id, expenseId } = req.params;

    // Check trip ownership
    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (tripResult.rows[0].user_id !== userId) {
      const collabCheck = await query(
        `SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND status = 'approved'`,
        [id, userId]
      );
      if (collabCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND trip_id = $2 RETURNING *',
      [expenseId, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const expense = result.rows[0];
    try {
      const userRes = await query('SELECT name FROM users WHERE id = $1', [userId]);
      const senderName = userRes.rows[0]?.name || 'Co-traveler';
      await createTripNotification(id, userId, senderName, 'Expense Deleted', `deleted the bill/expense: "${expense.item_name}"`);
    } catch (notifErr) {
      console.error('Failed to trigger deleteExpense notification:', notifErr);
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * POST /api/trips/:id/budget/insights
 * Trigger Gemini AI budget advice
 */
export const getBudgetInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tripResult = await query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = tripResult.rows[0];
    if (trip.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const expensesResult = await query('SELECT * FROM expenses WHERE trip_id = $1', [id]);
    const expenses = expensesResult.rows;

    const totalBudget = parseFloat(trip.budget) || 0;
    const standardCategories = {
      'Accommodation': 0.35,
      'Food & Dining': 0.25,
      'Activities & Tours': 0.15,
      'Transportation': 0.15,
      'Shopping': 0.10
    };
    const categories = Object.entries(standardCategories).map(([cat, pct]) => ({
      category: cat,
      planned: totalBudget * pct,
      actual: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + parseFloat(e.actual_amount || 0), 0)
    }));

    const insights = await getBudgetInsightsFromGemini(trip, { categories }, expenses);
    res.json({ insights });
  } catch (error) {
    console.error('Get budget insights error:', error);
    res.status(500).json({ message: 'Server error generating insights' });
  }
};

/**
 * POST /api/trips/:id/budget/scan-receipt
 * OCR receipt parser
 */
export const scanReceipt = async (req, res) => {
  try {
    const { fileContent, fileName } = req.body;
    if (!fileContent) {
      return res.status(400).json({ message: 'fileContent (base64) is required' });
    }

    const ocrResult = await scanReceiptWithGemini(fileContent, fileName);
    res.json(ocrResult);
  } catch (error) {
    console.error('Scan receipt error:', error);
    res.status(500).json({ message: 'Server error scanning receipt' });
  }
};
