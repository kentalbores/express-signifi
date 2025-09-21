const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
console.log("connectionString", connectionString);

if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable. Please check your .env file.');
    console.log("connectionString", connectionString);  
}

// Options:
// - Enforce SSL for managed providers like Supabase
// - Allow disabling prepared statements when using a transaction pooler (which doesn't support PREPARE)
const sql = postgres(connectionString, {
	ssl: 'require',
	prepare: process.env.PG_PREPARE === 'false' ? false : true
});

module.exports = sql;