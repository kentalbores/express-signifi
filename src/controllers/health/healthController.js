const sql = require('../../config/database');

// Basic health check
const healthCheck = async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
};

// Database health check with schema verification
const databaseHealthCheck = async (req, res) => {
    const checks = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: {
            connected: false,
            tables: {},
            environment_variables: {}
        },
        issues: []
    };

    try {
        // 1. Check database connection
        try {
            await sql`SELECT 1 as health_check`;
            checks.database.connected = true;
        } catch (dbError) {
            checks.status = 'unhealthy';
            checks.issues.push({
                type: 'database_connection',
                message: 'Cannot connect to database',
                detail: dbError.message
            });
            return res.status(503).json(checks);
        }

        // 2. Check critical tables exist
        const criticalTables = [
            'useraccount',
            'course',
            'lesson',
            'enrollment',
            'coursemodule'
        ];

        for (const tableName of criticalTables) {
            try {
                const result = await sql`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = ${tableName}
                    ) as exists`;
                
                checks.database.tables[tableName] = {
                    exists: result[0]?.exists || false
                };

                if (!result[0]?.exists) {
                    checks.status = 'degraded';
                    checks.issues.push({
                        type: 'missing_table',
                        message: `Critical table '${tableName}' does not exist`
                    });
                }
            } catch (error) {
                checks.database.tables[tableName] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        // 3. Check optional but important tables
        const optionalTables = [
            'selfstudy_lesson_performance',
            'learning_activity',
            'file_storage'
        ];

        for (const tableName of optionalTables) {
            try {
                const result = await sql`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = ${tableName}
                    ) as exists`;
                
                checks.database.tables[tableName] = {
                    exists: result[0]?.exists || false,
                    optional: true
                };

                if (!result[0]?.exists) {
                    checks.issues.push({
                        type: 'optional_table_missing',
                        severity: 'warning',
                        message: `Optional table '${tableName}' does not exist. Some features may not work.`
                    });
                }
            } catch (error) {
                checks.database.tables[tableName] = {
                    exists: false,
                    optional: true,
                    error: error.message
                };
            }
        }

        // 4. Check specific columns that might be missing
        const columnChecks = [
            { table: 'lesson', column: 'is_active' },
            { table: 'lesson', column: 'material_type' },
            { table: 'lesson', column: 'file_path' },
            { table: 'enrollment', column: 'enrollment_id' }
        ];

        for (const check of columnChecks) {
            try {
                const result = await sql`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = ${check.table}
                        AND column_name = ${check.column}
                    ) as exists`;
                
                if (!checks.database.tables[check.table]) {
                    checks.database.tables[check.table] = { columns: {} };
                }
                if (!checks.database.tables[check.table].columns) {
                    checks.database.tables[check.table].columns = {};
                }
                
                checks.database.tables[check.table].columns[check.column] = {
                    exists: result[0]?.exists || false
                };

                if (!result[0]?.exists) {
                    checks.issues.push({
                        type: 'missing_column',
                        severity: 'warning',
                        message: `Column '${check.column}' is missing from table '${check.table}'`,
                        impact: 'Some queries may fail'
                    });
                }
            } catch (error) {
                if (!checks.database.tables[check.table]) {
                    checks.database.tables[check.table] = { columns: {} };
                }
                if (!checks.database.tables[check.table].columns) {
                    checks.database.tables[check.table].columns = {};
                }
                checks.database.tables[check.table].columns[check.column] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        // 5. Check environment variables
        const requiredEnvVars = ['DATABASE_URL'];
        const optionalEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];

        for (const envVar of requiredEnvVars) {
            checks.database.environment_variables[envVar] = {
                set: !!process.env[envVar],
                required: true
            };

            if (!process.env[envVar]) {
                checks.status = 'unhealthy';
                checks.issues.push({
                    type: 'missing_env_var',
                    severity: 'critical',
                    message: `Required environment variable '${envVar}' is not set`
                });
            }
        }

        for (const envVar of optionalEnvVars) {
            checks.database.environment_variables[envVar] = {
                set: !!process.env[envVar],
                required: false
            };

            if (!process.env[envVar]) {
                checks.issues.push({
                    type: 'missing_env_var',
                    severity: 'info',
                    message: `Optional environment variable '${envVar}' is not set. Related features may not work.`
                });
            }
        }

        // Determine overall status
        if (checks.issues.some(i => i.severity === 'critical' || i.type === 'database_connection')) {
            checks.status = 'unhealthy';
        } else if (checks.issues.length > 0) {
            checks.status = 'degraded';
        }

        const statusCode = checks.status === 'healthy' ? 200 : 
                          checks.status === 'degraded' ? 200 : 503;

        res.status(statusCode).json(checks);

    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = {
    healthCheck,
    databaseHealthCheck
};


