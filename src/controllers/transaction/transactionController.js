const sql = require('../../config/database');

// Create transaction (transaction_id must equal an existing enrollment.enroll_id)
const createTransaction = async (req, res) => {
    try {
        const { enroll_id, method, amount, status } = req.body;
        if (!enroll_id || isNaN(enroll_id)) {
            return res.status(400).json({ error: 'Missing required field: enroll_id must be a number and reference an existing enrollment' });
        }
        const result = await sql`
            INSERT INTO "transaction" (transaction_id, method, amount, status)
            VALUES (${enroll_id}, ${method || null}, ${amount || null}, ${status || 'pending'})
            RETURNING transaction_id, method, amount, status, created_at
        `;
        res.status(201).json({ message: 'Transaction created successfully', transaction: result[0] });
    } catch (error) {
        console.error('Error creating transaction:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'Invalid enroll_id: enrollment does not exist' });
        }
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Transaction for this enrollment already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

// List transactions (optionally by status)
const getAllTransactions = async (req, res) => {
    try {
        const { status } = req.query;
        
        let transactions;
        if (status) {
            transactions = await sql`
                SELECT transaction_id, method, amount, status, created_at 
                FROM "transaction"
                WHERE status = ${status}
                ORDER BY created_at DESC
            `;
        } else {
            transactions = await sql`
                SELECT transaction_id, method, amount, status, created_at 
                FROM "transaction"
                ORDER BY created_at DESC
            `;
        }
        
        res.status(200).json({ message: 'Transactions retrieved successfully', transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get by ID
const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid transaction ID' });
        const result = await sql`SELECT transaction_id, method, amount, status, created_at FROM "transaction" WHERE transaction_id = ${id}`;
        if (result.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.status(200).json({ message: 'Transaction retrieved successfully', transaction: result[0] });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update transaction (cannot change transaction_id)
const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { method, amount, status } = req.body;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid transaction ID' });
        const current = await sql`SELECT method, amount, status FROM "transaction" WHERE transaction_id = ${id}`;
        if (current.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        const updatedMethod = method !== undefined ? method : current[0].method;
        const updatedAmount = amount !== undefined ? amount : current[0].amount;
        const updatedStatus = status !== undefined ? status : current[0].status;
        const result = await sql`
            UPDATE "transaction" SET method = ${updatedMethod}, amount = ${updatedAmount}, status = ${updatedStatus}
            WHERE transaction_id = ${id}
            RETURNING transaction_id, method, amount, status, created_at
        `;
        res.status(200).json({ message: 'Transaction updated successfully', transaction: result[0] });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(id)) return res.status(400).json({ error: 'Invalid transaction ID' });
        const result = await sql`DELETE FROM "transaction" WHERE transaction_id = ${id} RETURNING transaction_id`;
        if (result.length === 0) return res.status(404).json({ error: 'Transaction not found' });
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction
};


