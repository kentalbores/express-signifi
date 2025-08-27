const express = require('express');
const router = express.Router();
const {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
} = require('../../controllers/transaction/transactionController');

// Transaction routes
router.post('/', createTransaction);                 // POST /api/transactions
router.get('/', getAllTransactions);                 // GET /api/transactions
router.get('/:id', getTransactionById);              // GET /api/transactions/:id
router.put('/:id', updateTransaction);               // PUT /api/transactions/:id
router.delete('/:id', deleteTransaction);            // DELETE /api/transactions/:id

module.exports = router;


