const sql = require('../../config/database');

// Get current user ID from JWT token (set by authenticateToken middleware)

// Profile
async function getLearnerProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT user_id, email, first_name, last_name, created_at FROM useraccount WHERE user_id = ${userId}`;
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const learnerRows = await sql`SELECT total_progress_percentage, status, last_session FROM learner WHERE user_id = ${userId}`;
    res.json({ ...rows[0], ...(learnerRows[0] || {}) });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateLearnerProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const { full_name, first_name, last_name, email } = req.body;
    const updated = await sql`
      UPDATE useraccount SET
        first_name = COALESCE(${first_name || (full_name ? String(full_name).trim().split(/\s+/).shift() : null)}, first_name),
        last_name = COALESCE(${last_name || (full_name ? (String(full_name).trim().split(/\s+/).slice(1).join(' ') || null) : null)}, last_name),
        email = COALESCE(${email}, email)
      WHERE user_id = ${userId}
      RETURNING user_id, email, first_name, last_name, created_at`;
    if (!updated.length) return res.status(404).json({ error: 'Not found' });
    res.json(updated[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLearnerProgress(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT total_progress_percentage, status, last_session FROM learner WHERE user_id = ${userId}`;
    res.json(rows[0] || { total_progress_percentage: 0, status: 'active' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Enrollments
async function listEnrollments(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`
      SELECT e.enrollment_id as enroll_id, e.learner_id, e.course_id, e.status, e.enrolled_at,
             c.title, c.description
      FROM enrollment e
      JOIN course c ON c.course_id = e.course_id
      WHERE e.learner_id = ${userId}
      ORDER BY e.enrolled_at DESC`;
    res.json(rows);
  } catch (e) {
    console.error('Error fetching learner enrollments:', {
      message: e.message,
      code: e.code,
      detail: e.detail,
      table: e.table_name,
      column: e.column_name,
      userId: req.user?.user_id
    });
    res.status(500).json({ 
      error: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}

async function enrollCourse(req, res) {
  try {
    const userId = req.user.user_id;
    const { course_id } = req.body;
    const inserted = await sql`
      INSERT INTO enrollment (learner_id, course_id, status)
      VALUES (${userId}, ${course_id}, 'active')
      ON CONFLICT DO NOTHING
      RETURNING enrollment_id as enroll_id, learner_id, course_id, status, enrolled_at`;
    res.status(201).json(inserted[0] || {});
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getEnrollmentProgress(req, res) {
  try {
    const userId = req.user.user_id;
    const { courseId } = req.params;
    
    // First try to get data from learning_activity table
    let rows = [];
    try {
      rows = await sql`
        SELECT a.user_id as learner_id, l.module_id, a.lesson_id, a.status, a.updated_at
        FROM learning_activity a
        JOIN lesson l ON l.lesson_id = a.lesson_id
        WHERE a.user_id = ${userId} AND l.module_id IN (
          SELECT module_id FROM coursemodule WHERE course_id = ${courseId}
        )`;
    } catch (activityError) {
      console.warn('Error fetching from learning_activity:', {
        message: activityError.message,
        code: activityError.code,
        detail: activityError.detail,
        hint: 'Trying alternative query'
      });
      
      // Fallback: Try to get basic lesson count
      try {
        const lessonCount = await sql`
          SELECT COUNT(*) as total
          FROM lesson l
          JOIN coursemodule cm ON l.module_id = cm.module_id
          WHERE cm.course_id = ${courseId}`;
        
        return res.json({ 
          progress_perc: 0, 
          status: 'not_started',
          total_lessons: parseInt(lessonCount[0]?.total || 0),
          message: 'No activity data available'
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    // naive aggregation demo:
    const progress_perc = rows.length ? Math.min(100, Math.round((rows.filter(r=>r.status==='completed').length / rows.length) * 100)) : 0;
    res.json({ progress_perc, status: progress_perc === 100 ? 'completed' : 'ongoing' });
  } catch (e) {
    console.error('Error fetching enrollment progress:', {
      message: e.message,
      code: e.code,
      detail: e.detail,
      position: e.position,
      table: e.table_name,
      column: e.column_name,
      userId: req.user?.user_id,
      courseId: req.params?.courseId
    });
    res.status(500).json({ 
      error: 'Internal server error',
      detail: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}

// Activity
async function listActivity(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT activity_id, user_id, lesson_id, status, last_accessed FROM learning_activity WHERE user_id = ${userId} ORDER BY last_accessed DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function upsertActivity(req, res) {
  try {
    const userId = req.user.user_id;
    const { lesson_id, status } = req.body;
    const updated = await sql`
      INSERT INTO learning_activity (user_id, lesson_id, status)
      VALUES (${userId}, ${lesson_id}, ${status})
      ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()
      RETURNING activity_id, user_id, lesson_id, status, updated_at`;
    res.status(201).json(updated[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Attempts
async function listAttempts(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT attempt_id, user_id, lesson_id, score, max_score, percentage, completed_at FROM quiz_attempt WHERE user_id = ${userId} ORDER BY completed_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function submitAttempt(req, res) {
  try {
    const userId = req.user.user_id;
    const { lesson_id, score } = req.body;
    // Resolve course and enrollment for this lesson
    const courseRows = await sql`
      SELECT c.course_id
      FROM lesson l
      JOIN coursemodule m ON l.module_id = m.module_id
      JOIN course c ON m.course_id = c.course_id
      WHERE l.lesson_id = ${lesson_id}
      LIMIT 1`;
    if (!courseRows.length) return res.status(400).json({ error: 'Invalid lesson_id' });
    const courseId = courseRows[0].course_id;
    const enrollmentRows = await sql`
      SELECT enrollment_id
      FROM enrollment
      WHERE learner_id = ${userId} AND course_id = ${courseId}
      ORDER BY enrolled_at DESC
      LIMIT 1`;
    if (!enrollmentRows.length) return res.status(400).json({ error: 'User is not enrolled in this course' });
    const enrollmentId = enrollmentRows[0].enrollment_id;
    const rows = await sql`
      INSERT INTO quiz_attempt (user_id, lesson_id, enrollment_id, answers, score, max_score)
      VALUES (${userId}, ${lesson_id}, ${enrollmentId}, '{}'::jsonb, ${score || 0}, ${score || 0})
      RETURNING attempt_id, user_id, lesson_id, score, max_score, percentage, completed_at`;
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Notifications
async function listNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT notification_id, user_id, title, message, action_url as link, is_read, created_at FROM notification WHERE user_id = ${userId} ORDER BY created_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function markAllNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    await sql`UPDATE notification SET is_read = true WHERE user_id = ${userId}`;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function markNotification(req, res) {
  try {
    const userId = req.user.user_id;
    const { notificationId } = req.params;
    await sql`UPDATE notification SET is_read = true WHERE user_id = ${userId} AND notification_id = ${notificationId}`;
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Minigames
async function listMinigameAttempts(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT attempt_id as game_attempt_id, user_id, game_id, score, played_at FROM game_attempt WHERE user_id = ${userId} ORDER BY played_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function submitMinigameAttempt(req, res) {
  try {
    const userId = req.user.user_id;
    const { game_id, score } = req.body;
    const rows = await sql`INSERT INTO game_attempt (user_id, game_id, score) VALUES (${userId}, ${game_id}, ${score || 0}) RETURNING attempt_id as game_attempt_id, user_id, game_id, score, played_at`;
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// CRUD operations for learner management
async function createLearner(req, res) {
  try {
    const {
      user_id,
      student_id,
      status = 'active',
      preferred_learning_style
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const result = await sql`
      INSERT INTO learner (
        user_id, student_id, status, preferred_learning_style
      )
      VALUES (
        ${user_id}, ${student_id}, ${status}, ${preferred_learning_style}
      )
      RETURNING *
    `;

    res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error creating learner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function getAllLearners(req, res) {
  try {
    const { status, student_id } = req.query;
    
    let query = sql`
      SELECT l.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
             u.created_at as user_created_at
      FROM learner l
      JOIN useraccount u ON l.user_id = u.user_id
      WHERE 1=1
    `;
    
    if (status) {
      query = sql`
        SELECT l.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
               u.created_at as user_created_at
        FROM learner l
        JOIN useraccount u ON l.user_id = u.user_id
        WHERE l.status = ${status}
      `;
    }
    
    if (student_id) {
      query = sql`
        SELECT l.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
               u.created_at as user_created_at
        FROM learner l
        JOIN useraccount u ON l.user_id = u.user_id
        WHERE l.student_id = ${student_id}
      `;
    }

    query = sql`${query} ORDER BY l.created_at DESC`;

    const result = await query;

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching learners:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function getLearnerById(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      SELECT l.*, u.first_name, u.last_name, u.email, u.profile_picture_url,
             u.created_at as user_created_at
      FROM learner l
      JOIN useraccount u ON l.user_id = u.user_id
      WHERE l.user_id = ${id}
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error fetching learner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function updateLearner(req, res) {
  try {
    const { id } = req.params;
    const {
      student_id,
      status,
      learning_streak,
      total_points,
      level,
      preferred_learning_style
    } = req.body;

    const updates = [];

    if (student_id !== undefined) {
      updates.push(sql`student_id = ${student_id}`);
    }
    if (status !== undefined) {
      updates.push(sql`status = ${status}`);
    }
    if (learning_streak !== undefined) {
      updates.push(sql`learning_streak = ${learning_streak}`);
    }
    if (total_points !== undefined) {
      updates.push(sql`total_points = ${total_points}`);
    }
    if (level !== undefined) {
      updates.push(sql`level = ${level}`);
    }
    if (preferred_learning_style !== undefined) {
      updates.push(sql`preferred_learning_style = ${preferred_learning_style}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    const result = await sql`
      UPDATE learner 
      SET ${sql(updates, ', ')}
      WHERE user_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Error updating learner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function deleteLearner(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM learner 
      WHERE user_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Learner not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Learner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting learner:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

module.exports = {
  // CRUD operations
  createLearner,
  getAllLearners,
  getLearnerById,
  updateLearner,
  deleteLearner,
  // User-specific operations
  getLearnerProfile,
  updateLearnerProfile,
  getLearnerProgress,
  listEnrollments,
  enrollCourse,
  getEnrollmentProgress,
  listActivity,
  upsertActivity,
  listAttempts,
  submitAttempt,
  listNotifications,
  markAllNotifications,
  markNotification,
  listMinigameAttempts,
  submitMinigameAttempt,
};


