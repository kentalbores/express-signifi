const postgres = require('postgres');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable. Please check your .env file.');
}

const sql = postgres(connectionString);

module.exports = sql;