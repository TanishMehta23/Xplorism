import express from 'express';
import { getBudgetOverview, createExpense, updateExpense, deleteExpense } from '../controllers/budgetController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all budget endpoints
router.use(authMiddleware);

// Budget overview for a specific trip
router.get('/:id/budget', getBudgetOverview);

// CRUD for expenses within a trip
router.post('/:id/expenses', createExpense);
router.put('/:id/expenses/:expenseId', updateExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);

export default router;
