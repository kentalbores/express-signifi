const sql = require('../../config/database');

// Get current user ID from JWT token (set by authenticateToken middleware)

// Profile
async function getLearnerProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT user_id, email, full_name, created_at FROM useraccount WHERE user_id = ${userId}`;
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const learnerRows = await sql`SELECT progress_perc, status, last_session FROM learner WHERE id = ${userId}`;
    res.json({ ...rows[0], ...(learnerRows[0] || {}) });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateLearnerProfile(req, res) {
  try {
    const userId = req.user.user_id;
    const { full_name, email } = req.body;
    const updated = await sql`
      UPDATE useraccount SET
        full_name = COALESCE(${full_name}, full_name),
        email = COALESCE(${email}, email)
      WHERE user_id = ${userId}
      RETURNING user_id, email, full_name, created_at`;
    if (!updated.length) return res.status(404).json({ error: 'Not found' });
    res.json(updated[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getLearnerProgress(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT progress_perc, status, last_session FROM learner WHERE id = ${userId}`;
    res.json(rows[0] || { progress_perc: 0, status: 'new' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Enrollments
async function listEnrollments(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`
      SELECT e.enroll_id, e.learner_id, e.course_id, e.status, e.enrolled_at,
             c.title, c.description
      FROM enrollment e
      JOIN course c ON c.course_id = e.course_id
      WHERE e.learner_id = ${userId}
      ORDER BY e.enrolled_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function enrollCourse(req, res) {
  try {
    const userId = req.user.user_id;
    const { course_id } = req.body;
    const inserted = await sql`
      INSERT INTO enrollment (learner_id, course_id, status)
      VALUES (${userId}, ${course_id}, 'ongoing')
      ON CONFLICT DO NOTHING
      RETURNING enroll_id, learner_id, course_id, status, enrolled_at`;
    res.status(201).json(inserted[0] || {});
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getEnrollmentProgress(req, res) {
  try {
    const userId = req.user.user_id;
    const { courseId } = req.params;
    const rows = await sql`
      SELECT a.user_id as learner_id, l.module_id, a.lesson_id, a.status, a.updated_at
      FROM activity a
      JOIN lesson l ON l.lesson_id = a.lesson_id
      WHERE a.user_id = ${userId} AND l.module_id IN (
        SELECT module_id FROM coursemodule WHERE course_id = ${courseId}
      )`;
    // naive aggregation demo:
    const progress_perc = rows.length ? Math.min(100, Math.round((rows.filter(r=>r.status==='completed').length / rows.length) * 100)) : 0;
    res.json({ progress_perc, status: progress_perc === 100 ? 'completed' : 'ongoing' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Activity
async function listActivity(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT activity_id, user_id, lesson_id, status, updated_at FROM activity WHERE user_id = ${userId} ORDER BY updated_at DESC`;
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
      INSERT INTO activity (user_id, lesson_id, status)
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
    const rows = await sql`SELECT attempt_id, user_id, lesson_id, score, completed_at FROM attempt WHERE user_id = ${userId} ORDER BY completed_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function submitAttempt(req, res) {
  try {
    const userId = req.user.user_id;
    const { lesson_id, score } = req.body;
    const rows = await sql`
      INSERT INTO attempt (user_id, lesson_id, score)
      VALUES (${userId}, ${lesson_id}, ${score})
      RETURNING attempt_id, user_id, lesson_id, score, completed_at`;
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Notifications
async function listNotifications(req, res) {
  try {
    const userId = req.user.user_id;
    const rows = await sql`SELECT notification_id, user_id, title, message, link, is_read, created_at FROM notification WHERE user_id = ${userId} ORDER BY created_at DESC`;
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
    const rows = await sql`SELECT game_attempt_id, user_id, game_id, score, played_at FROM gameattempt WHERE user_id = ${userId} ORDER BY played_at DESC`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function submitMinigameAttempt(req, res) {
  try {
    const userId = req.user.user_id;
    const { game_id, score } = req.body;
    const rows = await sql`INSERT INTO gameattempt (user_id, game_id, score) VALUES (${userId}, ${game_id}, ${score}) RETURNING game_attempt_id, user_id, game_id, score, played_at`;
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
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


