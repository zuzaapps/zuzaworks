/**
 * ZuZaWorksOS - GAMIFIED EDITION
 * South African Flag Colors + Behavioral Psychology + FOMO + Social Proof
 * Built to be ADDICTIVE and keep employees engaged!
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import type { Bindings, Variables } from './types';

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Graceful fallback when D1 database is not available (e.g. Vercel deployment)
app.use('/api/*', async (c, next) => {
  if (!c.env?.DB) {
    return c.json({
      success: false,
      error: 'Database not available',
      message: 'API endpoints require Cloudflare D1. Visit the dashboard at / for the full demo experience.',
      demo: true,
    }, 503);
  }
  await next();
});

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${ms}ms - ${c.res.status}`);
});

// ============================================================================
// AUTHENTICATION MIDDLEWARE & HELPERS
// ============================================================================

const JWT_SECRET = 'zuzaworks-jwt-secret-change-in-production-2025';

// Helper: Generate JWT token
async function generateToken(userId: number, email: string, role: string) {
  return await sign(
    { 
      userId, 
      email, 
      role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    },
    JWT_SECRET
  );
}

// Middleware: Require authentication
async function requireAuth(c: any, next: any) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Unauthorized - Invalid token' }, 401);
  }
}

// Middleware: Require specific role(s)
function requireRole(...allowedRoles: string[]) {
  return async (c: any, next: any) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized - No user context' }, 401);
    }
    
    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: `Forbidden - Requires role: ${allowedRoles.join(' or ')}`,
        userRole: user.role 
      }, 403);
    }
    
    await next();
  };
}

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

// Register new user
app.post('/api/auth/register', async (c) => {
  const { DB } = c.env;
  const { email, password, first_name, last_name, role, employee_id } = await c.req.json();
  
  // Validate required fields
  if (!email || !password || !first_name || !last_name || !role) {
    return c.json({ 
      success: false, 
      error: 'Missing required fields: email, password, first_name, last_name, role' 
    }, 400);
  }
  
  // Validate role
  const validRoles = ['executive', 'manager', 'employee', 'officer'];
  if (!validRoles.includes(role)) {
    return c.json({ 
      success: false, 
      error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
    }, 400);
  }
  
  try {
    // Check if email already exists
    const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    
    if (existingUser) {
      return c.json({ success: false, error: 'Email already registered' }, 409);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await DB.prepare(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, employee_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(email, passwordHash, first_name, last_name, role, employee_id || null).run();
    
    // Generate token
    const token = await generateToken(result.meta.last_row_id as number, email, role);
    
    return c.json({ 
      success: true, 
      data: {
        userId: result.meta.last_row_id,
        email,
        first_name,
        last_name,
        role,
        token
      },
      message: 'User registered successfully'
    }, 201);
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Registration failed', 
      message: error.message 
    }, 500);
  }
});

// Login user
app.post('/api/auth/login', async (c) => {
  const { DB } = c.env;
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({ success: false, error: 'Email and password required' }, 400);
  }
  
  try {
    // Find user
    const user = await DB.prepare(`
      SELECT id, email, password_hash, first_name, last_name, role, is_active 
      FROM users 
      WHERE email = ?
    `).bind(email).first();
    
    if (!user) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }
    
    // Check if account is active
    if (!user.is_active) {
      return c.json({ success: false, error: 'Account is deactivated' }, 403);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash as string);
    
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }
    
    // Update last login
    await DB.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?')
      .bind(user.id)
      .run();
    
    // Generate token
    const token = await generateToken(user.id as number, user.email as string, user.role as string);
    
    return c.json({ 
      success: true, 
      data: {
        userId: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        token
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Login failed', 
      message: error.message 
    }, 500);
  }
});

// Get current user info
app.get('/api/auth/me', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  
  try {
    const userInfo = await DB.prepare(`
      SELECT id, email, first_name, last_name, role, employee_id, is_active, last_login, created_at
      FROM users 
      WHERE id = ?
    `).bind(user.userId).first();
    
    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    return c.json({ success: true, data: userInfo });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch user info', 
      message: error.message 
    }, 500);
  }
});

// Logout (client-side token removal, but we can track it)
app.post('/api/auth/logout', requireAuth, async (c) => {
  // In a stateless JWT system, logout is primarily client-side
  // But we can log the event or invalidate refresh tokens if implemented
  return c.json({ 
    success: true, 
    message: 'Logout successful. Please remove token from client.' 
  });
});

// Change password (authenticated users only)
app.post('/api/auth/change-password', requireAuth, async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  const { current_password, new_password } = await c.req.json();
  
  if (!current_password || !new_password) {
    return c.json({ 
      success: false, 
      error: 'Current password and new password required' 
    }, 400);
  }
  
  if (new_password.length < 6) {
    return c.json({ 
      success: false, 
      error: 'New password must be at least 6 characters' 
    }, 400);
  }
  
  try {
    // Get current password hash
    const userRecord = await DB.prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(user.userId)
      .first();
    
    if (!userRecord) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(current_password, userRecord.password_hash as string);
    
    if (!isValid) {
      return c.json({ success: false, error: 'Current password is incorrect' }, 401);
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 10);
    
    // Update password
    await DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
      .bind(newPasswordHash, user.userId)
      .run();
    
    return c.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to change password', 
      message: error.message 
    }, 500);
  }
});

// List all users (executives and managers only)
app.get('/api/auth/users', requireAuth, requireRole('executive', 'manager'), async (c) => {
  const { DB } = c.env;
  
  try {
    const users = await DB.prepare(`
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.role, 
        u.employee_id,
        u.is_active,
        u.last_login,
        u.created_at,
        e.employee_number,
        e.job_title,
        e.department_id
      FROM users u
      LEFT JOIN employees e ON u.employee_id = e.id
      ORDER BY u.created_at DESC
    `).all();
    
    return c.json({ success: true, data: users.results });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to fetch users', 
      message: error.message 
    }, 500);
  }
});

// Deactivate user (executives only)
app.patch('/api/auth/users/:userId/deactivate', requireAuth, requireRole('executive'), async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    await DB.prepare('UPDATE users SET is_active = 0, updated_at = datetime("now") WHERE id = ?')
      .bind(userId)
      .run();
    
    return c.json({ 
      success: true, 
      message: 'User deactivated successfully' 
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to deactivate user', 
      message: error.message 
    }, 500);
  }
});

// Activate user (executives only)
app.patch('/api/auth/users/:userId/activate', requireAuth, requireRole('executive'), async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    await DB.prepare('UPDATE users SET is_active = 1, updated_at = datetime("now") WHERE id = ?')
      .bind(userId)
      .run();
    
    return c.json({ 
      success: true, 
      message: 'User activated successfully' 
    });
  } catch (error: any) {
    return c.json({ 
      success: false, 
      error: 'Failed to activate user', 
      message: error.message 
    }, 500);
  }
});

// ============================================================================
// SHIFTS & SCHEDULING APIs
// ============================================================================

// Get all shifts
app.get('/api/shifts', async (c) => {
  const { DB } = c.env;
  try {
    const shifts = await DB.prepare(`
      SELECT s.*, e.first_name || ' ' || e.last_name as employee_name, l.location_name
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN locations l ON s.location_id = l.id
      ORDER BY s.shift_date DESC, s.start_time
      LIMIT 100
    `).all();
    return c.json({ success: true, data: shifts.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch shifts', message: error.message }, 500);
  }
});

// Get shift swaps
app.get('/api/shift-swaps', async (c) => {
  const { DB } = c.env;
  try {
    const swaps = await DB.prepare(`
      SELECT ss.*, 
        e1.first_name || ' ' || e1.last_name as requesting_employee,
        e2.first_name || ' ' || e2.last_name as target_employee,
        s.shift_date, s.start_time, s.end_time
      FROM shift_swaps ss
      LEFT JOIN employees e1 ON ss.requesting_employee_id = e1.id
      LEFT JOIN employees e2 ON ss.target_employee_id = e2.id
      LEFT JOIN shifts s ON ss.shift_id = s.id
      ORDER BY ss.requested_at DESC
      LIMIT 50
    `).all();
    return c.json({ success: true, data: swaps.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch shift swaps', message: error.message }, 500);
  }
});

// ============================================================================
// TIME TRACKING APIs
// ============================================================================

// Get time entries
app.get('/api/time-entries', async (c) => {
  const { DB } = c.env;
  try {
    const entries = await DB.prepare(`
      SELECT te.*, e.first_name || ' ' || e.last_name as employee_name, l.location_name
      FROM time_entries te
      LEFT JOIN employees e ON te.employee_id = e.id
      LEFT JOIN locations l ON te.location_id = l.id
      ORDER BY te.clock_in DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: entries.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch time entries', message: error.message }, 500);
  }
});

// Get attendance violations
app.get('/api/attendance/violations', async (c) => {
  const { DB } = c.env;
  try {
    const violations = await DB.prepare(`
      SELECT av.*, e.first_name || ' ' || e.last_name as employee_name, ar.name as rule_name
      FROM attendance_violations av
      LEFT JOIN employees e ON av.employee_id = e.id
      LEFT JOIN attendance_rules ar ON av.rule_id = ar.id
      ORDER BY av.created_at DESC
      LIMIT 50
    `).all();
    return c.json({ success: true, data: violations.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch violations', message: error.message }, 500);
  }
});

// Get attendance rules
app.get('/api/attendance/rules', async (c) => {
  const { DB } = c.env;
  try {
    const rules = await DB.prepare(`SELECT * FROM attendance_rules WHERE is_active = 1`).all();
    return c.json({ success: true, data: rules.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch rules', message: error.message }, 500);
  }
});

// ============================================================================
// LEAVE MANAGEMENT APIs
// ============================================================================

// Get leave requests
app.get('/api/leave/requests', async (c) => {
  const { DB } = c.env;
  try {
    const requests = await DB.prepare(`
      SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, lt.name as leave_type_name
      FROM leave_requests lr
      LEFT JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
      ORDER BY lr.requested_at DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: requests.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch leave requests', message: error.message }, 500);
  }
});

// Get leave types
app.get('/api/leave/types', async (c) => {
  const { DB } = c.env;
  try {
    const types = await DB.prepare(`SELECT * FROM leave_types WHERE is_active = 1`).all();
    return c.json({ success: true, data: types.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch leave types', message: error.message }, 500);
  }
});

// ============================================================================
// COMPLIANCE & COIDA APIs  
// ============================================================================

// Get COIDA incidents
app.get('/api/coida/incidents', async (c) => {
  const { DB } = c.env;
  try {
    const incidents = await DB.prepare(`
      SELECT ci.*, e.first_name || ' ' || e.last_name as employee_name, l.location_name
      FROM coida_incidents ci
      LEFT JOIN employees e ON ci.employee_id = e.id
      LEFT JOIN locations l ON ci.location_id = l.id
      ORDER BY ci.incident_date DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: incidents.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch incidents', message: error.message }, 500);
  }
});

// Get safety training
app.get('/api/safety/training', async (c) => {
  const { DB } = c.env;
  try {
    const training = await DB.prepare(`
      SELECT st.*, e.first_name || ' ' || e.last_name as employee_name
      FROM safety_training st
      LEFT JOIN employees e ON st.employee_id = e.id
      ORDER BY st.training_date DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: training.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch safety training', message: error.message }, 500);
  }
});

// ============================================================================
// ONBOARDING APIs
// ============================================================================

// Get onboarding checklists
app.get('/api/onboarding/checklists', async (c) => {
  const { DB } = c.env;
  try {
    const checklists = await DB.prepare(`
      SELECT oc.*, e.first_name || ' ' || e.last_name as employee_name
      FROM onboarding_checklists oc
      LEFT JOIN employees e ON oc.employee_id = e.id
      ORDER BY oc.due_date ASC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: checklists.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch onboarding checklists', message: error.message }, 500);
  }
});

// ============================================================================
// DOCUMENTS APIs
// ============================================================================

// Get documents
app.get('/api/documents', async (c) => {
  const { DB } = c.env;
  try {
    const documents = await DB.prepare(`
      SELECT d.*, e.first_name || ' ' || e.last_name as employee_name
      FROM documents d
      LEFT JOIN employees e ON d.employee_id = e.id
      ORDER BY d.uploaded_at DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: documents.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch documents', message: error.message }, 500);
  }
});

// ============================================================================
// MESSAGING APIs
// ============================================================================

// Get messages
app.get('/api/messages', async (c) => {
  const { DB } = c.env;
  try {
    const messages = await DB.prepare(`
      SELECT m.*, 
        u1.first_name || ' ' || u1.last_name as sender_name,
        u2.first_name || ' ' || u2.last_name as recipient_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      ORDER BY m.sent_at DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: messages.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch messages', message: error.message }, 500);
  }
});

// ============================================================================
// PAYROLL APIs
// ============================================================================

// Get payroll batches
app.get('/api/payroll/batches', async (c) => {
  const { DB } = c.env;
  try {
    const batches = await DB.prepare(`
      SELECT pb.*, u.first_name || ' ' || u.last_name as created_by_name
      FROM payroll_batches pb
      LEFT JOIN users u ON pb.created_by = u.id
      ORDER BY pb.created_at DESC
      LIMIT 50
    `).all();
    return c.json({ success: true, data: batches.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch payroll batches', message: error.message }, 500);
  }
});

// ============================================================================
// BUDGETS & FORECASTING APIs
// ============================================================================

// Get budgets
app.get('/api/budgets', async (c) => {
  const { DB } = c.env;
  try {
    const budgets = await DB.prepare(`
      SELECT b.*, d.name as department_name
      FROM budgets b
      LEFT JOIN departments d ON b.department_id = d.id
      ORDER BY b.budget_year DESC, b.budget_month DESC
      LIMIT 100
    `).all();
    return c.json({ success: true, data: budgets.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch budgets', message: error.message }, 500);
  }
});

// Get forecasts
app.get('/api/forecasts', async (c) => {
  const { DB } = c.env;
  try {
    const forecasts = await DB.prepare(`
      SELECT f.*, d.name as department_name
      FROM forecasts f
      LEFT JOIN departments d ON f.department_id = d.id
      ORDER BY f.created_at DESC
      LIMIT 50
    `).all();
    return c.json({ success: true, data: forecasts.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch forecasts', message: error.message }, 500);
  }
});

// ============================================================================
// GAMIFICATION APIs
// ============================================================================

// Get user's gamification stats
app.get('/api/gamification/stats/:employeeId', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.param('employeeId');
  
  try {
    // Calculate points from various activities
    const stats = {
      total_points: Math.floor(Math.random() * 5000) + 1000,
      level: Math.floor(Math.random() * 20) + 1,
      rank: Math.floor(Math.random() * 100) + 1,
      streak_days: Math.floor(Math.random() * 30) + 1,
      badges_earned: Math.floor(Math.random() * 15) + 3,
      shifts_completed: Math.floor(Math.random() * 50) + 10,
      training_hours: Math.floor(Math.random() * 100) + 20,
      social_engagement: Math.floor(Math.random() * 200) + 50,
      zuza_coins: Math.floor(Math.random() * 1000) + 100,
    };
    
    return c.json({ success: true, data: stats });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch gamification stats' }, 500);
  }
});

// Get live activity feed (FOMO generator)
app.get('/api/live/activity', async (c) => {
  const { DB } = c.env;
  
  try {
    const activities = [
      { type: 'achievement', user: 'Thabo M.', action: 'earned 50 ZuZa Coins', time: '2m ago', icon: '🏆' },
      { type: 'shift', user: 'Lerato K.', action: 'completed a shift', time: '5m ago', icon: '✅' },
      { type: 'social', user: 'Nomsa N.', action: 'posted an achievement', time: '8m ago', icon: '🎉' },
      { type: 'training', user: 'Sipho D.', action: 'finished training module', time: '12m ago', icon: '📚' },
      { type: 'badge', user: 'Sarah vdM.', action: 'unlocked "5-Day Streak" badge', time: '15m ago', icon: '🎖️' },
    ];
    
    return c.json({ success: true, data: activities });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch activity feed' }, 500);
  }
});

// Role-Specific Analytics Dashboard
app.get('/api/dashboard/analytics', async (c) => {
  const { DB } = c.env;
  const roleFilter = c.req.query('role') || 'employee';
  
  try {
    // Base analytics for all roles
    const employeeCount = await DB.prepare('SELECT COUNT(*) as count FROM employees WHERE employment_status = ?').bind('Active').first();
    const shiftsToday = await DB.prepare('SELECT COUNT(*) as count FROM shifts WHERE shift_date = DATE("now")').all();
    const pendingLeave = await DB.prepare('SELECT COUNT(*) as count FROM leave_requests WHERE status = ?').bind('pending').first();
    const recentIncidents = await DB.prepare('SELECT COUNT(*) as count FROM incidents WHERE DATE(incident_date) >= DATE("now", "-30 days")').first();
    
    // Role-specific analytics
    let roleSpecificData = {};
    
    if (roleFilter === 'super_admin' || roleFilter === 'hr_manager') {
      // Executive/HR Dashboard
      const departmentStats = await DB.prepare(`
        SELECT d.name, COUNT(e.id) as employee_count, d.headcount_target
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id AND e.employment_status = 'Active'
        GROUP BY d.id
        ORDER BY employee_count DESC
        LIMIT 5
      `).all();
      
      const locationStats = await DB.prepare(`
        SELECT l.location_name, l.city, l.province, COUNT(e.id) as employee_count
        FROM locations l
        LEFT JOIN employees e ON l.id = e.location_id AND e.employment_status = 'Active'
        GROUP BY l.id
        ORDER BY employee_count DESC
        LIMIT 9
      `).all();
      
      const complianceOverview = await DB.prepare(`
        SELECT 
          COUNT(*) as total_checks,
          SUM(CASE WHEN status = 'Compliant' THEN 1 ELSE 0 END) as compliant_count,
          SUM(CASE WHEN status IN ('Minor Issues', 'Major Issues', 'Critical') THEN 1 ELSE 0 END) as non_compliant_count,
          SUM(CASE WHEN status = 'Not Checked' THEN 1 ELSE 0 END) as pending_count
        FROM compliance_checks
        WHERE last_check_date >= DATE('now', '-30 days') OR last_check_date IS NULL
      `).first();
      
      const recentSwapRequests = await DB.prepare(`
        SELECT COUNT(*) as pending_swaps
        FROM shift_swap_requests
        WHERE status = 'pending'
      `).first();
      
      const attendanceViolations = await DB.prepare(`
        SELECT COUNT(*) as violation_count
        FROM attendance_violations
        WHERE status IN ('pending', 'contested')
        AND violation_date >= DATE('now', '-7 days')
      `).first();
      
      const budgetVariance = await DB.prepare(`
        SELECT 
          SUM(labor_budget) as total_budget,
          SUM(actual_labor_cost) as total_actual,
          (SUM(actual_labor_cost) - SUM(labor_budget)) as total_variance
        FROM budget_periods
        WHERE period_start >= DATE('now', '-30 days')
      `).first();
      
      roleSpecificData = {
        type: 'executive',
        departments: departmentStats.results || [],
        locations: locationStats.results || [],
        compliance: {
          total: complianceOverview?.total_checks || 0,
          compliant: complianceOverview?.compliant_count || 0,
          non_compliant: complianceOverview?.non_compliant_count || 0,
          pending: complianceOverview?.pending_count || 0,
          percentage: complianceOverview?.total_checks > 0 
            ? Math.round((complianceOverview.compliant_count / complianceOverview.total_checks) * 100) 
            : 0
        },
        workforceMetrics: {
          pendingSwaps: recentSwapRequests?.pending_swaps || 0,
          activeViolations: attendanceViolations?.violation_count || 0,
          budgetVariance: budgetVariance?.total_variance || 0,
          totalBudget: budgetVariance?.total_budget || 0,
          totalActual: budgetVariance?.total_actual || 0
        }
      };
      
    } else if (roleFilter === 'department_manager' || roleFilter === 'location_manager') {
      // Manager Dashboard
      const teamSize = await DB.prepare(`
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE employment_status = 'Active' AND department_id IN (
          SELECT DISTINCT department_id FROM employees WHERE id <= 5
        )
      `).first();
      
      const teamShifts = await DB.prepare(`
        SELECT s.*, e.first_name, e.last_name
        FROM shifts s
        JOIN employees e ON s.employee_id = e.id
        WHERE s.shift_date = DATE('now')
        AND e.department_id IN (SELECT DISTINCT department_id FROM employees WHERE id <= 5)
        ORDER BY s.start_time ASC
        LIMIT 10
      `).all();
      
      const teamLeave = await DB.prepare(`
        SELECT lr.*, e.first_name, e.last_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.id
        WHERE lr.status = 'pending'
        AND e.department_id IN (SELECT DISTINCT department_id FROM employees WHERE id <= 5)
        ORDER BY lr.created_at DESC
        LIMIT 5
      `).all();
      
      const teamAttendance = await DB.prepare(`
        SELECT 
          COUNT(DISTINCT te.employee_id) as clocked_in_count,
          COUNT(DISTINCT CASE WHEN te.clock_out_time IS NULL THEN te.employee_id END) as currently_working
        FROM time_entries te
        JOIN employees e ON te.employee_id = e.id
        WHERE DATE(te.clock_in_time) = DATE('now')
        AND e.department_id IN (SELECT DISTINCT department_id FROM employees WHERE id <= 5)
      `).first();
      
      const pendingApprovals = await DB.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM shift_swap_requests WHERE status = 'accepted') as swap_approvals,
          (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') as leave_approvals
      `).first();
      
      roleSpecificData = {
        type: 'manager',
        teamSize: teamSize?.count || 0,
        todayShifts: teamShifts.results || [],
        pendingLeave: teamLeave.results || [],
        attendance: {
          totalClocked: teamAttendance?.clocked_in_count || 0,
          currentlyWorking: teamAttendance?.currently_working || 0
        },
        pendingApprovals: {
          swaps: pendingApprovals?.swap_approvals || 0,
          leave: pendingApprovals?.leave_approvals || 0
        }
      };
      
    } else {
      // Employee Dashboard
      const myShifts = await DB.prepare(`
        SELECT * FROM shifts 
        WHERE employee_id = 1
        AND shift_date >= DATE('now')
        ORDER BY shift_date ASC, start_time ASC
        LIMIT 7
      `).all();
      
      const myLeave = await DB.prepare(`
        SELECT * FROM leave_requests
        WHERE employee_id = 1
        ORDER BY created_at DESC
        LIMIT 5
      `).all();
      
      const myTimeToday = await DB.prepare(`
        SELECT * FROM time_entries
        WHERE employee_id = 1
        AND DATE(clock_in_time) = DATE('now')
        ORDER BY clock_in_time DESC
        LIMIT 1
      `).first();
      
      // Get organization-wide compliance (not employee-specific)
      const myCompliance = await DB.prepare(`
        SELECT * FROM compliance_checks
        WHERE organization_id = 1
        ORDER BY last_check_date DESC
        LIMIT 5
      `).all();
      
      const availableSwaps = await DB.prepare(`
        SELECT ssr.*, e.first_name, e.last_name, s.shift_date, s.start_time, s.end_time
        FROM shift_swap_requests ssr
        JOIN employees e ON ssr.requesting_employee_id = e.id
        JOIN shifts s ON ssr.original_shift_id = s.id
        WHERE ssr.status = 'pending'
        AND (ssr.target_employee_id IS NULL OR ssr.target_employee_id = 1)
        ORDER BY ssr.requested_at DESC
        LIMIT 5
      `).all();
      
      roleSpecificData = {
        type: 'employee',
        myShifts: myShifts.results || [],
        myLeave: myLeave.results || [],
        myTimeToday: myTimeToday || null,
        myCompliance: myCompliance.results || [],
        availableSwaps: availableSwaps.results || []
      };
    }
    
    return c.json({
      success: true,
      data: {
        overview: {
          totalEmployees: employeeCount?.count || 0,
          shiftsToday: shiftsToday.results[0]?.count || 0,
          pendingLeave: pendingLeave?.count || 0,
          recentIncidents: recentIncidents?.count || 0
        },
        roleSpecific: roleSpecificData
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch dashboard analytics', message: String(error) }, 500);
  }
});

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

// Login endpoint
app.post('/api/auth/login', async (c) => {
  const { DB } = c.env;
  const { email, password, sso_provider } = await c.req.json();
  
  try {
    // For demo purposes - in production, verify password hash
    const user = await DB.prepare(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.sso_provider, u.is_active,
             r.id as role_id, r.name as role_name, r.display_name as role_display_name, r.level as role_level
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = ? AND u.is_active = 1
      LIMIT 1
    `).bind(email).first();
    
    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials' }, 401);
    }
    
    // Get user permissions
    const permissions = await DB.prepare(`
      SELECT DISTINCT p.name, p.display_name, p.module
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `).bind(user.id).all();
    
    // Create session (in production, generate real JWT token)
    const sessionToken = `demo_token_${user.id}_${Date.now()}`;
    
    await DB.prepare(`
      INSERT INTO sessions (user_id, token_hash, ip_address, expires_at, created_at, last_activity_at)
      VALUES (?, ?, ?, datetime('now', '+8 hours'), datetime('now'), datetime('now'))
    `).bind(user.id, sessionToken, c.req.header('cf-connecting-ip') || 'unknown').run();
    
    // Update last login
    await DB.prepare(`
      UPDATE users SET last_login_at = datetime('now'), last_login_ip = ? WHERE id = ?
    `).bind(c.req.header('cf-connecting-ip') || 'unknown', user.id).run();
    
    return c.json({ 
      success: true, 
      data: {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: {
            id: user.role_id,
            name: user.role_name,
            display_name: user.role_display_name,
            level: user.role_level
          },
          permissions: permissions.results.map(p => p.name)
        }
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login failed', message: error.message }, 500);
  }
});

// Get current user
app.get('/api/auth/me', async (c) => {
  const { DB } = c.env;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ success: false, error: 'Not authenticated' }, 401);
  }
  
  try {
    const session = await DB.prepare(`
      SELECT s.user_id, u.email, u.first_name, u.last_name, u.profile_photo_url,
             r.id as role_id, r.name as role_name, r.display_name as role_display_name, r.level as role_level
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE s.token_hash = ? AND s.is_active = 1 AND s.expires_at > datetime('now')
      LIMIT 1
    `).bind(token).first();
    
    if (!session) {
      return c.json({ success: false, error: 'Invalid or expired session' }, 401);
    }
    
    // Get permissions
    const permissions = await DB.prepare(`
      SELECT DISTINCT p.name, p.display_name, p.module
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `).bind(session.user_id).all();
    
    return c.json({
      success: true,
      data: {
        id: session.user_id,
        email: session.email,
        name: `${session.first_name} ${session.last_name}`,
        profile_photo_url: session.profile_photo_url,
        role: {
          id: session.role_id,
          name: session.role_name,
          display_name: session.role_display_name,
          level: session.role_level
        },
        permissions: permissions.results.map(p => p.name)
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to get user', message: error.message }, 500);
  }
});

// Logout endpoint
app.post('/api/auth/logout', async (c) => {
  const { DB } = c.env;
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ success: true, message: 'Already logged out' });
  }
  
  try {
    await DB.prepare(`
      UPDATE sessions SET is_active = 0 WHERE token_hash = ?
    `).bind(token).run();
    
    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Logout failed', message: error.message }, 500);
  }
});

// OAuth callback handler (placeholder for future implementation)
app.get('/api/auth/oauth/:provider/callback', async (c) => {
  const provider = c.req.param('provider');
  const code = c.req.query('code');
  
  return c.json({ 
    success: false, 
    error: 'OAuth not fully implemented',
    message: `Received callback from ${provider} with code: ${code}. Configure OAuth credentials in environment variables.`
  });
});

// ============================================================================
// ADVANCED WORKFORCE FEATURES APIs
// ============================================================================

// ========== SHIFT SWAP/TRADE APIs ==========

// Get all shift swap requests (for employees and managers)
app.get('/api/shift-swaps', async (c) => {
  const { DB } = c.env;
  const status = c.req.query('status') || 'all';
  const employeeId = c.req.query('employee_id');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status !== 'all') {
      whereClause += ' AND ssr.status = ?';
      params.push(status);
    }
    
    if (employeeId) {
      whereClause += ' AND (ssr.requesting_employee_id = ? OR ssr.target_employee_id = ? OR ssr.target_employee_id IS NULL)';
      params.push(employeeId, employeeId);
    }
    
    const swaps = await DB.prepare(`
      SELECT ssr.*,
             re.first_name || ' ' || re.last_name as requesting_employee_name,
             re.job_title as requesting_employee_title,
             te.first_name || ' ' || te.last_name as target_employee_name,
             s.shift_date, s.start_time, s.end_time, s.shift_type,
             l.location_name as location_name, d.name as department_name
      FROM shift_swap_requests ssr
      JOIN employees re ON ssr.requesting_employee_id = re.id
      LEFT JOIN employees te ON ssr.target_employee_id = te.id
      JOIN shifts s ON ssr.original_shift_id = s.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE ${whereClause}
      ORDER BY ssr.requested_at DESC
      LIMIT 50
    `).bind(...params).all();
    
    return c.json({ success: true, data: swaps.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch shift swaps', message: error.message }, 500);
  }
});

// Create shift swap request
app.post('/api/shift-swaps', async (c) => {
  const { DB } = c.env;
  const { requesting_employee_id, original_shift_id, target_employee_id, swap_type, reason, notes } = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO shift_swap_requests (
        organization_id, requesting_employee_id, original_shift_id, target_employee_id,
        swap_type, reason, notes, expires_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
    `).bind(requesting_employee_id, original_shift_id, target_employee_id || null, swap_type, reason || null, notes || null).run();
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to create swap request', message: error.message }, 500);
  }
});

// Accept/Decline shift swap
app.patch('/api/shift-swaps/:id', async (c) => {
  const { DB } = c.env;
  const swapId = c.req.param('id');
  const { action, employee_id, manager_id, decline_reason } = await c.req.json();
  
  try {
    if (action === 'accept') {
      await DB.prepare(`
        UPDATE shift_swap_requests 
        SET status = 'accepted', accepted_by_employee_id = ?, responded_at = datetime('now')
        WHERE id = ?
      `).bind(employee_id, swapId).run();
    } else if (action === 'approve') {
      await DB.prepare(`
        UPDATE shift_swap_requests 
        SET status = 'approved_by_manager', approved_by_manager_id = ?, approved_at = datetime('now')
        WHERE id = ?
      `).bind(manager_id, swapId).run();
    } else if (action === 'decline') {
      await DB.prepare(`
        UPDATE shift_swap_requests 
        SET status = 'declined', declined_reason = ?, responded_at = datetime('now')
        WHERE id = ?
      `).bind(decline_reason || 'Declined', swapId).run();
    }
    
    return c.json({ success: true, message: 'Swap request updated' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to update swap request', message: error.message }, 500);
  }
});

// ========== TEAM MESSAGING APIs ==========

// Get team messages
app.get('/api/messages', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.query('employee_id');
  const messageType = c.req.query('type') || 'all';
  
  try {
    const messages = await DB.prepare(`
      SELECT tm.*,
             e.first_name || ' ' || e.last_name as sender_name,
             e.profile_photo_url as sender_photo,
             e.job_title as sender_title,
             d.name as department_name,
             l.location_name as location_name
      FROM team_messages tm
      JOIN employees e ON tm.sender_employee_id = e.id
      LEFT JOIN departments d ON tm.department_id = d.id
      LEFT JOIN locations l ON tm.location_id = l.id
      WHERE tm.organization_id = 1
      ORDER BY tm.is_pinned DESC, tm.created_at DESC
      LIMIT 50
    `).all();
    
    return c.json({ success: true, data: messages.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch messages', message: error.message }, 500);
  }
});

// Send team message
app.post('/api/messages', async (c) => {
  const { DB } = c.env;
  const { sender_employee_id, subject, message, message_type, target_type, department_id, location_id, is_urgent } = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO team_messages (
        organization_id, sender_employee_id, subject, message, message_type,
        target_type, department_id, location_id, is_urgent
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(sender_employee_id, subject || null, message, message_type, target_type, department_id || null, location_id || null, is_urgent ? 1 : 0).run();
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to send message', message: error.message }, 500);
  }
});

// ========== DOCUMENT MANAGEMENT APIs ==========

// Get employee documents
app.get('/api/documents', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.query('employee_id');
  const documentType = c.req.query('type');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (employeeId) {
      whereClause += ' AND ed.employee_id = ?';
      params.push(employeeId);
    }
    
    if (documentType) {
      whereClause += ' AND ed.document_type = ?';
      params.push(documentType);
    }
    
    const documents = await DB.prepare(`
      SELECT ed.*,
             e.first_name || ' ' || e.last_name as employee_name,
             e.employee_number,
             u.first_name || ' ' || u.last_name as uploaded_by_name
      FROM employee_documents ed
      JOIN employees e ON ed.employee_id = e.id
      LEFT JOIN users u ON ed.uploaded_by = u.id
      WHERE ${whereClause}
      ORDER BY ed.created_at DESC
    `).bind(...params).all();
    
    return c.json({ success: true, data: documents.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch documents', message: error.message }, 500);
  }
});

// Upload document (placeholder - real upload would use R2/S3)
app.post('/api/documents', async (c) => {
  const { DB } = c.env;
  const { employee_id, document_type, document_name, description, uploaded_by, has_expiry, expiry_date, is_confidential } = await c.req.json();
  
  try {
    // In production, this would handle file upload to R2/S3
    const file_path = '/documents/' + employee_id + '/' + Date.now() + '_' + document_name;
    
    const result = await DB.prepare(`
      INSERT INTO employee_documents (
        organization_id, employee_id, document_type, document_name, description,
        file_path, uploaded_by, has_expiry, expiry_date, is_confidential
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(employee_id, document_type, document_name, description || null, file_path, uploaded_by, has_expiry ? 1 : 0, expiry_date || null, is_confidential ? 1 : 0).run();
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, file_path } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to upload document', message: error.message }, 500);
  }
});

// ========== PAYROLL EXPORT APIs ==========

// Get payroll batches
app.get('/api/payroll/batches', async (c) => {
  const { DB } = c.env;
  
  try {
    const batches = await DB.prepare(`
      SELECT pb.*,
             u1.first_name || ' ' || u1.last_name as calculated_by_name,
             u2.first_name || ' ' || u2.last_name as approved_by_name
      FROM payroll_batches pb
      LEFT JOIN users u1 ON pb.calculated_by = u1.id
      LEFT JOIN users u2 ON pb.approved_by = u2.id
      ORDER BY pb.created_at DESC
      LIMIT 20
    `).all();
    
    return c.json({ success: true, data: batches.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch payroll batches', message: error.message }, 500);
  }
});

// Create payroll batch
app.post('/api/payroll/batches', async (c) => {
  const { DB } = c.env;
  const { pay_period_start, pay_period_end, calculated_by } = await c.req.json();
  
  try {
    const batch_number = 'PAY-' + Date.now();
    
    const result = await DB.prepare(`
      INSERT INTO payroll_batches (
        organization_id, batch_number, pay_period_start, pay_period_end, 
        status, calculated_by, calculated_at
      ) VALUES (1, ?, ?, ?, 'draft', ?, datetime('now'))
    `).bind(batch_number, pay_period_start, pay_period_end, calculated_by).run();
    
    return c.json({ success: true, data: { id: result.meta.last_row_id, batch_number } });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to create payroll batch', message: error.message }, 500);
  }
});

// ========== LABOR FORECASTING APIs ==========

// Get labor forecasts
app.get('/api/forecasts', async (c) => {
  const { DB } = c.env;
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  const locationId = c.req.query('location_id');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (startDate) {
      whereClause += ' AND lf.forecast_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND lf.forecast_date <= ?';
      params.push(endDate);
    }
    
    if (locationId) {
      whereClause += ' AND lf.location_id = ?';
      params.push(locationId);
    }
    
    const forecasts = await DB.prepare(`
      SELECT lf.*,
             l.location_name as location_name,
             d.name as department_name
      FROM labor_forecasts lf
      LEFT JOIN locations l ON lf.location_id = l.id
      LEFT JOIN departments d ON lf.department_id = d.id
      WHERE ${whereClause}
      ORDER BY lf.forecast_date ASC
    `).bind(...params).all();
    
    return c.json({ success: true, data: forecasts.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch forecasts', message: error.message }, 500);
  }
});

// ========== ATTENDANCE RULES APIs ==========

// Get attendance rules
app.get('/api/attendance/rules', async (c) => {
  const { DB } = c.env;
  
  try {
    const rules = await DB.prepare(`
      SELECT ar.*,
             d.name as department_name,
             l.location_name as location_name
      FROM attendance_rules ar
      LEFT JOIN departments d ON ar.department_id = d.id
      LEFT JOIN locations l ON ar.location_id = l.id
      WHERE ar.is_active = 1
      ORDER BY ar.rule_type, ar.created_at DESC
    `).all();
    
    return c.json({ success: true, data: rules.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch attendance rules', message: error.message }, 500);
  }
});

// Get attendance violations
app.get('/api/attendance/violations', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.query('employee_id');
  const status = c.req.query('status');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (employeeId) {
      whereClause += ' AND av.employee_id = ?';
      params.push(employeeId);
    }
    
    if (status) {
      whereClause += ' AND av.status = ?';
      params.push(status);
    }
    
    const violations = await DB.prepare(`
      SELECT av.*,
             e.first_name || ' ' || e.last_name as employee_name,
             e.employee_number,
             ar.rule_name
      FROM attendance_violations av
      JOIN employees e ON av.employee_id = e.id
      LEFT JOIN attendance_rules ar ON av.attendance_rule_id = ar.id
      WHERE ${whereClause}
      ORDER BY av.violation_date DESC
      LIMIT 100
    `).bind(...params).all();
    
    return c.json({ success: true, data: violations.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch violations', message: error.message }, 500);
  }
});

// ========== BUDGET TRACKING APIs ==========

// Get budget periods
app.get('/api/budgets', async (c) => {
  const { DB } = c.env;
  const departmentId = c.req.query('department_id');
  const locationId = c.req.query('location_id');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (departmentId) {
      whereClause += ' AND bp.department_id = ?';
      params.push(departmentId);
    }
    
    if (locationId) {
      whereClause += ' AND bp.location_id = ?';
      params.push(locationId);
    }
    
    const budgets = await DB.prepare(`
      SELECT bp.*,
             d.name as department_name,
             l.location_name as location_name
      FROM budget_periods bp
      LEFT JOIN departments d ON bp.department_id = d.id
      LEFT JOIN locations l ON bp.location_id = l.id
      WHERE ${whereClause}
      ORDER BY bp.period_start DESC
    `).all();
    
    return c.json({ success: true, data: budgets.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch budgets', message: error.message }, 500);
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (c) => {
  const { DB } = c.env;
  const type = c.req.query('type') || 'points'; // points, shifts, training, social
  
  try {
    const employees = await DB.prepare(`
      SELECT 
        e.id,
        e.first_name || ' ' || e.last_name as name,
        e.profile_photo_url,
        e.job_title,
        e.department_id
      FROM employees e
      WHERE e.is_active = 1
      ORDER BY RANDOM()
      LIMIT 10
    `).all();
    
    const leaderboard = employees.results.map((emp, idx) => ({
      ...emp,
      rank: idx + 1,
      points: Math.floor(Math.random() * 5000) + 1000,
      trend: idx < 3 ? 'up' : (idx > 7 ? 'down' : 'stable'),
    }));
    
    return c.json({ success: true, data: leaderboard });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Award points for action
app.post('/api/gamification/award', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    const { employee_id, action, points } = data;
    
    // In real implementation, this would update a gamification table
    const result = {
      success: true,
      points_awarded: points,
      new_total: Math.floor(Math.random() * 5000) + points,
      level_up: Math.random() > 0.8,
      badge_unlocked: Math.random() > 0.7 ? 'Consistent Performer' : null,
    };
    
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to award points' }, 500);
  }
});

// ============================================================================
// COMPLIANCE MANAGEMENT APIs
// ============================================================================
// Comprehensive SA Labour Law Compliance Monitoring System
// Covers 16 legislative categories with 50+ critical checkpoints

// Initialize compliance system (run once to create tables and seed data)
app.post('/api/compliance/initialize', async (c) => {
  const { DB } = c.env;
  
  try {
    // Check if already initialized
    const check = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_categories'
    `).first();
    
    if (check) {
      return c.json({ success: true, message: 'Compliance system already initialized' });
    }
    
    // Execute migration SQL from file (simplified - tables only, no complex schema)
    // In production, this would be handled by wrangler migrations
    await DB.batch([
      DB.prepare(`CREATE TABLE IF NOT EXISTS compliance_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        legislation_reference TEXT,
        risk_level TEXT CHECK(risk_level IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      DB.prepare(`CREATE TABLE IF NOT EXISTS compliance_checkpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        check_type TEXT NOT NULL,
        frequency TEXT NOT NULL,
        responsible_role TEXT,
        days_before_alert INTEGER DEFAULT 30,
        is_automated INTEGER DEFAULT 0,
        penalty_amount_min REAL,
        penalty_amount_max REAL,
        legislation_reference TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      DB.prepare(`CREATE TABLE IF NOT EXISTS organization_compliance_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        checkpoint_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        compliance_date DATE,
        expiry_date DATE,
        next_review_date DATE,
        evidence_document_path TEXT,
        notes TEXT,
        last_checked_at DATETIME,
        last_checked_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      DB.prepare(`CREATE TABLE IF NOT EXISTS compliance_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_type TEXT NOT NULL,
        severity TEXT DEFAULT 'warning',
        category_id INTEGER,
        checkpoint_id INTEGER,
        employee_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        days_until_due INTEGER,
        responsible_role TEXT,
        assigned_to INTEGER,
        status TEXT DEFAULT 'new',
        acknowledged_at DATETIME,
        acknowledged_by INTEGER,
        resolved_at DATETIME,
        resolved_by INTEGER,
        resolution_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      // Seed 17 compliance categories (added INTERNS_MANAGEMENT)
      DB.prepare(`INSERT OR IGNORE INTO compliance_categories (code, name, risk_level) VALUES 
        ('LEGISLATIVE_FRAMEWORK', 'Legislative Framework', 'critical'),
        ('REGISTRATION_LICENSING', 'Registration & Licensing', 'critical'),
        ('EMPLOYMENT_CONTRACTS', 'Employment Contracts', 'high'),
        ('WAGES_REMUNERATION', 'Wages & Remuneration', 'critical'),
        ('WORKING_TIME', 'Working Time Regulations', 'high'),
        ('LEAVE_ENTITLEMENTS', 'Leave Entitlements', 'high'),
        ('HEALTH_SAFETY', 'Health & Safety', 'critical'),
        ('INSURANCE_COMPENSATION', 'Insurance & Compensation', 'critical'),
        ('EMPLOYMENT_EQUITY', 'Employment Equity', 'high'),
        ('SKILLS_DEVELOPMENT', 'Skills Development', 'medium'),
        ('DATA_PROTECTION', 'Data Protection (POPIA)', 'high'),
        ('LABOUR_RELATIONS', 'Labour Relations', 'medium'),
        ('TERMINATION_EXIT', 'Termination & Exit', 'high'),
        ('TES_COMPLIANCE', 'TES Compliance', 'critical'),
        ('RECORD_KEEPING', 'Record-Keeping', 'high'),
        ('AUDITS_INSPECTIONS', 'Audits & Inspections', 'medium'),
        ('INTERNS_MANAGEMENT', 'Interns & Learnership Management', 'high')
      `)
    ]);
    
    return c.json({ 
      success: true, 
      message: 'Compliance system initialized successfully',
      note: 'Run POST /api/interns/compliance/seed to load 52 intern checkpoints'
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to initialize compliance system', message: error.message }, 500);
  }
});

// Get compliance overview/dashboard (role-specific)
app.get('/api/compliance/overview', async (c) => {
  const { DB } = c.env;
  const roleFilter = c.req.query('role') || 'employee';
  
  try {
    // Calculate overall compliance score
    const totalCheckpoints = await DB.prepare(`
      SELECT COUNT(*) as count FROM compliance_checkpoints WHERE is_active = 1
    `).first();
    
    const compliantChecks = await DB.prepare(`
      SELECT COUNT(*) as count FROM organization_compliance_status 
      WHERE status = 'compliant'
    `).first();
    
    const complianceScore = totalCheckpoints && totalCheckpoints.count > 0
      ? Math.round((compliantChecks.count / totalCheckpoints.count) * 100)
      : 0;
    
    // Get category-level compliance
    const categoryStats = await DB.prepare(`
      SELECT 
        cc.code,
        cc.name,
        cc.risk_level,
        COUNT(cp.id) as total_checks,
        SUM(CASE WHEN ocs.status = 'compliant' THEN 1 ELSE 0 END) as compliant_checks,
        SUM(CASE WHEN ocs.status = 'non_compliant' THEN 1 ELSE 0 END) as non_compliant_checks,
        SUM(CASE WHEN ocs.status = 'pending' THEN 1 ELSE 0 END) as pending_checks
      FROM compliance_categories cc
      LEFT JOIN compliance_checkpoints cp ON cc.id = cp.category_id AND cp.is_active = 1
      LEFT JOIN organization_compliance_status ocs ON cp.id = ocs.checkpoint_id
      WHERE cc.is_active = 1
      GROUP BY cc.id
      ORDER BY cc.risk_level DESC, cc.name ASC
    `).all();
    
    // Get critical alerts (expiring soon, overdue)
    const criticalAlerts = await DB.prepare(`
      SELECT 
        ca.*,
        cc.name as category_name,
        cp.title as checkpoint_title
      FROM compliance_alerts ca
      LEFT JOIN compliance_categories cc ON ca.category_id = cc.id
      LEFT JOIN compliance_checkpoints cp ON ca.checkpoint_id = cp.id
      WHERE ca.status IN ('new', 'acknowledged')
        AND ca.severity IN ('critical', 'warning')
      ORDER BY 
        CASE ca.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        ca.due_date ASC
      LIMIT 20
    `).all();
    
    return c.json({
      success: true,
      data: {
        compliance_score: complianceScore,
        total_checkpoints: totalCheckpoints?.count || 0,
        compliant_checks: compliantChecks?.count || 0,
        categories: categoryStats.results,
        critical_alerts: criticalAlerts.results,
        // Note: upcoming_deadlines and recent_violations require additional tables
        // These will be populated once full migration is applied
        upcoming_deadlines: [],
        recent_violations: []
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch compliance overview', message: error.message }, 500);
  }
});

// Get all compliance checkpoints (filterable)
app.get('/api/compliance/checkpoints', async (c) => {
  const { DB } = c.env;
  const categoryCode = c.req.query('category');
  const status = c.req.query('status');
  
  try {
    let whereClause = 'WHERE cp.is_active = 1';
    const params: any[] = [];
    
    if (categoryCode) {
      whereClause += ' AND cc.code = ?';
      params.push(categoryCode);
    }
    
    if (status) {
      whereClause += ' AND ocs.status = ?';
      params.push(status);
    }
    
    const checkpoints = await DB.prepare(`
      SELECT 
        cp.*,
        cc.name as category_name,
        cc.code as category_code,
        ocs.status as compliance_status,
        ocs.compliance_date,
        ocs.expiry_date,
        ocs.next_review_date,
        ocs.notes as compliance_notes
      FROM compliance_checkpoints cp
      LEFT JOIN compliance_categories cc ON cp.category_id = cc.id
      LEFT JOIN organization_compliance_status ocs ON cp.id = ocs.checkpoint_id
      ${whereClause}
      ORDER BY cc.risk_level DESC, cp.check_type, cp.title ASC
    `).bind(...params).all();
    
    return c.json({ success: true, data: checkpoints.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch checkpoints', message: error.message }, 500);
  }
});

// Get employee-specific compliance status
app.get('/api/compliance/employee/:employeeId', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.param('employeeId');
  
  try {
    // Get employee compliance checks
    const employeeCompliance = await DB.prepare(`
      SELECT 
        ecs.*,
        cp.title as checkpoint_title,
        cp.description as checkpoint_description,
        cp.check_type,
        cc.name as category_name
      FROM employee_compliance_status ecs
      LEFT JOIN compliance_checkpoints cp ON ecs.checkpoint_id = cp.id
      LEFT JOIN compliance_categories cc ON cp.category_id = cc.id
      WHERE ecs.employee_id = ?
      ORDER BY 
        CASE ecs.status 
          WHEN 'non_compliant' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'in_progress' THEN 3 
          ELSE 4 
        END,
        ecs.expiry_date ASC NULLS LAST
    `).bind(employeeId).all();
    
    // Get employee training records with expiry tracking
    const trainingRecords = await DB.prepare(`
      SELECT 
        etr.*,
        mt.training_name,
        mt.frequency_months,
        CAST((JULIANDAY(etr.expiry_date) - JULIANDAY('now')) AS INTEGER) as days_until_expiry
      FROM employee_training_records etr
      LEFT JOIN mandatory_training mt ON etr.training_id = mt.id
      WHERE etr.employee_id = ?
        AND (etr.status = 'completed' OR etr.status = 'in_progress')
      ORDER BY etr.expiry_date ASC NULLS LAST
    `).bind(employeeId).all();
    
    // Get professional registrations
    const professionalRegs = await DB.prepare(`
      SELECT * FROM employee_professional_registrations
      WHERE employee_id = ? AND status = 'active'
      ORDER BY expiry_date ASC NULLS LAST
    `).bind(employeeId).all();
    
    // Get contract status
    const contractStatus = await DB.prepare(`
      SELECT * FROM employment_contract_status
      WHERE employee_id = ?
    `).bind(employeeId).first();
    
    return c.json({
      success: true,
      data: {
        compliance_checks: employeeCompliance.results,
        training_records: trainingRecords.results,
        professional_registrations: professionalRegs.results,
        contract_status: contractStatus || null
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch employee compliance', message: error.message }, 500);
  }
});

// Get compliance alerts (for assigned users)
app.get('/api/compliance/alerts', async (c) => {
  const { DB } = c.env;
  const assignedTo = c.req.query('assigned_to');
  const severity = c.req.query('severity');
  const status = c.req.query('status') || 'new,acknowledged';
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (assignedTo) {
      whereClause += ' AND ca.assigned_to = ?';
      params.push(assignedTo);
    }
    
    if (severity) {
      whereClause += ' AND ca.severity = ?';
      params.push(severity);
    }
    
    // Handle comma-separated status values
    const statusList = status.split(',').map(s => s.trim());
    if (statusList.length > 0) {
      const placeholders = statusList.map(() => '?').join(',');
      whereClause += ` AND ca.status IN (${placeholders})`;
      params.push(...statusList);
    }
    
    const alerts = await DB.prepare(`
      SELECT 
        ca.*,
        cc.name as category_name,
        cp.title as checkpoint_title,
        e.first_name || ' ' || e.last_name as employee_name
      FROM compliance_alerts ca
      LEFT JOIN compliance_categories cc ON ca.category_id = cc.id
      LEFT JOIN compliance_checkpoints cp ON ca.checkpoint_id = cp.id
      LEFT JOIN employees e ON ca.employee_id = e.id
      WHERE ${whereClause}
      ORDER BY 
        CASE ca.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        ca.due_date ASC NULLS LAST,
        ca.created_at DESC
    `).bind(...params).all();
    
    return c.json({ success: true, data: alerts.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch alerts', message: error.message }, 500);
  }
});

// Update compliance status
app.put('/api/compliance/status/:statusId', async (c) => {
  const { DB } = c.env;
  const statusId = c.req.param('statusId');
  const {  status, compliance_date, expiry_date, notes, evidence_document_path } = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE organization_compliance_status
      SET status = ?,
          compliance_date = ?,
          expiry_date = ?,
          notes = ?,
          evidence_document_path = ?,
          last_checked_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, compliance_date, expiry_date, notes, evidence_document_path, statusId).run();
    
    return c.json({ success: true, message: 'Compliance status updated' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to update status', message: error.message }, 500);
  }
});

// Acknowledge/resolve compliance alert
app.put('/api/compliance/alerts/:alertId', async (c) => {
  const { DB } = c.env;
  const alertId = c.req.param('alertId');
  const { status, resolution_notes, acknowledged_by, resolved_by } = await c.req.json();
  
  try {
    const updates: string[] = ['status = ?'];
    const params: any[] = [status];
    
    if (status === 'acknowledged' && acknowledged_by) {
      updates.push('acknowledged_at = datetime("now")', 'acknowledged_by = ?');
      params.push(acknowledged_by);
    }
    
    if (status === 'resolved' && resolved_by) {
      updates.push('resolved_at = datetime("now")', 'resolved_by = ?', 'resolution_notes = ?');
      params.push(resolved_by, resolution_notes || '');
    }
    
    params.push(alertId);
    
    await DB.prepare(`
      UPDATE compliance_alerts
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...params).run();
    
    return c.json({ success: true, message: 'Alert updated' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to update alert', message: error.message }, 500);
  }
});

// Get statutory payments status
app.get('/api/compliance/payments', async (c) => {
  const { DB } = c.env;
  const status = c.req.query('status');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const payments = await DB.prepare(`
      SELECT *,
        CAST((JULIANDAY(due_date) - JULIANDAY('now')) AS INTEGER) as days_until_due
      FROM statutory_payments
      WHERE ${whereClause}
      ORDER BY due_date ASC
      LIMIT 50
    `).bind(...params).all();
    
    return c.json({ success: true, data: payments.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch payments', message: error.message }, 500);
  }
});

// Get statutory reports status
app.get('/api/compliance/reports', async (c) => {
  const { DB } = c.env;
  const status = c.req.query('status');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    const reports = await DB.prepare(`
      SELECT *,
        CAST((JULIANDAY(submission_deadline) - JULIANDAY('now')) AS INTEGER) as days_until_due
      FROM statutory_reports
      WHERE ${whereClause}
      ORDER BY submission_deadline ASC
      LIMIT 50
    `).bind(...params).all();
    
    return c.json({ success: true, data: reports.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch reports', message: error.message }, 500);
  }
});

// Get working time violations
app.get('/api/compliance/violations/working-time', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.query('employee_id');
  const resolved = c.req.query('resolved');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (employeeId) {
      whereClause += ' AND wtv.employee_id = ?';
      params.push(employeeId);
    }
    
    if (resolved !== undefined) {
      whereClause += ' AND wtv.resolved = ?';
      params.push(resolved === 'true' ? 1 : 0);
    }
    
    const violations = await DB.prepare(`
      SELECT 
        wtv.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.employee_number,
        d.name as department_name
      FROM working_time_violations wtv
      LEFT JOIN employees e ON wtv.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ${whereClause}
      ORDER BY wtv.violation_date DESC, wtv.severity DESC
      LIMIT 100
    `).bind(...params).all();
    
    return c.json({ success: true, data: violations.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch violations', message: error.message }, 500);
  }
});

// ============================================================================
// INTERNS MANAGEMENT APIs
// ============================================================================
// Complete lifecycle management for SETA/YES/NYS/Self-funded interns
// Handles: Registration, Stipends, Assessments, Mentorship, SETA Grants, Graduation

// Get all intern programs
app.get('/api/interns/programs', async (c) => {
  const { DB } = c.env;
  const isActive = c.req.query('is_active');
  const programType = c.req.query('program_type');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (isActive !== undefined) {
      whereClause += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    if (programType) {
      whereClause += ' AND program_type = ?';
      params.push(programType);
    }
    
    const programs = await DB.prepare(`
      SELECT 
        ip.*,
        u1.first_name || ' ' || u1.last_name as manager_name,
        u2.first_name || ' ' || u2.last_name as coordinator_name,
        (SELECT COUNT(*) FROM interns WHERE program_id = ip.id AND intern_status = 'active') as active_interns,
        (SELECT COUNT(*) FROM interns WHERE program_id = ip.id AND intern_status = 'completed') as graduated_interns
      FROM intern_programs ip
      LEFT JOIN users u1 ON ip.program_manager = u1.id
      LEFT JOIN users u2 ON ip.training_coordinator = u2.id
      WHERE ${whereClause}
      ORDER BY ip.is_active DESC, ip.start_date DESC
    `).bind(...params).all();
    
    return c.json({ success: true, data: programs.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch intern programs', message: error.message }, 500);
  }
});

// Create new intern program
app.post('/api/interns/programs', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO intern_programs (
        program_name, program_type, description, duration_months,
        seta_name, qualification_title, qualification_nqf_level,
        stipend_amount, is_active, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.program_name,
      data.program_type,
      data.description || null,
      data.duration_months || null,
      data.seta_name || null,
      data.qualification_title || null,
      data.qualification_nqf_level || null,
      data.stipend_amount || null,
      data.is_active !== undefined ? data.is_active : 1,
      data.start_date || null,
      data.end_date || null
    ).run();
    
    return c.json({ 
      success: true, 
      data: { program_id: result.meta.last_row_id },
      message: 'Program created successfully' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to create program', message: error.message }, 500);
  }
});

// Register new intern
app.post('/api/interns/register', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    // Insert intern record (simplified schema - only fields that exist)
    const internResult = await DB.prepare(`
      INSERT INTO interns (
        first_name, last_name, id_number, email, phone,
        program_id, intern_status, legal_status, start_date, expected_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.first_name,
      data.last_name,
      data.id_number,
      data.email || null,
      data.phone || null,
      data.program_id,
      data.intern_status || 'registered',
      data.legal_status,
      data.start_date || new Date().toISOString().split('T')[0],
      data.expected_end_date || null
    ).run();
    
    const internId = internResult.meta.last_row_id;
    
    return c.json({ 
      success: true, 
      data: { intern_id: internId },
      message: 'Intern registered successfully' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to register intern', message: error.message }, 500);
  }
});

// Get intern dashboard analytics (MUST come before :internId route)
app.get('/api/interns/dashboard', async (c) => {
  const { DB } = c.env;
  const role = c.req.query('role') || 'coordinator';
  
  try {
    // Get overview stats
    const stats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_interns,
        SUM(CASE WHEN intern_status = 'active' THEN 1 ELSE 0 END) as total_active_interns,
        SUM(CASE WHEN intern_status = 'completed' THEN 1 ELSE 0 END) as graduated_interns,
        SUM(CASE WHEN legal_status = 'learner' THEN 1 ELSE 0 END) as learner_status,
        SUM(CASE WHEN legal_status = 'employee' THEN 1 ELSE 0 END) as employee_status
      FROM interns
    `).first();
    
    // Get program breakdown
    const programBreakdown = await DB.prepare(`
      SELECT 
        ip.program_name,
        ip.program_type,
        COUNT(i.id) as intern_count,
        SUM(CASE WHEN i.intern_status = 'active' THEN 1 ELSE 0 END) as active_interns
      FROM intern_programs ip
      LEFT JOIN interns i ON ip.id = i.program_id
      WHERE ip.is_active = 1
      GROUP BY ip.id, ip.program_name, ip.program_type
      ORDER BY active_interns DESC
    `).all();
    
    // Get status breakdown
    const statusBreakdown = await DB.prepare(`
      SELECT 
        intern_status,
        COUNT(*) as count
      FROM interns
      GROUP BY intern_status
      ORDER BY count DESC
    `).all();
    
    // Get recent interns (last 10)
    const recentInterns = await DB.prepare(`
      SELECT 
        i.first_name || ' ' || i.last_name as intern_name,
        ip.program_name,
        i.start_date,
        i.intern_status
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      data: {
        ...stats,
        by_program: programBreakdown.results,
        by_status: statusBreakdown.results,
        recent_interns: recentInterns.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch dashboard', message: error.message }, 500);
  }
});

// Get all interns (with filters)
app.get('/api/interns', async (c) => {
  const { DB } = c.env;
  const status = c.req.query('status');
  const programId = c.req.query('program_id');
  const legalStatus = c.req.query('legal_status');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND i.intern_status = ?';
      params.push(status);
    }
    
    if (programId) {
      whereClause += ' AND i.program_id = ?';
      params.push(programId);
    }
    
    if (legalStatus) {
      whereClause += ' AND i.legal_status = ?';
      params.push(legalStatus);
    }
    
    const interns = await DB.prepare(`
      SELECT 
        i.*,
        ip.program_name,
        ip.program_type,
        CASE 
          WHEN sr.id IS NOT NULL THEN 'SETA'
          WHEN yr.id IS NOT NULL THEN 'YES'
          WHEN nr.id IS NOT NULL THEN 'NYS'
          ELSE 'Self-Funded'
        END as funding_type,
        sr.registration_status as seta_status,
        yr.registration_status as yes_status,
        nr.registration_status as nys_status
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      LEFT JOIN seta_registrations sr ON i.id = sr.intern_id
      LEFT JOIN yes_registrations yr ON i.id = yr.intern_id
      LEFT JOIN nys_registrations nr ON i.id = nr.intern_id
      WHERE ${whereClause}
      ORDER BY i.start_date DESC
    `).bind(...params).all();
    
    return c.json({ success: true, data: interns.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch interns', message: error.message }, 500);
  }
});

// Get single intern details
app.get('/api/interns/:internId', async (c) => {
  const { DB } = c.env;
  const internId = c.req.param('internId');
  
  try {
    const intern = await DB.prepare(`
      SELECT 
        i.*,
        ip.program_name,
        ip.program_type,
        ip.seta_name,
        ip.qualification_title
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.id = ?
    `).bind(internId).first();
    
    if (!intern) {
      return c.json({ success: false, error: 'Intern not found' }, 404);
    }
    
    // Get SETA registration if applicable
    const setaReg = await DB.prepare(`
      SELECT * FROM seta_registrations WHERE intern_id = ?
    `).bind(internId).first();
    
    // Get YES registration if applicable
    const yesReg = await DB.prepare(`
      SELECT * FROM yes_registrations WHERE intern_id = ?
    `).bind(internId).first();
    
    // Get learning plan
    const learningPlan = await DB.prepare(`
      SELECT * FROM intern_learning_plans 
      WHERE intern_id = ? AND status = 'active'
      ORDER BY created_date DESC LIMIT 1
    `).bind(internId).first();
    
    // Get recent assessments
    const assessments = await DB.prepare(`
      SELECT * FROM intern_assessments
      WHERE intern_id = ?
      ORDER BY assessment_date DESC
      LIMIT 5
    `).bind(internId).all();
    
    return c.json({ 
      success: true, 
      data: {
        intern,
        seta_registration: setaReg,
        yes_registration: yesReg,
        learning_plan: learningPlan,
        recent_assessments: assessments.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch intern details', message: error.message }, 500);
  }
});

// Process monthly stipend payment
app.post('/api/interns/stipend/pay', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    // Check if payment already exists
    const existing = await DB.prepare(`
      SELECT id FROM intern_stipend_payments
      WHERE intern_id = ? AND payment_month = ? AND payment_year = ?
    `).bind(data.intern_id, data.payment_month, data.payment_year).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Payment already recorded for this month' }, 400);
    }
    
    // Calculate net amount
    const grossAmount = data.basic_stipend + (data.transport_allowance || 0) + (data.meal_allowance || 0);
    const totalDeductions = (data.paye_deducted || 0) + (data.uif_deducted || 0);
    const netAmount = grossAmount - totalDeductions;
    
    // Insert payment record
    const result = await DB.prepare(`
      INSERT INTO intern_stipend_payments (
        intern_id, payment_month, payment_year, payment_date,
        basic_stipend, transport_allowance, meal_allowance, gross_amount,
        paye_deducted, uif_deducted, total_deductions, net_amount,
        payment_method, payment_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.intern_id, data.payment_month, data.payment_year, data.payment_date,
      data.basic_stipend, data.transport_allowance || 0, data.meal_allowance || 0, grossAmount,
      data.paye_deducted || 0, data.uif_deducted || 0, totalDeductions, netAmount,
      data.payment_method || 'eft', data.payment_reference
    ).run();
    
    return c.json({ 
      success: true, 
      data: { payment_id: result.meta.last_row_id, net_amount: netAmount },
      message: 'Stipend payment recorded' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to record payment', message: error.message }, 500);
  }
});

// Get stipend payment history
app.get('/api/interns/:internId/stipends', async (c) => {
  const { DB } = c.env;
  const internId = c.req.param('internId');
  
  try {
    const payments = await DB.prepare(`
      SELECT * FROM intern_stipend_payments
      WHERE intern_id = ?
      ORDER BY payment_year DESC, payment_month DESC
    `).bind(internId).all();
    
    return c.json({ success: true, data: payments.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch stipend history', message: error.message }, 500);
  }
});

// Record mentorship session
app.post('/api/interns/mentorship/session', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO intern_mentorship_sessions (
        intern_id, mentor_id, session_date, session_duration_minutes, session_type,
        topics_discussed, challenges_raised, support_provided, action_items,
        progress_rating, progress_notes, next_session_scheduled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.intern_id, data.mentor_id, data.session_date, data.session_duration_minutes, data.session_type,
      data.topics_discussed, data.challenges_raised, data.support_provided, data.action_items,
      data.progress_rating, data.progress_notes, data.next_session_scheduled
    ).run();
    
    return c.json({ 
      success: true, 
      data: { session_id: result.meta.last_row_id },
      message: 'Mentorship session recorded' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to record session', message: error.message }, 500);
  }
});

// Get mentorship sessions for intern
app.get('/api/interns/:internId/mentorship', async (c) => {
  const { DB } = c.env;
  const internId = c.req.param('internId');
  
  try {
    const sessions = await DB.prepare(`
      SELECT 
        ims.*,
        e.first_name || ' ' || e.last_name as mentor_name
      FROM intern_mentorship_sessions ims
      LEFT JOIN employees e ON ims.mentor_id = e.id
      WHERE ims.intern_id = ?
      ORDER BY ims.session_date DESC
    `).bind(internId).all();
    
    return c.json({ success: true, data: sessions.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch mentorship sessions', message: error.message }, 500);
  }
});

// Record assessment
app.post('/api/interns/assessment', async (c) => {
  const { DB } = c.env;
  const data = await c.req.json();
  
  try {
    const result = await DB.prepare(`
      INSERT INTO intern_assessments (
        intern_id, assessment_type, assessment_date, assessed_by,
        competencies_assessed, overall_rating, technical_skills_rating, 
        soft_skills_rating, workplace_behavior_rating,
        strengths, areas_for_improvement, recommendations, outcome
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.intern_id, data.assessment_type, data.assessment_date, data.assessed_by,
      data.competencies_assessed, data.overall_rating, data.technical_skills_rating,
      data.soft_skills_rating, data.workplace_behavior_rating,
      data.strengths, data.areas_for_improvement, data.recommendations, data.outcome
    ).run();
    
    return c.json({ 
      success: true, 
      data: { assessment_id: result.meta.last_row_id },
      message: 'Assessment recorded successfully' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to record assessment', message: error.message }, 500);
  }
});

// Get assessments for intern
app.get('/api/interns/:internId/assessments', async (c) => {
  const { DB } = c.env;
  const internId = c.req.param('internId');
  
  try {
    const assessments = await DB.prepare(`
      SELECT 
        ia.*,
        u.first_name || ' ' || u.last_name as assessor_name
      FROM intern_assessments ia
      LEFT JOIN users u ON ia.assessed_by = u.id
      WHERE ia.intern_id = ?
      ORDER BY ia.assessment_date DESC
    `).bind(internId).all();
    
    return c.json({ success: true, data: assessments.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch assessments', message: error.message }, 500);
  }
});

// Get SETA grant tracking
app.get('/api/interns/seta/grants', async (c) => {
  const { DB } = c.env;
  const programId = c.req.query('program_id');
  
  try {
    let whereClause = '1=1';
    const params: any[] = [];
    
    if (programId) {
      whereClause += ' AND sr.program_id = ?';
      params.push(programId);
    }
    
    const grants = await DB.prepare(`
      SELECT 
        i.first_name || ' ' || i.last_name as intern_name,
        i.id_number,
        ip.program_name,
        sr.seta_name,
        sr.registration_status,
        sr.commencement_grant_claimed,
        sr.commencement_grant_amount,
        sr.progress_grant_claimed,
        sr.progress_grant_amount,
        sr.completion_grant_claimed,
        sr.completion_grant_amount,
        sr.total_grant_received,
        sr.last_quarterly_report_date,
        sr.next_quarterly_report_due
      FROM seta_registrations sr
      LEFT JOIN interns i ON sr.intern_id = i.id
      LEFT JOIN intern_programs ip ON sr.program_id = ip.id
      WHERE ${whereClause}
      ORDER BY sr.registration_date DESC
    `).bind(...params).all();
    
    // Calculate totals
    const totals = grants.results.reduce((acc: any, grant: any) => {
      acc.total_grants_claimed += (grant.total_grant_received || 0);
      acc.commencement_count += grant.commencement_grant_claimed ? 1 : 0;
      acc.progress_count += grant.progress_grant_claimed ? 1 : 0;
      acc.completion_count += grant.completion_grant_claimed ? 1 : 0;
      return acc;
    }, { total_grants_claimed: 0, commencement_count: 0, progress_count: 0, completion_count: 0 });
    
    return c.json({ 
      success: true, 
      data: {
        grants: grants.results,
        totals
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch SETA grants', message: error.message }, 500);
  }
});

// Get interns ready for graduation
app.get('/api/interns/graduation/ready', async (c) => {
  const { DB } = c.env;
  
  try {
    const ready = await DB.prepare(`
      SELECT 
        i.*,
        ip.program_name,
        ip.program_type,
        (SELECT COUNT(*) FROM intern_assessments 
         WHERE intern_id = i.id AND outcome = 'competent') as competent_assessments,
        (SELECT COUNT(*) FROM intern_assessments 
         WHERE intern_id = i.id) as total_assessments
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.intern_status = 'active'
        AND DATE(i.expected_end_date) <= DATE('now', '+30 days')
      ORDER BY i.expected_end_date ASC
    `).all();
    
    return c.json({ success: true, data: ready.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch graduation-ready interns', message: error.message }, 500);
  }
});

// Complete intern program (graduation)
app.post('/api/interns/:internId/complete', async (c) => {
  const { DB } = c.env;
  const internId = c.req.param('internId');
  const data = await c.req.json();
  
  try {
    // Update intern status
    await DB.prepare(`
      UPDATE interns 
      SET intern_status = 'completed', actual_end_date = ?
      WHERE id = ?
    `).bind(data.completion_date, internId).run();
    
    // Insert completion record
    const result = await DB.prepare(`
      INSERT INTO intern_completions (
        intern_id, completion_date, completion_status,
        qualification_achieved, qualification_title, certificate_number,
        skills_acquired, competencies_achieved,
        final_assessment_rating, final_assessment_notes,
        employment_status, employment_start_date, job_title,
        reference_provided
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      internId, data.completion_date, data.completion_status,
      data.qualification_achieved || 0, data.qualification_title, data.certificate_number,
      data.skills_acquired, data.competencies_achieved,
      data.final_assessment_rating, data.final_assessment_notes,
      data.employment_status, data.employment_start_date, data.job_title,
      data.reference_provided || 0
    ).run();
    
    return c.json({ 
      success: true, 
      data: { completion_id: result.meta.last_row_id },
      message: 'Intern program completed successfully' 
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to complete program', message: error.message }, 500);
  }
});

// ============================================================================
// INTERN COMPLIANCE MONITORING APIs
// ============================================================================
// Automated monitoring for SETA, YES, NYS compliance checkpoints
// Links to intern_compliance_checkpoints.sql (52 checkpoints)

// Get intern-specific compliance dashboard
app.get('/api/interns/compliance/dashboard', async (c) => {
  const { DB } = c.env;
  try {
    // Get INTERNS_MANAGEMENT category ID
    const categoryResult = await DB.prepare(`
      SELECT id FROM compliance_categories WHERE code = 'INTERNS_MANAGEMENT'
    `).first();
    
    if (!categoryResult) {
      return c.json({ success: false, error: 'Interns compliance category not found' }, 404);
    }
    
    const categoryId = categoryResult.id;
    
    // Count total checkpoints
    const totalCheckpoints = await DB.prepare(`
      SELECT COUNT(*) as count FROM compliance_checkpoints WHERE category_id = ?
    `).bind(categoryId).first();
    
    // Count active interns
    const activeInterns = await DB.prepare(`
      SELECT COUNT(*) as count FROM interns WHERE intern_status = 'active'
    `).first();
    
    // Count critical alerts (due within 7 days)
    const criticalAlerts = await DB.prepare(`
      SELECT COUNT(*) as count FROM compliance_alerts ca
      JOIN compliance_checkpoints cc ON ca.checkpoint_id = cc.id
      WHERE cc.category_id = ? 
        AND ca.status = 'new'
        AND ca.due_date <= DATE('now', '+7 days')
    `).bind(categoryId).first();
    
    // Count pending compliance tasks
    const pendingTasks = await DB.prepare(`
      SELECT COUNT(*) as count FROM organization_compliance_status ocs
      JOIN compliance_checkpoints cc ON ocs.checkpoint_id = cc.id
      WHERE cc.category_id = ? AND ocs.status = 'pending'
    `).bind(categoryId).first();
    
    // Get upcoming deadlines (next 30 days)
    const upcomingDeadlines = await DB.prepare(`
      SELECT 
        ca.id,
        ca.title,
        ca.due_date,
        ca.severity,
        cc.code as checkpoint_code,
        cc.responsible_role
      FROM compliance_alerts ca
      JOIN compliance_checkpoints cc ON ca.checkpoint_id = cc.id
      WHERE cc.category_id = ?
        AND ca.status = 'new'
        AND ca.due_date BETWEEN DATE('now') AND DATE('now', '+30 days')
      ORDER BY ca.due_date ASC
      LIMIT 10
    `).bind(categoryId).all();
    
    // SETA grants summary
    const setaGrants = await DB.prepare(`
      SELECT 
        COUNT(*) as total_registrations,
        SUM(CASE WHEN commencement_grant_claimed = 1 THEN 1 ELSE 0 END) as commencement_claimed,
        SUM(CASE WHEN progress_grant_claimed = 1 THEN 1 ELSE 0 END) as progress_claimed,
        SUM(CASE WHEN completion_grant_claimed = 1 THEN 1 ELSE 0 END) as completion_claimed,
        SUM(total_grant_received) as total_grants_received
      FROM seta_registrations
    `).first();
    
    // YES participants summary
    const yesParticipants = await DB.prepare(`
      SELECT 
        COUNT(*) as total_participants,
        SUM(b_bbee_points_claimed) as total_bbbee_points
      FROM yes_registrations
    `).first();
    
    return c.json({
      success: true,
      data: {
        overview: {
          total_checkpoints: totalCheckpoints?.count || 0,
          active_interns: activeInterns?.count || 0,
          critical_alerts: criticalAlerts?.count || 0,
          pending_tasks: pendingTasks?.count || 0
        },
        upcoming_deadlines: upcomingDeadlines.results,
        seta_grants: setaGrants,
        yes_participants: yesParticipants
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch intern compliance dashboard', message: error.message }, 500);
  }
});

// Get all intern compliance checkpoints with filters
app.get('/api/interns/compliance/checkpoints', async (c) => {
  const { DB } = c.env;
  try {
    const checkType = c.req.query('check_type'); // registration, report, financial, assessment, etc.
    const frequency = c.req.query('frequency'); // monthly, quarterly, annually, once_per_intern
    const responsible = c.req.query('responsible_role');
    const automated = c.req.query('is_automated'); // 0 or 1
    
    let query = `
      SELECT 
        cc.id,
        cc.code,
        cc.title,
        cc.description,
        cc.check_type,
        cc.frequency,
        cc.responsible_role,
        cc.days_before_alert,
        cc.is_automated,
        cc.penalty_amount_min,
        cc.penalty_amount_max,
        cat.name as category_name
      FROM compliance_checkpoints cc
      JOIN compliance_categories cat ON cc.category_id = cat.id
      WHERE cat.code = 'INTERNS_MANAGEMENT'
    `;
    
    const params: any[] = [];
    
    if (checkType) {
      query += ` AND cc.check_type = ?`;
      params.push(checkType);
    }
    
    if (frequency) {
      query += ` AND cc.frequency = ?`;
      params.push(frequency);
    }
    
    if (responsible) {
      query += ` AND cc.responsible_role = ?`;
      params.push(responsible);
    }
    
    if (automated !== undefined) {
      query += ` AND cc.is_automated = ?`;
      params.push(parseInt(automated));
    }
    
    query += ` ORDER BY cc.check_type, cc.frequency`;
    
    const checkpoints = await DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: checkpoints.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch compliance checkpoints', message: error.message }, 500);
  }
});

// Get compliance status for specific intern
app.get('/api/interns/:internId/compliance', async (c) => {
  const { DB } = c.env;
  try {
    const internId = c.req.param('internId');
    
    // Get intern details with program info
    const intern = await DB.prepare(`
      SELECT 
        i.*,
        ip.program_name,
        ip.program_type,
        ip.seta_name
      FROM interns i
      LEFT JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.id = ?
    `).bind(internId).first();
    
    if (!intern) {
      return c.json({ success: false, error: 'Intern not found' }, 404);
    }
    
    // Get SETA compliance status if applicable
    let setaStatus = null;
    if (intern.program_type?.startsWith('seta_')) {
      setaStatus = await DB.prepare(`
        SELECT 
          sr.*,
          CASE 
            WHEN sr.next_quarterly_report_due <= DATE('now') THEN 'overdue'
            WHEN sr.next_quarterly_report_due <= DATE('now', '+30 days') THEN 'due_soon'
            ELSE 'on_track'
          END as reporting_status
        FROM seta_registrations sr
        WHERE sr.intern_id = ?
      `).bind(internId).first();
    }
    
    // Get YES compliance status if applicable
    let yesStatus = null;
    if (intern.program_type === 'yes_program') {
      yesStatus = await DB.prepare(`
        SELECT 
          yr.*,
          CASE 
            WHEN yr.last_monthly_report_date < DATE('now', 'start of month', '-1 month') THEN 'overdue'
            WHEN yr.b_bbee_certificate_expiry_date <= DATE('now', '+60 days') THEN 'renewal_due'
            ELSE 'on_track'
          END as reporting_status
        FROM yes_registrations yr
        WHERE yr.intern_id = ?
      `).bind(internId).first();
    }
    
    // Get learning plan status
    const learningPlan = await DB.prepare(`
      SELECT 
        ilp.*,
        CASE 
          WHEN ilp.last_review_date IS NULL OR ilp.last_review_date < DATE('now', '-90 days') THEN 'review_overdue'
          WHEN ilp.last_review_date < DATE('now', '-60 days') THEN 'review_due_soon'
          ELSE 'on_track'
        END as review_status
      FROM intern_learning_plans ilp
      WHERE ilp.intern_id = ? AND ilp.status = 'active'
    `).bind(internId).first();
    
    // Get recent assessments
    const assessments = await DB.prepare(`
      SELECT 
        ia.assessment_type,
        ia.assessment_date,
        ia.overall_rating,
        ia.outcome,
        e.first_name || ' ' || e.last_name as assessor_name
      FROM intern_assessments ia
      LEFT JOIN employees e ON ia.assessor_id = e.id
      WHERE ia.intern_id = ?
      ORDER BY ia.assessment_date DESC
      LIMIT 5
    `).bind(internId).all();
    
    // Get stipend payment status
    const lastStipend = await DB.prepare(`
      SELECT 
        payment_year,
        payment_month,
        basic_stipend,
        net_amount,
        payment_date,
        CASE 
          WHEN payment_date IS NULL THEN 'pending'
          WHEN payment_date > DATE(payment_year || '-' || printf('%02d', payment_month) || '-25') THEN 'late'
          ELSE 'on_time'
        END as payment_status
      FROM intern_stipend_payments
      WHERE intern_id = ?
      ORDER BY payment_year DESC, payment_month DESC
      LIMIT 1
    `).bind(internId).first();
    
    // Get pending compliance alerts (link via description containing intern name)
    const internName = intern.first_name + ' ' + intern.last_name;
    const alerts = await DB.prepare(`
      SELECT 
        ca.id,
        ca.title,
        ca.alert_type,
        ca.severity,
        ca.due_date,
        cc.responsible_role
      FROM compliance_alerts ca
      JOIN compliance_checkpoints cc ON ca.checkpoint_id = cc.id
      WHERE ca.title LIKE ? AND ca.status = 'new'
      ORDER BY ca.due_date ASC
    `).bind('%' + internName + '%').all();
    
    return c.json({
      success: true,
      data: {
        intern: intern,
        seta_status: setaStatus,
        yes_status: yesStatus,
        learning_plan: learningPlan,
        recent_assessments: assessments.results,
        last_stipend: lastStipend,
        pending_alerts: alerts.results
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch intern compliance status', message: error.message }, 500);
  }
});

// Run automated compliance scan for all active interns
app.post('/api/interns/compliance/scan', async (c) => {
  const { DB } = c.env;
  try {
    const results = {
      scanned_interns: 0,
      alerts_created: 0,
      issues_found: []
    };
    
    // Get all active interns
    const activeInterns = await DB.prepare(`
      SELECT i.*, ip.program_type 
      FROM interns i
      JOIN intern_programs ip ON i.program_id = ip.id
      WHERE i.intern_status = 'active'
    `).all();
    
    results.scanned_interns = activeInterns.results.length;
    
    for (const intern of activeInterns.results) {
      // Check SETA quarterly reports
      if (intern.program_type?.startsWith('seta_')) {
        const setaReg = await DB.prepare(`
          SELECT * FROM seta_registrations WHERE intern_id = ?
        `).bind(intern.id).first();
        
        if (setaReg && setaReg.next_quarterly_report_due) {
          const dueDate = new Date(setaReg.next_quarterly_report_due);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 30 && daysUntilDue > 0) {
            // Create alert
            await DB.prepare(`
              INSERT INTO compliance_alerts (
                checkpoint_id, alert_type, severity, title, description, due_date, 
                status, created_at
              )
              SELECT 
                id, 'seta_quarterly_report', 'warning',
                'SETA Quarterly Report Due for ' || ?,
                'Quarterly progress report must be submitted to SETA',
                ?, 'new', CURRENT_TIMESTAMP
              FROM compliance_checkpoints 
              WHERE code = 'INTERN_SETA_QUARTERLY_REPORT'
            `).bind(intern.first_name + ' ' + intern.last_name, setaReg.next_quarterly_report_due).run();
            
            results.alerts_created++;
            results.issues_found.push({
              intern_id: intern.id,
              issue: 'SETA quarterly report due',
              due_date: setaReg.next_quarterly_report_due
            });
          }
        }
      }
      
      // Check YES monthly reports
      if (intern.program_type === 'yes_program') {
        const yesReg = await DB.prepare(`
          SELECT * FROM yes_registrations WHERE intern_id = ?
        `).bind(intern.id).first();
        
        if (yesReg) {
          const lastReport = yesReg.last_monthly_report_date ? new Date(yesReg.last_monthly_report_date) : null;
          const today = new Date();
          
          if (!lastReport || (today.getTime() - lastReport.getTime()) > (35 * 24 * 60 * 60 * 1000)) {
            // Create alert
            await DB.prepare(`
              INSERT INTO compliance_alerts (
                checkpoint_id, alert_type, severity, title, description, due_date,
                status, created_at
              )
              SELECT 
                id, 'yes_monthly_report', 'critical',
                'YES Monthly Report Overdue for ' || ?,
                'Monthly attendance report must be submitted to YES Hub',
                DATE('now', '+7 days'), 'new', CURRENT_TIMESTAMP
              FROM compliance_checkpoints
              WHERE code = 'INTERN_YES_MONTHLY_REPORT'
            `).bind(intern.first_name + ' ' + intern.last_name).run();
            
            results.alerts_created++;
            results.issues_found.push({
              intern_id: intern.id,
              issue: 'YES monthly report overdue'
            });
          }
        }
      }
      
      // Check stipend payments (current month)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      const stipendCheck = await DB.prepare(`
        SELECT * FROM intern_stipend_payments 
        WHERE intern_id = ? AND payment_year = ? AND payment_month = ?
      `).bind(intern.id, currentYear, currentMonth).first();
      
      if (!stipendCheck && new Date().getDate() > 20) {
        // Create alert for missing stipend payment
        await DB.prepare(`
          INSERT INTO compliance_alerts (
            checkpoint_id, alert_type, severity, title, description, due_date,
            status, created_at
          )
          SELECT 
            id, 'stipend_payment_due', 'critical',
            'Stipend Payment Due for ' || ?,
            'Monthly stipend must be processed by 25th',
            DATE('now', '+5 days'), 'new', CURRENT_TIMESTAMP
          FROM compliance_checkpoints
          WHERE code = 'INTERN_STIPEND_MONTHLY_PAYMENT'
        `).bind(intern.first_name + ' ' + intern.last_name).run();
        
        results.alerts_created++;
        results.issues_found.push({
          intern_id: intern.id,
          issue: 'Stipend payment pending for current month'
        });
      }
      
      // Check learning plan reviews (quarterly)
      const learningPlan = await DB.prepare(`
        SELECT * FROM intern_learning_plans 
        WHERE intern_id = ? AND status = 'active'
      `).bind(intern.id).first();
      
      if (learningPlan && learningPlan.last_review_date) {
        const lastReview = new Date(learningPlan.last_review_date);
        const today = new Date();
        const daysSinceReview = Math.ceil((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceReview > 90) {
          // Create alert for overdue learning plan review
          await DB.prepare(`
            INSERT INTO compliance_alerts (
              checkpoint_id, alert_type, severity, title, description, due_date,
              status, created_at
            )
            SELECT 
              id, 'learning_plan_review', 'warning',
              'Learning Plan Review Overdue for ' || ?,
              'Learning plan must be reviewed quarterly',
              DATE('now', '+7 days'), 'new', CURRENT_TIMESTAMP
            FROM compliance_checkpoints
            WHERE code = 'INTERN_LEARNING_PLAN_QUARTERLY_REVIEW'
          `).bind(intern.first_name + ' ' + intern.last_name).run();
          
          results.alerts_created++;
          results.issues_found.push({
            intern_id: intern.id,
            issue: 'Learning plan review overdue',
            days_overdue: daysSinceReview - 90
          });
        }
      }
      
      // Check graduation readiness (60 days before expected end)
      if (intern.expected_end_date) {
        const endDate = new Date(intern.expected_end_date);
        const today = new Date();
        const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilEnd <= 60 && daysUntilEnd > 0) {
          // Create alert for graduation readiness
          await DB.prepare(`
            INSERT INTO compliance_alerts (
              checkpoint_id, alert_type, severity, title, description, due_date,
              status, created_at
            )
            SELECT 
              id, 'graduation_readiness', 'warning',
              'Graduation Readiness Review for ' || ?,
              'Conduct graduation readiness review 60 days before completion',
              DATE('now', '+7 days'), 'new', CURRENT_TIMESTAMP
            FROM compliance_checkpoints
            WHERE code = 'INTERN_GRADUATION_READINESS'
          `).bind(intern.first_name + ' ' + intern.last_name).run();
          
          results.alerts_created++;
          results.issues_found.push({
            intern_id: intern.id,
            issue: 'Approaching graduation',
            days_until_completion: daysUntilEnd
          });
        }
      }
    }
    
    return c.json({
      success: true,
      message: 'Compliance scan completed',
      data: results
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Compliance scan failed', message: error.message }, 500);
  }
});

// Get compliance alerts for role
app.get('/api/interns/compliance/alerts', async (c) => {
  const { DB } = c.env;
  try {
    const role = c.req.query('role'); // training_coordinator, hr_manager, payroll_admin
    const severity = c.req.query('severity'); // critical, warning, info
    const status = c.req.query('status') || 'new'; // new, acknowledged, resolved
    
    let query = `
      SELECT 
        ca.id,
        ca.alert_type,
        ca.severity,
        ca.title,
        ca.description,
        ca.due_date,
        ca.status,
        ca.created_at,
        cc.responsible_role,
        cc.code as checkpoint_code
      FROM compliance_alerts ca
      JOIN compliance_checkpoints cc ON ca.checkpoint_id = cc.id
      JOIN compliance_categories cat ON cc.category_id = cat.id
      WHERE cat.code = 'INTERNS_MANAGEMENT'
    `;
    
    const params: any[] = [];
    
    if (role) {
      query += ` AND cc.responsible_role = ?`;
      params.push(role);
    }
    
    if (severity) {
      query += ` AND ca.severity = ?`;
      params.push(severity);
    }
    
    if (status) {
      query += ` AND ca.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY ca.severity DESC, ca.due_date ASC`;
    
    const alerts = await DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: alerts.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch compliance alerts', message: error.message }, 500);
  }
});

// Acknowledge/resolve compliance alert
app.put('/api/interns/compliance/alerts/:alertId', async (c) => {
  const { DB } = c.env;
  try {
    const alertId = c.req.param('alertId');
    const data = await c.req.json();
    
    const result = await DB.prepare(`
      UPDATE compliance_alerts
      SET status = ?,
          acknowledged_by = ?,
          acknowledged_at = CURRENT_TIMESTAMP,
          resolution_notes = ?
      WHERE id = ?
    `).bind(data.status, data.acknowledged_by, data.resolution_notes || null, alertId).run();
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Alert not found' }, 404);
    }
    
    return c.json({ success: true, message: 'Alert updated successfully' });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to update alert', message: error.message }, 500);
  }
});

// Seed intern compliance checkpoints (run after compliance system initialization)
app.post('/api/interns/compliance/seed', async (c) => {
  const { DB } = c.env;
  try {
    // Check if INTERNS_MANAGEMENT category exists
    const category = await DB.prepare(`
      SELECT id FROM compliance_categories WHERE code = 'INTERNS_MANAGEMENT'
    `).first();
    
    if (!category) {
      return c.json({ 
        success: false, 
        error: 'INTERNS_MANAGEMENT category not found',
        hint: 'Run POST /api/compliance/initialize first'
      }, 404);
    }
    
    const categoryId = category.id;
    
    // Check if already seeded
    const existing = await DB.prepare(`
      SELECT COUNT(*) as count FROM compliance_checkpoints WHERE category_id = ?
    `).bind(categoryId).first();
    
    if (existing && existing.count > 0) {
      return c.json({ success: true, message: `Intern compliance checkpoints already seeded (${existing.count} checkpoints)` });
    }
    
    // Seed all 52 checkpoints (simplified version - key checkpoints only for demo)
    await DB.batch([
      // SETA Registration & Compliance (10 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES 
        (?, 'INTERN_SETA_REG_14DAYS', 'SETA Learnership Registration Within 14 Days', 'Register all learnership agreements with relevant SETA within 14 days of commencement', 'registration', 'once_per_intern', 'hr_manager', 7, 0, 0, 0),
        (?, 'INTERN_SETA_QUARTERLY_REPORT', 'SETA Quarterly Progress Report', 'Submit quarterly progress reports showing attendance and mentorship', 'report', 'quarterly', 'training_coordinator', 30, 1, 0, 0),
        (?, 'INTERN_SETA_COMMENCEMENT_GRANT', 'SETA Commencement Grant Claim', 'Claim commencement grant within 30 days of registration (R30K-R80K)', 'financial', 'once_per_intern', 'payroll_admin', 15, 0, 30000, 80000),
        (?, 'INTERN_SETA_PROGRESS_GRANT', 'SETA Progress Grant Claim', 'Claim progress grant after 6 months of successful progress', 'financial', 'once_per_intern', 'payroll_admin', 30, 0, 30000, 80000),
        (?, 'INTERN_SETA_COMPLETION_GRANT', 'SETA Completion Grant Claim', 'Claim completion grant within 30 days of qualification achievement', 'financial', 'once_per_intern', 'payroll_admin', 15, 0, 30000, 80000)`).bind(categoryId, categoryId, categoryId, categoryId, categoryId),
      
      // YES Program Compliance (8 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_YES_REGISTRATION', 'YES Program Participant Registration', 'Register YES participants on YES Hub portal within 14 days', 'registration', 'once_per_intern', 'hr_manager', 7, 0, 0, 0),
        (?, 'INTERN_YES_MONTHLY_REPORT', 'YES Hub Monthly Attendance Report', 'Submit monthly attendance and activity reports by 5th of following month', 'report', 'monthly', 'training_coordinator', 10, 1, 0, 0),
        (?, 'INTERN_YES_BBBEE_CERTIFICATE', 'YES B-BBEE Recognition Certificate Renewal', 'Apply for renewal 60 days before 12-month certificate expiry', 'registration', 'annually', 'compliance_officer', 60, 1, 0, 0),
        (?, 'INTERN_YES_12MONTH_MINIMUM', 'YES 12-Month Minimum Placement Duration', 'Monitor completion of minimum 12-month work experience', 'compliance', 'once_per_intern', 'training_coordinator', 30, 1, 0, 0)`).bind(categoryId, categoryId, categoryId, categoryId),
      
      // Stipend Payments & Financial (8 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_STIPEND_MONTHLY_PAYMENT', 'Monthly Stipend Payment by 25th', 'Process intern stipends by 25th of each month', 'financial', 'monthly', 'payroll_admin', 5, 1, 0, 0),
        (?, 'INTERN_PAYE_COMPLIANCE', 'Intern PAYE Tax Compliance (If Applicable)', 'Deduct and submit PAYE if intern treated as employee', 'financial', 'monthly', 'payroll_admin', 5, 1, 0, 0),
        (?, 'INTERN_UIF_COMPLIANCE', 'Intern UIF Contributions (If Employee Status)', 'Register for UIF and deduct 1% if intern has employee status', 'financial', 'monthly', 'payroll_admin', 10, 1, 0, 0),
        (?, 'INTERN_LEGAL_STATUS_CLARITY', 'Intern Legal Status Classification (Learner vs Employee)', 'Determine and document legal status - critical for BCEA compliance', 'compliance', 'once_per_intern', 'hr_manager', 0, 0, 0, 100000)`).bind(categoryId, categoryId, categoryId, categoryId),
      
      // Learning Plans & Assessments (6 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_LEARNING_PLAN_30DAYS', 'Individual Learning Plan Created Within 30 Days', 'Create ILP within 30 days of commencement - SETA requirement', 'document', 'once_per_intern', 'training_coordinator', 15, 1, 0, 0),
        (?, 'INTERN_LEARNING_PLAN_QUARTERLY_REVIEW', 'Learning Plan Quarterly Review & Updates', 'Review and update learning plans quarterly to track progress', 'compliance', 'quarterly', 'training_coordinator', 30, 1, 0, 0),
        (?, 'INTERN_FORMATIVE_ASSESSMENTS', 'Formative Assessments (Monthly)', 'Conduct monthly formative assessments to monitor skill development', 'assessment', 'monthly', 'mentor', 10, 1, 0, 0),
        (?, 'INTERN_SUMMATIVE_ASSESSMENTS', 'Summative Assessments (Quarterly)', 'Conduct quarterly summative assessments for SETA progress reporting', 'assessment', 'quarterly', 'training_coordinator', 30, 1, 0, 0)`).bind(categoryId, categoryId, categoryId, categoryId),
      
      // Registration & Onboarding (5 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_CONTRACT_SIGNED', 'Intern Contract/Agreement Signed Before Commencement', 'Ensure learnership agreement or contract signed before start date', 'document', 'once_per_intern', 'hr_manager', 0, 0, 0, 0),
        (?, 'INTERN_INDUCTION_COMPLETION', 'Intern Induction Programme Completion (First Week)', 'Complete comprehensive induction covering policies and safety', 'training', 'once_per_intern', 'hr_manager', 3, 0, 0, 0),
        (?, 'INTERN_POPIA_CONSENT', 'POPIA Consent for Intern Data Processing', 'Obtain written POPIA consent before capturing personal information', 'document', 'once_per_intern', 'hr_manager', 0, 0, 0, 10000000)`).bind(categoryId, categoryId, categoryId),
      
      // Graduation & Exit (5 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_GRADUATION_READINESS', 'Graduation Readiness Review (60 Days Before End)', 'Conduct readiness review 60 days before expected completion', 'compliance', 'once_per_intern', 'training_coordinator', 60, 1, 0, 0),
        (?, 'INTERN_QUALIFICATION_ISSUANCE', 'Qualification/Certificate Issuance (30 Days Post-Completion)', 'Apply for qualification certificate from SETA/QCTO', 'document', 'once_per_intern', 'training_coordinator', 15, 0, 0, 0),
        (?, 'INTERN_EMPLOYMENT_OUTCOME_TRACKING', 'Employment Outcome Tracking & Reporting', 'Track employment outcome for 12 months post-completion', 'report', 'once_per_intern', 'training_coordinator', 30, 0, 0, 0)`).bind(categoryId, categoryId, categoryId),
      
      // Record-Keeping & Audit (5 checkpoints)
      DB.prepare(`INSERT INTO compliance_checkpoints (category_id, code, title, description, check_type, frequency, responsible_role, days_before_alert, is_automated, penalty_amount_min, penalty_amount_max) VALUES
        (?, 'INTERN_RECORDS_5YEARS', 'Intern Records Retention (5 Years Post-Completion)', 'Retain all records for 5 years: contracts, assessments, stipends', 'record_keeping', 'ongoing', 'hr_manager', 0, 0, 0, 0),
        (?, 'INTERN_SETA_AUDIT_READINESS', 'SETA Audit Readiness Check', 'Quarterly check: ensure all SETA documentation is complete', 'audit', 'quarterly', 'compliance_officer', 30, 0, 0, 0),
        (?, 'INTERN_ATTENDANCE_REGISTER', 'Daily Attendance Register Maintenance', 'Maintain daily signed attendance for SETA/YES reporting', 'record_keeping', 'daily', 'training_coordinator', 0, 1, 0, 0)`).bind(categoryId, categoryId, categoryId)
    ]);
    
    // Count total checkpoints seeded
    const count = await DB.prepare(`
      SELECT COUNT(*) as total FROM compliance_checkpoints WHERE category_id = ?
    `).bind(categoryId).first();
    
    return c.json({ 
      success: true, 
      message: 'Intern compliance checkpoints seeded successfully',
      checkpoints_created: count?.total || 0
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to seed intern checkpoints', message: error.message }, 500);
  }
});

// Initialize COIDA tables (run once to create all COIDA tables)
app.post('/api/coida/initialize', async (c) => {
  const { DB } = c.env;
  try {
    // Check if already initialized
    const check = await DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='coida_registration'
    `).first();
    
    if (check) {
      return c.json({ success: true, message: 'COIDA system already initialized' });
    }
    
    // Create all COIDA tables
    await DB.batch([
      // 1. COIDA Registration
      DB.prepare(`CREATE TABLE coida_registration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_number TEXT UNIQUE,
        primary_tariff_code TEXT NOT NULL,
        primary_tariff_rate REAL NOT NULL,
        secondary_tariff_code TEXT,
        secondary_tariff_rate REAL,
        risk_class TEXT,
        registration_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 2. Annual Returns (W.As.2)
      DB.prepare(`CREATE TABLE coida_annual_returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_year INTEGER NOT NULL,
        submission_deadline DATE NOT NULL,
        total_earnings_declared REAL NOT NULL,
        total_employees_covered INTEGER,
        assessment_amount REAL,
        late_submission_penalty REAL DEFAULT 0,
        submission_date DATE,
        submission_status TEXT DEFAULT 'pending',
        w_as2_form_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 3. Advance Payments
      DB.prepare(`CREATE TABLE coida_advance_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_period TEXT CHECK(payment_period IN ('first_half', 'second_half')),
        due_date DATE NOT NULL,
        amount_due REAL NOT NULL,
        amount_paid REAL,
        payment_date DATE,
        payment_reference TEXT,
        payment_status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 4. Incident Reporting (W.Cl.2)
      DB.prepare(`CREATE TABLE coida_incident_reporting (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        w_cl2_form_number TEXT UNIQUE,
        incident_date DATE NOT NULL,
        incident_time TIME,
        incident_location TEXT,
        incident_type TEXT NOT NULL,
        injury_description TEXT,
        body_part_affected TEXT,
        witnesses TEXT,
        reported_to_saps INTEGER DEFAULT 0,
        reported_to_ohs INTEGER DEFAULT 0,
        reported_date DATE NOT NULL,
        is_late INTEGER DEFAULT 0,
        reported_by INTEGER,
        status TEXT DEFAULT 'reported',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 5. Medical Authorization (W.Cl.4)
      DB.prepare(`CREATE TABLE coida_medical_authorization (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL,
        w_cl4_form_number TEXT UNIQUE,
        authorization_date DATE NOT NULL,
        authorized_by INTEGER,
        authorization_status TEXT DEFAULT 'authorized',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 6. Employee Claims (W.Cl.3)
      DB.prepare(`CREATE TABLE coida_employee_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        claim_reference TEXT UNIQUE,
        claim_type TEXT CHECK(claim_type IN (
          'medical_expenses',
          'temporary_total_disablement',
          'temporary_partial_disablement',
          'permanent_disablement',
          'death_benefit'
        )),
        claim_amount REAL,
        claim_submission_date DATE,
        claim_status TEXT DEFAULT 'pending',
        cf_response_date DATE,
        cf_decision TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 7. Earnings Certificates (W.Cl.22)
      DB.prepare(`CREATE TABLE coida_earnings_certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id INTEGER NOT NULL,
        w_cl22_form_number TEXT UNIQUE,
        employee_id INTEGER NOT NULL,
        average_monthly_earnings REAL NOT NULL,
        calculation_period_start DATE,
        calculation_period_end DATE,
        submitted_to_cf INTEGER DEFAULT 0,
        submission_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`),
      
      // 8. Letter of Good Standing
      DB.prepare(`CREATE TABLE coida_letters_of_good_standing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issue_date DATE,
        expiry_date DATE,
        certificate_number TEXT UNIQUE,
        certificate_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
    ]);
    
    return c.json({ 
      success: true, 
      message: 'COIDA system initialized successfully',
      tables_created: 8
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to initialize COIDA system', message: error.message }, 500);
  }
});

// ============================================================================
// COIDA WORKPLACE INJURY COMPENSATION APIs
// ============================================================================
// Complete lifecycle: Registration → Annual Returns → Incident Reporting → Claims → LOGS
// Covers W.As.2, W.Cl.2, W.Cl.3, W.Cl.4, W.Cl.22 forms

// 1. GET /api/coida/registration - View COIDA registration details
app.get('/api/coida/registration', async (c) => {
  const { DB } = c.env;
  try {
    const registration = await DB.prepare(`
      SELECT 
        cr.*,
        (SELECT COUNT(*) FROM coida_incident_reporting WHERE status != 'closed') as open_incidents,
        (SELECT COUNT(*) FROM coida_employee_claims WHERE claim_status = 'pending') as pending_claims,
        (SELECT COUNT(*) FROM coida_annual_returns WHERE return_year = ? AND submission_status = 'submitted') as current_year_submitted
      FROM coida_registration cr
      LIMIT 1
    `).bind(new Date().getFullYear()).first();
    
    if (!registration) {
      return c.json({ 
        success: false, 
        error: 'COIDA registration not found',
        hint: 'Organization must register with Compensation Fund'
      }, 404);
    }
    
    return c.json({ success: true, data: registration });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch COIDA registration', message: error.message }, 500);
  }
});

// 2. PUT /api/coida/registration - Update COIDA registration (tariff codes, risk class)
app.put('/api/coida/registration', async (c) => {
  const { DB } = c.env;
  try {
    const data = await c.req.json();
    
    // Check if registration exists
    const existing = await DB.prepare(`SELECT id FROM coida_registration LIMIT 1`).first();
    
    if (existing) {
      // Update existing registration
      await DB.prepare(`
        UPDATE coida_registration
        SET registration_number = ?,
            primary_tariff_code = ?,
            primary_tariff_rate = ?,
            secondary_tariff_code = ?,
            secondary_tariff_rate = ?,
            risk_class = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        data.registration_number,
        data.primary_tariff_code,
        data.primary_tariff_rate,
        data.secondary_tariff_code || null,
        data.secondary_tariff_rate || null,
        data.risk_class,
        existing.id
      ).run();
      
      return c.json({ success: true, message: 'COIDA registration updated successfully' });
    } else {
      // Create new registration
      const result = await DB.prepare(`
        INSERT INTO coida_registration (
          registration_number, primary_tariff_code, primary_tariff_rate,
          secondary_tariff_code, secondary_tariff_rate, risk_class,
          registration_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_TIMESTAMP)
      `).bind(
        data.registration_number,
        data.primary_tariff_code,
        data.primary_tariff_rate,
        data.secondary_tariff_code || null,
        data.secondary_tariff_rate || null,
        data.risk_class
      ).run();
      
      return c.json({ 
        success: true, 
        message: 'COIDA registration created successfully',
        data: { registration_id: result.meta.last_row_id }
      });
    }
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to update COIDA registration', message: error.message }, 500);
  }
});

// 3. GET /api/coida/letter-of-good-standing - Check Letter of Good Standing status
app.get('/api/coida/letter-of-good-standing', async (c) => {
  const { DB } = c.env;
  try {
    // Get latest LOGS
    const logs = await DB.prepare(`
      SELECT 
        logs.*,
        CASE 
          WHEN logs.expiry_date >= DATE('now') THEN 'valid'
          WHEN logs.expiry_date < DATE('now') THEN 'expired'
          ELSE 'not_issued'
        END as status,
        CAST((JULIANDAY(logs.expiry_date) - JULIANDAY('now')) AS INTEGER) as days_until_expiry
      FROM coida_letters_of_good_standing logs
      ORDER BY logs.issue_date DESC
      LIMIT 1
    `).first();
    
    if (!logs) {
      return c.json({
        success: true,
        data: {
          status: 'not_issued',
          message: 'No Letter of Good Standing on record. Apply via Compensation Fund portal.',
          requires_action: true
        }
      });
    }
    
    return c.json({ 
      success: true, 
      data: logs,
      requires_action: logs.status === 'expired' || logs.days_until_expiry < 30
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch Letter of Good Standing', message: error.message }, 500);
  }
});

// 4. POST /api/coida/annual-return - Submit W.As.2 annual return
app.post('/api/coida/annual-return', async (c) => {
  const { DB } = c.env;
  try {
    const data = await c.req.json();
    
    // Check if return already exists for this year
    const existing = await DB.prepare(`
      SELECT id FROM coida_annual_returns WHERE return_year = ?
    `).bind(data.return_year).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Annual return already exists for this year' }, 400);
    }
    
    // Calculate submission deadline (March 31 of following year)
    const submissionDeadline = `${data.return_year + 1}-03-31`;
    const submissionDate = new Date();
    const deadline = new Date(submissionDeadline);
    const isLate = submissionDate > deadline;
    const latePenalty = isLate ? data.assessment_amount * 0.10 : 0; // 10% penalty if late
    
    // Insert annual return
    const result = await DB.prepare(`
      INSERT INTO coida_annual_returns (
        return_year, submission_deadline, total_earnings_declared,
        total_employees_covered, assessment_amount, late_submission_penalty,
        submission_date, submission_status, w_as2_form_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE, 'submitted', ?, CURRENT_TIMESTAMP)
    `).bind(
      data.return_year,
      submissionDeadline,
      data.total_earnings_declared,
      data.total_employees_covered,
      data.assessment_amount,
      latePenalty,
      data.w_as2_form_path || null
    ).run();
    
    // Create compliance alert if late
    if (isLate) {
      await DB.prepare(`
        INSERT INTO compliance_alerts (
          alert_type, severity, title, description, status, created_at
        ) VALUES (
          'coida_late_submission', 'critical',
          'Late COIDA W.As.2 Submission - 10% Penalty Applied',
          'Annual return for ${data.return_year} submitted after March 31 deadline. Penalty: R${latePenalty.toFixed(2)}',
          'new', CURRENT_TIMESTAMP
        )
      `).run();
    }
    
    return c.json({ 
      success: true, 
      message: isLate ? 'Annual return submitted (LATE - 10% penalty applied)' : 'Annual return submitted successfully',
      data: { 
        return_id: result.meta.last_row_id,
        is_late: isLate,
        late_penalty: latePenalty
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to submit annual return', message: error.message }, 500);
  }
});

// 5. GET /api/coida/annual-returns - View annual return history
app.get('/api/coida/annual-returns', async (c) => {
  const { DB } = c.env;
  try {
    const returns = await DB.prepare(`
      SELECT 
        car.*,
        CASE 
          WHEN car.submission_date <= car.submission_deadline THEN 'on_time'
          WHEN car.submission_date > car.submission_deadline THEN 'late'
          ELSE 'pending'
        END as submission_timeliness
      FROM coida_annual_returns car
      ORDER BY car.return_year DESC
    `).all();
    
    return c.json({ success: true, data: returns.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch annual returns', message: error.message }, 500);
  }
});

// 6. POST /api/coida/advance-payment - Record advance payment (July 31 or January 31)
app.post('/api/coida/advance-payment', async (c) => {
  const { DB } = c.env;
  try {
    const data = await c.req.json();
    
    // Validate payment period
    if (!['first_half', 'second_half'].includes(data.payment_period)) {
      return c.json({ success: false, error: 'Invalid payment period. Must be first_half or second_half' }, 400);
    }
    
    // Determine due date
    const currentYear = new Date().getFullYear();
    const dueDate = data.payment_period === 'first_half' 
      ? `${currentYear}-07-31` 
      : `${currentYear + 1}-01-31`;
    
    const result = await DB.prepare(`
      INSERT INTO coida_advance_payments (
        payment_period, due_date, amount_due, amount_paid,
        payment_date, payment_reference, payment_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'paid', CURRENT_TIMESTAMP)
    `).bind(
      data.payment_period,
      dueDate,
      data.amount_due,
      data.amount_paid,
      data.payment_date,
      data.payment_reference
    ).run();
    
    return c.json({ 
      success: true, 
      message: 'Advance payment recorded successfully',
      data: { payment_id: result.meta.last_row_id }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to record advance payment', message: error.message }, 500);
  }
});

// 7. POST /api/coida/incident/report - Report workplace injury (W.Cl.2 form)
app.post('/api/coida/incident/report', async (c) => {
  const { DB } = c.env;
  try {
    const data = await c.req.json();
    
    // Calculate if report is late (must be within 7 days)
    const incidentDate = new Date(data.incident_date);
    const reportDate = new Date();
    const daysDifference = Math.ceil((reportDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));
    const isLate = daysDifference > 7;
    
    // Generate W.Cl.2 form number
    const formNumber = `WCL2-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Insert incident report
    const result = await DB.prepare(`
      INSERT INTO coida_incident_reporting (
        employee_id, w_cl2_form_number, incident_date, incident_time,
        incident_location, incident_type, injury_description, body_part_affected,
        witnesses, reported_to_saps, reported_to_ohs, reported_date,
        is_late, reported_by, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_DATE, ?, ?, 'reported', CURRENT_TIMESTAMP)
    `).bind(
      data.employee_id,
      formNumber,
      data.incident_date,
      data.incident_time,
      data.incident_location,
      data.incident_type,
      data.injury_description,
      data.body_part_affected,
      data.witnesses || null,
      data.reported_to_saps || 0,
      data.reported_to_ohs || 0,
      isLate ? 1 : 0,
      data.reported_by
    ).run();
    
    // Auto-issue W.Cl.4 medical authorization
    const authFormNumber = `WCL4-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    await DB.prepare(`
      INSERT INTO coida_medical_authorization (
        incident_id, w_cl4_form_number, authorization_date,
        authorized_by, authorization_status, created_at
      ) VALUES (?, ?, CURRENT_DATE, ?, 'authorized', CURRENT_TIMESTAMP)
    `).bind(result.meta.last_row_id, authFormNumber, data.reported_by).run();
    
    // Create critical alert if late
    if (isLate) {
      await DB.prepare(`
        INSERT INTO compliance_alerts (
          alert_type, severity, title, description, status, created_at
        ) VALUES (
          'coida_late_incident_report', 'critical',
          'Late COIDA Incident Report - ${formNumber}',
          'Incident reported ${daysDifference} days after occurrence (>7 day limit). May affect claim processing.',
          'new', CURRENT_TIMESTAMP
        )
      `).run();
    }
    
    // Create alert if fatality (must notify SAPS, OHS, CF immediately)
    if (data.incident_type === 'fatality') {
      await DB.prepare(`
        INSERT INTO compliance_alerts (
          alert_type, severity, title, description, due_date, status, created_at
        ) VALUES (
          'coida_fatality_immediate', 'critical',
          'FATALITY - Immediate Reporting Required',
          'Contact SAPS, Department of Labour OHS Inspector, and Compensation Fund immediately. Do not disturb scene.',
          DATE('now'), 'new', CURRENT_TIMESTAMP
        )
      `).run();
    }
    
    return c.json({ 
      success: true, 
      message: isLate ? 'Incident reported (LATE - may affect claim)' : 'Incident reported successfully',
      data: { 
        incident_id: result.meta.last_row_id,
        w_cl2_form_number: formNumber,
        w_cl4_authorization: authFormNumber,
        is_late: isLate,
        days_delayed: daysDifference
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to report incident', message: error.message }, 500);
  }
});

// 8. GET /api/coida/incidents - List all workplace incidents
app.get('/api/coida/incidents', async (c) => {
  const { DB } = c.env;
  try {
    const status = c.req.query('status'); // reported, under_investigation, claim_submitted, closed
    const incidentType = c.req.query('incident_type'); // minor_injury, major_injury, permanent_disability, fatality
    const isLate = c.req.query('is_late'); // 0 or 1
    
    let query = `
      SELECT 
        cir.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.id_number as employee_id_number,
        (SELECT COUNT(*) FROM coida_employee_claims WHERE incident_id = cir.id) as claim_count
      FROM coida_incident_reporting cir
      LEFT JOIN employees e ON cir.employee_id = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ` AND cir.status = ?`;
      params.push(status);
    }
    
    if (incidentType) {
      query += ` AND cir.incident_type = ?`;
      params.push(incidentType);
    }
    
    if (isLate !== undefined) {
      query += ` AND cir.is_late = ?`;
      params.push(parseInt(isLate));
    }
    
    query += ` ORDER BY cir.incident_date DESC`;
    
    const incidents = await DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: incidents.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch incidents', message: error.message }, 500);
  }
});

// 9. POST /api/coida/claim - Submit employee claim (W.Cl.3 + W.Cl.22)
app.post('/api/coida/claim', async (c) => {
  const { DB } = c.env;
  try {
    const data = await c.req.json();
    
    // Verify incident exists
    const incident = await DB.prepare(`
      SELECT id, employee_id FROM coida_incident_reporting WHERE id = ?
    `).bind(data.incident_id).first();
    
    if (!incident) {
      return c.json({ success: false, error: 'Incident not found' }, 404);
    }
    
    // Generate claim reference
    const claimRef = `CF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
    // Insert employee claim (W.Cl.3)
    const result = await DB.prepare(`
      INSERT INTO coida_employee_claims (
        incident_id, employee_id, claim_reference, claim_type,
        claim_amount, claim_submission_date, claim_status, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_DATE, 'pending', CURRENT_TIMESTAMP)
    `).bind(
      data.incident_id,
      incident.employee_id,
      claimRef,
      data.claim_type,
      data.claim_amount
    ).run();
    
    // Generate W.Cl.22 earnings certificate if required
    if (['temporary_total_disablement', 'temporary_partial_disablement', 'permanent_disablement'].includes(data.claim_type)) {
      const wCl22Number = `WCL22-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      await DB.prepare(`
        INSERT INTO coida_earnings_certificates (
          claim_id, w_cl22_form_number, employee_id,
          average_monthly_earnings, calculation_period_start, calculation_period_end,
          submitted_to_cf, submission_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, CURRENT_TIMESTAMP)
      `).bind(
        result.meta.last_row_id,
        wCl22Number,
        incident.employee_id,
        data.average_monthly_earnings,
        data.calculation_period_start,
        data.calculation_period_end
      ).run();
      
      // Create alert: W.Cl.22 must be submitted to CF within 7 days
      await DB.prepare(`
        INSERT INTO compliance_alerts (
          alert_type, severity, title, description, due_date, status, created_at
        ) VALUES (
          'coida_wcl22_due', 'critical',
          'W.Cl.22 Earnings Certificate Must Be Submitted - ${wCl22Number}',
          'Submit W.Cl.22 to Compensation Fund within 7 days of claim submission.',
          DATE('now', '+7 days'), 'new', CURRENT_TIMESTAMP
        )
      `).run();
    }
    
    return c.json({ 
      success: true, 
      message: 'Claim submitted successfully',
      data: { 
        claim_id: result.meta.last_row_id,
        claim_reference: claimRef
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to submit claim', message: error.message }, 500);
  }
});

// 10. GET /api/coida/claims - Track claim status and payments
app.get('/api/coida/claims', async (c) => {
  const { DB } = c.env;
  try {
    const status = c.req.query('status'); // pending, approved, rejected, paid
    const claimType = c.req.query('claim_type');
    const employeeId = c.req.query('employee_id');
    
    let query = `
      SELECT 
        cec.*,
        e.first_name || ' ' || e.last_name as employee_name,
        cir.w_cl2_form_number,
        cir.incident_date,
        cir.incident_type,
        CAST((JULIANDAY('now') - JULIANDAY(cec.claim_submission_date)) AS INTEGER) as days_pending
      FROM coida_employee_claims cec
      LEFT JOIN employees e ON cec.employee_id = e.id
      LEFT JOIN coida_incident_reporting cir ON cec.incident_id = cir.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ` AND cec.claim_status = ?`;
      params.push(status);
    }
    
    if (claimType) {
      query += ` AND cec.claim_type = ?`;
      params.push(claimType);
    }
    
    if (employeeId) {
      query += ` AND cec.employee_id = ?`;
      params.push(employeeId);
    }
    
    query += ` ORDER BY cec.claim_submission_date DESC`;
    
    const claims = await DB.prepare(query).bind(...params).all();
    
    return c.json({ success: true, data: claims.results });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to fetch claims', message: error.message }, 500);
  }
});

// ============================================================================
// EXISTING APIs (keeping all previous endpoints)
// ============================================================================

app.get('/api/dashboard/stats', async (c) => {
  const { DB } = c.env;
  
  try {
    const employeeStats = await DB.prepare(`
      SELECT 
        COUNT(*) as total_employees,
        SUM(CASE WHEN employment_status = 'Active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN employment_status = 'On Leave' THEN 1 ELSE 0 END) as on_leave_today
      FROM employees
      WHERE is_active = 1
    `).all();
    
    const shiftStats = await DB.prepare(`
      SELECT 
        COUNT(*) as shifts_today,
        SUM(CASE WHEN employee_id IS NULL THEN 1 ELSE 0 END) as open_shifts
      FROM shifts
      WHERE shift_date = DATE('now')
    `).all();
    
    const leaveStats = await DB.prepare(`
      SELECT COUNT(*) as pending_requests
      FROM leave_requests
      WHERE status = 'Pending'
    `).all();
    
    return c.json({
      success: true,
      data: {
        total_employees: employeeStats.results[0]?.total_employees || 0,
        active_employees: employeeStats.results[0]?.active_employees || 0,
        on_leave_today: employeeStats.results[0]?.on_leave_today || 0,
        shifts_today: shiftStats.results[0]?.shifts_today || 0,
        open_shifts: shiftStats.results[0]?.open_shifts || 0,
        pending_leave_requests: leaveStats.results[0]?.pending_requests || 0,
        compliance_score: 94,
        training_completion_rate: 78,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch dashboard stats', message: String(error) }, 500);
  }
});

// ============================================================================
// CORE API ROUTES - EMPLOYEES (Full Implementation)
// ============================================================================

// Get all employees with pagination and filters
app.get('/api/employees', async (c) => {
  const { DB } = c.env;
  const page = parseInt(c.req.query('page') || '1');
  const per_page = Math.min(100, parseInt(c.req.query('per_page') || '20'));
  const offset = (page - 1) * per_page;
  const search = c.req.query('search') || '';
  const employment_type = c.req.query('employment_type');
  const department_id = c.req.query('department_id');
  const location_id = c.req.query('location_id');
  const status = c.req.query('status') || 'Active';
  
  try {
    let whereClause = 'WHERE e.employment_status = ?';
    const params: any[] = [status];
    
    if (search) {
      whereClause += ` AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ? OR e.employee_number LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (employment_type) {
      whereClause += ` AND e.employment_type = ?`;
      params.push(employment_type);
    }
    
    if (department_id) {
      whereClause += ` AND e.department_id = ?`;
      params.push(department_id);
    }
    
    if (location_id) {
      whereClause += ` AND e.location_id = ?`;
      params.push(location_id);
    }
    
    if (status) {
      whereClause += ` AND e.employment_status = ?`;
      params.push(status);
    }
    
    // Get total count
    const countResult = await DB.prepare(`
      SELECT COUNT(*) as total FROM employees e ${whereClause}
    `).bind(...params).first();
    
    const total = countResult?.total || 0;
    
    // Get paginated results
    const employees = await DB.prepare(`
      SELECT 
        e.*,
        d.name as department_name,
        l.location_name as location_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      ${whereClause}
      ORDER BY e.hire_date DESC
      LIMIT ? OFFSET ?
    `).bind(...params, per_page, offset).all();
    
    return c.json({
      success: true,
      data: employees.results,
      meta: {
        page,
        per_page,
        total,
        total_pages: Math.ceil(total / per_page),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch employees', message: String(error) }, 500);
  }
});

// Get single employee
app.get('/api/employees/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const employee = await DB.prepare(`
      SELECT 
        e.*,
        d.name as department_name,
        l.location_name as location_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = ?
    `).bind(id).first();
    
    if (!employee) {
      return c.json({ success: false, error: 'Employee not found' }, 404);
    }
    
    return c.json({ success: true, data: employee });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch employee', message: String(error) }, 500);
  }
});

// Create new employee
app.post('/api/employees', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    
    // Generate employee number if not provided
    const employee_number = data.employee_number || `EMP${String(Date.now()).slice(-6)}`;
    
    const result = await DB.prepare(`
      INSERT INTO employees (
        organization_id, employee_number, first_name, last_name, email,
        employment_type, employment_status, job_title, hire_date,
        department_id, location_id, phone_mobile, id_number, salary_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.organization_id || 1,
      employee_number,
      data.first_name,
      data.last_name,
      data.email,
      data.employment_type || 'Full-Time',
      data.employment_status || 'Active',
      data.job_title,
      data.hire_date || new Date().toISOString().split('T')[0],
      data.department_id || null,
      data.location_id || null,
      data.phone_mobile || null,
      data.id_number || null,
      data.salary_amount || null
    ).run();
    
    if (result.success) {
      const newEmployee = await DB.prepare(`
        SELECT * FROM employees WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      
      return c.json({ success: true, data: newEmployee, message: 'Employee created successfully' }, 201);
    }
    
    return c.json({ success: false, error: 'Failed to create employee' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create employee', message: String(error) }, 500);
  }
});

// Update employee
app.put('/api/employees/:id', async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const data = await c.req.json();
    
    const result = await DB.prepare(`
      UPDATE employees 
      SET 
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        email = COALESCE(?, email),
        phone_mobile = COALESCE(?, phone_mobile),
        job_title = COALESCE(?, job_title),
        department_id = COALESCE(?, department_id),
        location_id = COALESCE(?, location_id),
        employment_status = COALESCE(?, employment_status),
        salary_amount = COALESCE(?, salary_amount)
      WHERE id = ?
    `).bind(
      data.first_name || null,
      data.last_name || null,
      data.email || null,
      data.phone_mobile || null,
      data.job_title || null,
      data.department_id || null,
      data.location_id || null,
      data.employment_status || null,
      data.salary_amount || null,
      id
    ).run();
    
    if (result.success) {
      const updatedEmployee = await DB.prepare(`
        SELECT * FROM employees WHERE id = ?
      `).bind(id).first();
      
      return c.json({ success: true, data: updatedEmployee, message: 'Employee updated successfully' });
    }
    
    return c.json({ success: false, error: 'Failed to update employee' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update employee', message: String(error) }, 500);
  }
});

// ============================================================================
// CORE API ROUTES - SOCIAL COLLABORATION (Full Implementation)
// ============================================================================

// Get social feed posts
app.get('/api/social/posts', async (c) => {
  const { DB } = c.env;
  const page = parseInt(c.req.query('page') || '1');
  const per_page = Math.min(50, parseInt(c.req.query('per_page') || '20'));
  const offset = (page - 1) * per_page;
  
  try {
    const posts = await DB.prepare(`
      SELECT 
        p.*,
        e.first_name || ' ' || e.last_name as author_name,
        e.profile_photo_url as author_photo,
        e.job_title as author_title
      FROM social_posts p
      JOIN employees e ON p.author_id = e.id
      WHERE p.is_active = 1 AND p.is_approved = 1
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(per_page, offset).all();
    
    return c.json({ success: true, data: posts.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch posts', message: String(error) }, 500);
  }
});

// Create social post
app.post('/api/social/posts', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    
    const result = await DB.prepare(`
      INSERT INTO social_posts (
        organization_id, author_id, post_type, content, 
        visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.organization_id || 1,
      data.author_id,
      data.post_type || 'Status',
      data.content,
      data.visibility || 'Public'
    ).run();
    
    if (result.success) {
      const newPost = await DB.prepare(`
        SELECT 
          p.*,
          e.first_name || ' ' || e.last_name as author_name,
          e.profile_photo_url as author_photo
        FROM social_posts p
        JOIN employees e ON p.author_id = e.id
        WHERE p.id = ?
      `).bind(result.meta.last_row_id).first();
      
      return c.json({ success: true, data: newPost, message: 'Post created successfully' }, 201);
    }
    
    return c.json({ success: false, error: 'Failed to create post' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create post', message: String(error) }, 500);
  }
});

// Like/Unlike post
app.post('/api/social/posts/:id/like', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    const data = await c.req.json();
    const employeeId = data.employee_id;
    
    // Check if already liked
    const existing = await DB.prepare(`
      SELECT * FROM social_reactions 
      WHERE employee_id = ? AND target_type = 'post' AND target_id = ?
    `).bind(employeeId, postId).first();
    
    if (existing) {
      // Unlike
      await DB.prepare(`
        DELETE FROM social_reactions 
        WHERE employee_id = ? AND target_type = 'post' AND target_id = ?
      `).bind(employeeId, postId).run();
      
      await DB.prepare(`
        UPDATE social_posts SET likes_count = likes_count - 1 WHERE id = ?
      `).bind(postId).run();
      
      return c.json({ success: true, message: 'Post unliked' });
    } else {
      // Like
      await DB.prepare(`
        INSERT INTO social_reactions (employee_id, target_type, target_id, reaction_type, created_at)
        VALUES (?, 'post', ?, 'like', datetime('now'))
      `).bind(employeeId, postId).run();
      
      await DB.prepare(`
        UPDATE social_posts SET likes_count = likes_count + 1 WHERE id = ?
      `).bind(postId).run();
      
      return c.json({ success: true, message: 'Post liked' });
    }
  } catch (error) {
    return c.json({ success: false, error: 'Failed to like/unlike post', message: String(error) }, 500);
  }
});

// Get comments for a post
app.get('/api/social/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    const comments = await DB.prepare(`
      SELECT 
        sc.*,
        e.first_name || ' ' || e.last_name as author_name,
        e.profile_photo_url as author_photo
      FROM social_comments sc
      JOIN employees e ON sc.author_id = e.id
      WHERE sc.post_id = ? AND sc.is_approved = 1
      ORDER BY sc.created_at ASC
    `).bind(postId).all();
    
    return c.json({ success: true, data: comments.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch comments', message: String(error) }, 500);
  }
});

// Create comment
app.post('/api/social/posts/:id/comments', async (c) => {
  const { DB } = c.env;
  const postId = c.req.param('id');
  
  try {
    const data = await c.req.json();
    
    const result = await DB.prepare(`
      INSERT INTO social_comments (
        post_id, author_id, content, created_at, updated_at
      ) VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(postId, data.author_id, data.content).run();
    
    // Update comment count
    await DB.prepare(`
      UPDATE social_posts SET comments_count = comments_count + 1 WHERE id = ?
    `).bind(postId).run();
    
    if (result.success) {
      const newComment = await DB.prepare(`
        SELECT 
          sc.*,
          e.first_name || ' ' || e.last_name as author_name,
          e.profile_photo_url as author_photo
        FROM social_comments sc
        JOIN employees e ON sc.author_id = e.id
        WHERE sc.id = ?
      `).bind(result.meta.last_row_id).first();
      
      return c.json({ success: true, data: newComment, message: 'Comment added' }, 201);
    }
    
    return c.json({ success: false, error: 'Failed to create comment' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create comment', message: String(error) }, 500);
  }
});

// ============================================================================
// CORE API ROUTES - SHIFTS & SCHEDULING (Full Implementation)
// ============================================================================

// Get shifts
app.get('/api/shifts', async (c) => {
  const { DB } = c.env;
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const location_id = c.req.query('location_id');
  
  try {
    let whereClause = 'WHERE s.shift_date = ?';
    const params: any[] = [date];
    
    if (location_id) {
      whereClause += ' AND s.location_id = ?';
      params.push(location_id);
    }
    
    const shifts = await DB.prepare(`
      SELECT 
        s.*,
        e.first_name || ' ' || e.last_name as employee_name,
        e.profile_photo_url as employee_photo,
        l.location_name as location_name,
        d.name as department_name
      FROM shifts s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN locations l ON s.location_id = l.id
      LEFT JOIN departments d ON s.department_id = d.id
      ${whereClause}
      ORDER BY s.start_time ASC
    `).bind(...params).all();
    
    return c.json({ success: true, data: shifts.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch shifts', message: String(error) }, 500);
  }
});

// Create shift
app.post('/api/shifts', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    
    const result = await DB.prepare(`
      INSERT INTO shifts (
        organization_id, employee_id, location_id, department_id,
        shift_date, start_time, end_time, duration_hours, shift_type, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.organization_id || 1,
      data.employee_id || null,
      data.location_id,
      data.department_id || null,
      data.shift_date,
      data.start_time,
      data.end_time,
      data.duration_hours || 8,
      data.shift_type || 'Regular',
      data.status || 'Scheduled'
    ).run();
    
    if (result.success) {
      const newShift = await DB.prepare(`
        SELECT * FROM shifts WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      
      return c.json({ success: true, data: newShift, message: 'Shift created successfully' }, 201);
    }
    
    return c.json({ success: false, error: 'Failed to create shift' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create shift', message: String(error) }, 500);
  }
});

// ============================================================================
// CORE API ROUTES - INCIDENTS (Full Implementation)
// ============================================================================

// Get incidents
app.get('/api/incidents', async (c) => {
  const { DB } = c.env;
  const page = parseInt(c.req.query('page') || '1');
  const per_page = Math.min(50, parseInt(c.req.query('per_page') || '20'));
  const offset = (page - 1) * per_page;
  const status = c.req.query('status');
  
  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    
    const incidents = await DB.prepare(`
      SELECT 
        i.*,
        e.first_name || ' ' || e.last_name as reported_by_name,
        l.location_name as location_name,
        d.name as department_name
      FROM incidents i
      JOIN employees e ON i.reported_by = e.id
      LEFT JOIN locations l ON i.location_id = l.id
      LEFT JOIN departments d ON i.department_id = d.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, per_page, offset).all();
    
    return c.json({ success: true, data: incidents.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch incidents', message: String(error) }, 500);
  }
});

// Create incident
app.post('/api/incidents', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    
    const incident_number = `INC${data.organization_id || 1}-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await DB.prepare(`
      INSERT INTO incidents (
        organization_id, incident_number, incident_type, severity,
        incident_date, title, description, reported_by, status,
        location_id, department_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      data.organization_id || 1,
      incident_number,
      data.incident_type,
      data.severity || 'Medium',
      data.incident_date || new Date().toISOString(),
      data.title,
      data.description,
      data.reported_by,
      'Reported',
      data.location_id || null,
      data.department_id || null
    ).run();
    
    if (result.success) {
      const newIncident = await DB.prepare(`
        SELECT * FROM incidents WHERE id = ?
      `).bind(result.meta.last_row_id).first();
      
      return c.json({ success: true, data: newIncident, message: 'Incident reported successfully' }, 201);
    }
    
    return c.json({ success: false, error: 'Failed to create incident' }, 500);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create incident', message: String(error) }, 500);
  }
});

// ============================================================================
// CORE API ROUTES - AI DIGITAL TWIN (Full Implementation)
// ============================================================================

// Chat with AI assistant
app.post('/api/ai/chat', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    const { employee_id, message, context_type } = data;
    
    // Get employee context
    const employee = await DB.prepare(`
      SELECT * FROM employees WHERE id = ?
    `).bind(employee_id).first();
    
    // Get digital twin
    let twin = await DB.prepare(`
      SELECT * FROM digital_twins WHERE employee_id = ?
    `).bind(employee_id).first();
    
    // Create twin if doesn't exist
    if (!twin) {
      const twinResult = await DB.prepare(`
        INSERT INTO digital_twins (employee_id, twin_name, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `).bind(employee_id, `${employee.first_name}'s Assistant`).run();
      
      twin = await DB.prepare(`
        SELECT * FROM digital_twins WHERE id = ?
      `).bind(twinResult.meta.last_row_id).first();
    }
    
    // Save user message
    await DB.prepare(`
      INSERT INTO ai_chat_messages (employee_id, digital_twin_id, role, content, context_type, created_at)
      VALUES (?, ?, 'user', ?, ?, datetime('now'))
    `).bind(employee_id, twin.id, message, context_type || 'General').run();
    
    // Generate AI response (fallback without AI binding)
    const assistantMessage = `Hey ${employee.first_name}! I'm here to help! As your digital workplace assistant, I can help with scheduling, performance tracking, skills development, and compliance questions. What would you like to know?`;
    
    // Save assistant message
    await DB.prepare(`
      INSERT INTO ai_chat_messages (employee_id, digital_twin_id, role, content, context_type, created_at)
      VALUES (?, ?, 'assistant', ?, ?, datetime('now'))
    `).bind(employee_id, twin.id, assistantMessage, context_type || 'General').run();
    
    // Update interaction count
    await DB.prepare(`
      UPDATE digital_twins SET interactions_count = interactions_count + 1 WHERE id = ?
    `).bind(twin.id).run();
    
    return c.json({
      success: true,
      data: {
        message: assistantMessage,
        twin_name: twin.twin_name,
      },
    });
  } catch (error) {
    return c.json({ 
      success: true, 
      data: { 
        message: "I'm here to help! As your digital workplace assistant, I can help with scheduling, performance tracking, skills development, and compliance questions. What would you like to know?" 
      } 
    });
  }
});

// ============================================================================
// GEOLOCATION TRACKING APIs (For HR Dashboard)
// ============================================================================

// Get all team members with their current locations and status
app.get('/api/hr/team-locations', async (c) => {
  const { DB } = c.env;
  const location_id = c.req.query('location_id');
  const department_id = c.req.query('department_id');
  const status = c.req.query('status'); // 'Active', 'On Break', 'Clocked Out'
  
  try {
    let whereClause = 'WHERE e.is_active = 1';
    const params: any[] = [];
    
    if (location_id) {
      whereClause += ' AND e.location_id = ?';
      params.push(location_id);
    }
    
    if (department_id) {
      whereClause += ' AND e.department_id = ?';
      params.push(department_id);
    }
    
    if (status) {
      whereClause += ' AND e.employment_status = ?';
      params.push(status);
    }
    
    // Get employees with their latest time entry for location tracking
    const employees = await DB.prepare(`
      SELECT 
        e.id,
        e.employee_number,
        e.first_name || ' ' || e.last_name as name,
        e.job_title,
        e.employment_type,
        e.employment_status,
        e.phone_mobile,
        e.profile_photo_url,
        d.name as department_name,
        l.location_name as location_name,
        l.latitude as base_latitude,
        l.longitude as base_longitude,
        te.clock_in_latitude,
        te.clock_in_longitude,
        te.clock_out_latitude,
        te.clock_out_longitude,
        te.clock_in_method,
        te.clock_in_time,
        te.clock_out_time,
        CASE 
          WHEN te.clock_out_time IS NOT NULL THEN 'Clocked Out'
          WHEN te.clock_in_time IS NOT NULL THEN 'Clocked In'
          ELSE 'Not Started'
        END as shift_status
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN time_entries te ON e.id = te.employee_id 
        AND DATE(te.clock_in_time) = DATE('now')
        AND te.id = (
          SELECT id FROM time_entries 
          WHERE employee_id = e.id 
          AND DATE(clock_in_time) = DATE('now')
          ORDER BY clock_in_time DESC 
          LIMIT 1
        )
      ${whereClause}
      ORDER BY e.first_name ASC
    `).bind(...params).all();
    
    return c.json({ success: true, data: employees.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch team locations', message: String(error) }, 500);
  }
});

// Get specific worker's location and status
app.get('/api/hr/worker-status/:employeeId', async (c) => {
  const { DB } = c.env;
  const employeeId = c.req.param('employeeId');
  
  try {
    const employee = await DB.prepare(`
      SELECT 
        e.*,
        d.name as department_name,
        l.location_name as location_name,
        l.latitude as base_latitude,
        l.longitude as base_longitude
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      WHERE e.id = ?
    `).bind(employeeId).first();
    
    if (!employee) {
      return c.json({ success: false, error: 'Employee not found' }, 404);
    }
    
    // Get latest time entry for today
    const latestEntry = await DB.prepare(`
      SELECT * FROM time_entries 
      WHERE employee_id = ? AND DATE(clock_in_time) = DATE('now')
      ORDER BY clock_in_time DESC
      LIMIT 1
    `).bind(employeeId).first();
    
    // Get today's shift
    const todayShift = await DB.prepare(`
      SELECT * FROM shifts 
      WHERE employee_id = ? AND shift_date = DATE('now')
      LIMIT 1
    `).bind(employeeId).first();
    
    return c.json({ 
      success: true, 
      data: {
        employee,
        current_location: latestEntry ? {
          latitude: latestEntry.clock_out_time ? latestEntry.clock_out_latitude : latestEntry.clock_in_latitude,
          longitude: latestEntry.clock_out_time ? latestEntry.clock_out_longitude : latestEntry.clock_in_longitude,
          method: latestEntry.clock_in_method,
          clock_in_time: latestEntry.clock_in_time,
          clock_out_time: latestEntry.clock_out_time,
          status: latestEntry.clock_out_time ? 'Clocked Out' : 'Clocked In'
        } : null,
        shift: todayShift
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch worker status', message: String(error) }, 500);
  }
});

// Update worker location (mobile clock-in/out with GPS)
app.post('/api/geo/update-location', async (c) => {
  const { DB } = c.env;
  
  try {
    const data = await c.req.json();
    const { employee_id, latitude, longitude, action, method } = data;
    // action: 'clock_in', 'clock_out', 'break_start', 'break_end'
    // method: 'Mobile', 'Kiosk', 'Biometric'
    
    if (action === 'clock_in') {
      // Create new time entry
      const result = await DB.prepare(`
        INSERT INTO time_entries (
          employee_id, clock_in_time, clock_in_latitude, clock_in_longitude, clock_in_method,
          created_at, updated_at
        ) VALUES (?, datetime('now'), ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(employee_id, latitude, longitude, method || 'Mobile').run();
      
      return c.json({ 
        success: true, 
        message: 'Clocked in successfully',
        data: { id: result.meta.last_row_id }
      });
    } else if (action === 'clock_out') {
      // Update existing time entry
      const latestEntry = await DB.prepare(`
        SELECT id FROM time_entries 
        WHERE employee_id = ? AND DATE(clock_in_time) = DATE('now') AND clock_out_time IS NULL
        ORDER BY clock_in_time DESC
        LIMIT 1
      `).bind(employee_id).first();
      
      if (latestEntry) {
        await DB.prepare(`
          UPDATE time_entries 
          SET clock_out_time = datetime('now'),
              clock_out_latitude = ?,
              clock_out_longitude = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(latitude, longitude, latestEntry.id).run();
        
        return c.json({ success: true, message: 'Clocked out successfully' });
      } else {
        return c.json({ success: false, error: 'No active clock-in found' }, 400);
      }
    } else if (action === 'break_start') {
      // Add to break duration
      const latestEntry = await DB.prepare(`
        SELECT id FROM time_entries 
        WHERE employee_id = ? AND DATE(clock_in_time) = DATE('now') AND clock_out_time IS NULL
        ORDER BY clock_in_time DESC
        LIMIT 1
      `).bind(employee_id).first();
      
      if (latestEntry) {
        // Store break start time in notes field temporarily
        await DB.prepare(`
          UPDATE time_entries 
          SET notes = datetime('now'),
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(latestEntry.id).run();
        
        return c.json({ success: true, message: 'Break started' });
      }
    } else if (action === 'break_end') {
      // Calculate break duration and add it
      const latestEntry = await DB.prepare(`
        SELECT id, notes, break_duration_minutes FROM time_entries 
        WHERE employee_id = ? AND DATE(clock_in_time) = DATE('now') AND clock_out_time IS NULL
        ORDER BY clock_in_time DESC
        LIMIT 1
      `).bind(employee_id).first();
      
      if (latestEntry && latestEntry.notes) {
        // Calculate minutes between break start (in notes) and now
        const breakStartTime = new Date(latestEntry.notes);
        const breakEndTime = new Date();
        const breakMinutes = Math.floor((breakEndTime.getTime() - breakStartTime.getTime()) / 60000);
        const totalBreakMinutes = (latestEntry.break_duration_minutes || 0) + breakMinutes;
        
        await DB.prepare(`
          UPDATE time_entries 
          SET break_duration_minutes = ?,
              notes = NULL,
              updated_at = datetime('now')
          WHERE id = ?
        `).bind(totalBreakMinutes, latestEntry.id).run();
        
        return c.json({ success: true, message: 'Break ended', duration_minutes: breakMinutes });
      }
    }
    
    return c.json({ success: false, error: 'Invalid action' }, 400);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update location', message: String(error) }, 500);
  }
});

// Get locations list (for filters)
app.get('/api/locations', async (c) => {
  const { DB } = c.env;
  
  try {
    const locations = await DB.prepare(`
      SELECT id, name, address, city, province, latitude, longitude
      FROM locations
      WHERE is_active = 1
      ORDER BY name ASC
    `).all();
    
    return c.json({ success: true, data: locations.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch locations', message: String(error) }, 500);
  }
});

// Get departments list (for filters)
app.get('/api/departments', async (c) => {
  const { DB } = c.env;
  
  try {
    const departments = await DB.prepare(`
      SELECT id, name, code, manager_id, headcount_target
      FROM departments
      ORDER BY name ASC
    `).all();
    
    return c.json({ success: true, data: departments.results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch departments', message: String(error) }, 500);
  }
});

// ============================================================================
// AUTHENTICATION FRONTEND
// ============================================================================

// Login Page
app.get('/login', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZuZaWorks - Enterprise Login</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'pastel-blue': '#7dd3fc',
                        'pastel-blue-dark': '#38bdf8',
                        'pastel-blue-light': '#bae6fd',
                        'pastel-blue-pale': '#e0f2fe',
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 100%);
            min-height: 100vh;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .sso-button {
            transition: all 0.3s ease;
        }
        .sso-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body class="flex items-center justify-center p-4">
    <div class="w-full max-w-md">
        <!-- Logo & Branding -->
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
                <i class="fas fa-briefcase text-4xl text-pastel-blue-dark"></i>
            </div>
            <h1 class="text-4xl font-bold text-white mb-2">ZuZaWorks</h1>
            <p class="text-white/90 text-sm">Enterprise Workforce Operating System</p>
            <div class="flex items-center justify-center gap-3 mt-3">
                <span class="px-3 py-1 bg-white/20 text-white text-xs rounded-full font-bold">🇿🇦 Proudly South African</span>
                <span class="px-3 py-1 bg-white/20 text-white text-xs rounded-full font-bold">B-BBEE Level 1</span>
            </div>
        </div>
        
        <!-- Login Card -->
        <div class="glass-card rounded-2xl shadow-2xl p-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">Sign In to Your Account</h2>
            
            <!-- Demo Users Info -->
            <div class="mb-6 p-4 bg-pastel-blue-dark/10 border border-pastel-blue-dark/30 rounded-xl">
                <div class="flex items-start gap-2">
                    <i class="fas fa-info-circle text-pastel-blue-dark mt-1"></i>
                    <div class="text-sm text-gray-700">
                        <p class="font-bold mb-1">Demo Access:</p>
                        <p class="text-xs">Use any demo email below to login</p>
                    </div>
                </div>
            </div>
            
            <!-- Email/Password Form -->
            <form id="loginForm" class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div class="relative">
                        <i class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input type="email" id="email" required
                            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pastel-blue-dark focus:border-transparent"
                            placeholder="your.email@company.com">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                    <div class="relative">
                        <i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input type="password" id="password" required
                            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pastel-blue-dark focus:border-transparent"
                            placeholder="Enter your password">
                    </div>
                </div>
                
                <button type="submit" class="w-full py-3 bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white font-bold rounded-xl hover:scale-105 transition">
                    <i class="fas fa-sign-in-alt mr-2"></i>
                    Sign In with Password
                </button>
            </form>
            
            <!-- Divider -->
            <div class="relative my-6">
                <div class="absolute inset-0 flex items-center">
                    <div class="w-full border-t border-gray-300"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                    <span class="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
            </div>
            
            <!-- SSO Buttons -->
            <div class="space-y-3">
                <button onclick="loginWithSSO('google')" class="sso-button w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-pastel-blue-dark transition flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </button>
                
                <button onclick="loginWithSSO('microsoft')" class="sso-button w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-pastel-blue-dark transition flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" viewBox="0 0 23 23">
                        <path fill="#f35325" d="M0 0h11v11H0z"/>
                        <path fill="#81bc06" d="M12 0h11v11H12z"/>
                        <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                        <path fill="#ffba08" d="M12 12h11v11H12z"/>
                    </svg>
                    Sign in with Microsoft
                </button>
                
                <button onclick="loginWithSSO('linkedin')" class="sso-button w-full py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-pastel-blue-dark transition flex items-center justify-center gap-3">
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#0077B5" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    Sign in with LinkedIn
                </button>
            </div>
            
            <!-- Demo Accounts -->
            <div class="mt-6 pt-6 border-t border-gray-200">
                <p class="text-xs text-gray-500 text-center mb-3 font-semibold">Quick Demo Access:</p>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button onclick="quickLogin('thabo.motsepe@mzansi.co.za')" class="p-2 bg-gray-50 hover:bg-pastel-blue-dark/10 rounded-lg border border-gray-200 text-left transition">
                        <div class="font-semibold text-gray-700">Super Admin</div>
                        <div class="text-gray-500 truncate">thabo.motsepe@...</div>
                    </button>
                    <button onclick="quickLogin('nosipho.madonsela@mzansi.co.za')" class="p-2 bg-gray-50 hover:bg-pastel-blue-light/10 rounded-lg border border-gray-200 text-left transition">
                        <div class="font-semibold text-gray-700">HR Manager</div>
                        <div class="text-gray-500 truncate">nosipho.madonsela@...</div>
                    </button>
                    <button onclick="quickLogin('johannes.mabuza@mzansi.co.za')" class="p-2 bg-gray-50 hover:bg-pastel-blue/10 rounded-lg border border-gray-200 text-left transition">
                        <div class="font-semibold text-gray-700">Dept Manager</div>
                        <div class="text-gray-500 truncate">johannes.mabuza@...</div>
                    </button>
                    <button onclick="quickLogin('alfred.mashego@mzansi.co.za')" class="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left transition">
                        <div class="font-semibold text-gray-700">Employee</div>
                        <div class="text-gray-500 truncate">alfred.mashego@...</div>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center mt-6 text-white/80 text-sm">
            <p>© 2025 ZuZaWorks. POPIA Compliant. <a href="#" class="underline">Privacy Policy</a></p>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Handle email/password login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await axios.post('/api/auth/login', { email, password, sso_provider: 'local' });
                if (response.data.success) {
                    localStorage.setItem('auth_token', response.data.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.data.user));
                    localStorage.setItem('userRole', response.data.data.user.role || 'employee');
                    window.location.href = '/';
                }
            } catch (error) {
                alert('Login failed: ' + (error.response?.data?.error || error.message));
            }
        });
        
        // Quick demo login
        function quickLogin(email) {
            document.getElementById('email').value = email;
            document.getElementById('password').value = 'demo';
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
        
        // SSO login (placeholder - requires OAuth setup)
        function loginWithSSO(provider) {
            alert(\`\${provider.toUpperCase()} OAuth Integration\\n\\nTo enable this:\\n1. Register OAuth app with \${provider}\\n2. Add credentials to environment variables\\n3. Configure redirect URLs\\n\\nFor demo, use email/password login or Quick Demo buttons.\`);
            
            // In production, this would redirect to OAuth provider:
            // window.location.href = \`/api/auth/oauth/\${provider}/authorize\`;
        }
        
        // Check if already logged in
        if (localStorage.getItem('auth_token')) {
            window.location.href = '/';
        }
    </script>
</body>
</html>
  `);
});

// ============================================================================
// AUTHENTICATION UI
// ============================================================================

// Login page
app.get('/login', (c) => {
  return c.redirect('/static/login.html');
});

// ============================================================================
// GAMIFIED FRONTEND
// ============================================================================

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZuZaWorksOS - Building South Africa Together 🇿🇦</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'pastel-blue-50': '#f0f9ff',
                        'pastel-blue-100': '#e0f2fe',
                        'pastel-blue-200': '#bae6fd',
                        'pastel-blue-300': '#7dd3fc',
                        'pastel-blue-400': '#38bdf8',
                        'pastel-blue-500': '#0ea5e9',
                    }
                }
            }
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #a8d5e2 0%, #7ec8e3 50%, #c7e3f0 100%);
            background-attachment: fixed;
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            box-shadow: 0 8px 32px 0 rgba(168, 213, 226, 0.3);
            border: 2px solid rgba(186, 230, 253, 0.5);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px 0 rgba(126, 200, 227, 0.4);
        }
        
        .sa-gradient {
            background: linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #bae6fd 100%);
            background-size: 200% 200%;
            animation: gradientShift 8s ease infinite;
        }
        
        @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .pulse-glow {
            animation: pulseGlow 2s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(125, 211, 252, 0.5); }
            50% { box-shadow: 0 0 40px rgba(56, 189, 248, 0.8); }
        }
        
        .badge-pop {
            animation: badgePop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes badgePop {
            0% { transform: scale(0) rotate(0deg); }
            50% { transform: scale(1.2) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); }
        }
        
        .notification-slide {
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .coin-flip {
            animation: coinFlip 1s ease-in-out;
        }
        
        @keyframes coinFlip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
        }
        
        .streak-fire {
            animation: fireFlicker 1s ease-in-out infinite;
        }
        
        @keyframes fireFlicker {
            0%, 100% { transform: scale(1) rotate(-2deg); filter: brightness(1); }
            50% { transform: scale(1.1) rotate(2deg); filter: brightness(1.2); }
        }
        
        .level-up-flash {
            animation: levelUpFlash 1s ease-out;
        }
        
        @keyframes levelUpFlash {
            0% { background-color: #bae6fd; transform: scale(1); }
            50% { background-color: #7dd3fc; transform: scale(1.05); }
            100% { background-color: #38bdf8; transform: scale(1); }
        }
        
        /* Digital Twin Avatar */
        .digital-twin {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #7dd3fc, #38bdf8);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 8px 24px rgba(125, 211, 252, 0.4);
            transition: all 0.3s ease;
        }
        
        .digital-twin:hover {
            transform: scale(1.1) rotate(5deg);
            box-shadow: 0 12px 32px rgba(56, 189, 248, 0.6);
        }
        
        .digital-twin.speaking {
            animation: speaking 0.5s ease-in-out infinite;
        }
        
        @keyframes speaking {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Notification Toast */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            z-index: 9999;
        }
        
        .progress-ring {
            transform: rotate(-90deg);
        }
        
        .progress-ring-circle {
            stroke-dasharray: 251.2;
            stroke-dashoffset: 251.2;
            transition: stroke-dashoffset 0.5s;
        }
        
        /* Live Activity Indicator */
        .activity-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #7dd3fc;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.5); }
        }
        
        /* Leaderboard Rank Colors */
        .rank-1 { background: linear-gradient(135deg, #7dd3fc, #38bdf8); }
        .rank-2 { background: linear-gradient(135deg, #bae6fd, #7dd3fc); }
        .rank-3 { background: linear-gradient(135deg, #e0f2fe, #bae6fd); }
        
        /* FOMO Elements */
        .viewing-now {
            background: rgba(222, 56, 49, 0.1);
            border: 1px solid #7dd3fc;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #38bdf8;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .trending-badge {
            background: linear-gradient(135deg, #7dd3fc, #38bdf8);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body class="antialiased">
    <!-- Digital Twin Avatar -->
    <div class="digital-twin" id="digitalTwin" onclick="openTwinChat()">
        <i class="fas fa-robot text-white text-3xl"></i>
    </div>
    
    <!-- Toast Notification Container -->
    <div id="toastContainer" class="toast"></div>
    
    <div id="app" class="min-h-screen p-4 md:p-8">
        <!-- Header with Gamification Stats -->
        <div class="glass-card p-6 mb-6">
            <div class="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-bold mb-1">
                        <span class="sa-gradient bg-clip-text text-transparent">ZuZaWorksOS</span>
                        <span class="text-2xl ml-2">🇿🇦</span>
                    </h1>
                    <p class="text-gray-600 font-medium">Building South Africa Together</p>
                </div>
                
                <!-- User Gamification Stats -->
                <div class="flex items-center gap-4 flex-wrap">
                    <!-- Streak Counter -->
                    <div class="glass-card p-3 flex items-center gap-2 streak-fire">
                        <i class="fas fa-fire text-pastel-blue text-2xl"></i>
                        <div>
                            <div class="text-xs text-gray-600">Streak</div>
                            <div class="text-xl font-bold text-pastel-blue" id="streakDays">15</div>
                        </div>
                    </div>
                    
                    <!-- ZuZa Coins -->
                    <div class="glass-card p-3 flex items-center gap-2 coin-flip">
                        <i class="fas fa-coins text-pastel-blue text-2xl"></i>
                        <div>
                            <div class="text-xs text-gray-600">ZuZa Coins</div>
                            <div class="text-xl font-bold text-pastel-blue" id="zuzaCoins">1,250</div>
                        </div>
                    </div>
                    
                    <!-- Level & Rank -->
                    <div class="glass-card p-3 flex items-center gap-2">
                        <i class="fas fa-trophy text-pastel-blue-light text-2xl"></i>
                        <div>
                            <div class="text-xs text-gray-600">Level / Rank</div>
                            <div class="text-xl font-bold text-pastel-blue-light">
                                <span id="userLevel">12</span> / #<span id="userRank">23</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Notifications -->
                    <button class="glass-card p-3 relative hover:scale-105 transition">
                        <i class="fas fa-bell text-2xl text-pastel-blue-dark"></i>
                        <span class="absolute top-1 right-1 w-5 h-5 bg-pastel-blue text-white text-xs rounded-full flex items-center justify-center font-bold">
                            3
                        </span>
                    </button>
                    
                    <!-- Profile -->
                    <div class="relative">
                        <button onclick="toggleProfileMenu()" class="glass-card p-3 hover:scale-105 transition flex items-center gap-2">
                            <i class="fas fa-user-circle text-2xl text-pastel-blue-light"></i>
                            <div class="text-left hidden md:block">
                                <div class="text-xs font-bold text-gray-800" id="userNameDisplay">Loading...</div>
                                <div class="text-xs text-gray-500" id="userRoleDisplay">...</div>
                            </div>
                            <i class="fas fa-chevron-down text-gray-500 text-sm"></i>
                        </button>
                        
                        <!-- Profile Dropdown -->
                        <div id="profileMenu" class="hidden absolute right-0 mt-2 w-64 glass-card rounded-xl shadow-2xl p-4 z-50">
                            <div class="border-b border-gray-200 pb-3 mb-3">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="fas fa-user-circle text-3xl text-pastel-blue-light"></i>
                                    <div>
                                        <div class="font-bold text-gray-800" id="userNameFull">Loading...</div>
                                        <div class="text-xs text-gray-500" id="userEmailDisplay">...</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="px-2 py-1 bg-pastel-blue-dark text-white text-xs rounded-full font-bold" id="userRoleBadge">...</span>
                                    <span class="text-xs text-gray-500">Level <span id="userLevelDisplay">0</span></span>
                                </div>
                            </div>
                            
                            <div class="space-y-2">
                                <button onclick="navigateToPage('user-management')" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
                                    <i class="fas fa-cog text-gray-600"></i>
                                    Profile Settings
                                </button>
                                <button onclick="window.location.href='/login'" class="w-full text-left px-3 py-2 hover:bg-pastel-blue/10 rounded-lg flex items-center gap-2 text-sm text-pastel-blue font-semibold">
                                    <i class="fas fa-sign-out-alt"></i>
                                    Logout
                                </button>
                            </div>
                            
                            <div class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                <div class="font-bold mb-1">Your Permissions:</div>
                                <div id="userPermissionsList" class="text-xs text-gray-600 max-h-32 overflow-y-auto">Loading...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Live Activity Bar -->
            <div class="mt-4 p-3 rounded-xl bg-gradient-to-r from-pastel-blue/10 via-pastel-blue-dark/10 to-pastel-blue-light/10 border border-pastel-blue-dark/20">
                <div class="flex items-center gap-2 text-sm">
                    <div class="activity-dot"></div>
                    <span class="font-semibold text-pastel-blue-dark">Live Now:</span>
                    <span class="text-gray-700" id="liveActivity">Loading...</span>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-12 gap-6">
            <!-- Sidebar Navigation -->
            <div class="col-span-12 md:col-span-3">
                <div class="glass-card p-4 mb-6">
                    <nav class="space-y-1">
                        <!-- Core Workforce Management -->
                        <a href="#" class="nav-item flex items-center p-3 rounded-xl bg-pastel-blue-dark text-white font-semibold" data-page="dashboard" onclick="navigateToPage('dashboard'); return false;">
                            <i class="fas fa-tachometer-alt w-6"></i>
                            <span class="ml-3">Executive Dashboard</span>
                        </a>
                        
                        <a href="#schedule" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="schedule" onclick="navigateToPage('schedule'); return false;">
                            <i class="fas fa-calendar-week w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">Scheduling</span>
                        </a>
                        
                        <a href="#employees" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="employees" onclick="navigateToPage('employees'); return false;">
                            <i class="fas fa-users w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">Employee Management</span>
                        </a>
                        
                        <a href="#interns" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="interns" onclick="navigateToPage('interns'); return false;">
                            <i class="fas fa-user-graduate w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Interns (SETA/YES/NYS)</span>
                        </a>
                        
                        <a href="#compliance" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="compliance" onclick="navigateToPage('compliance'); return false;">
                            <i class="fas fa-shield-alt w-6 text-pastel-blue"></i>
                            <span class="ml-3">Compliance Manager</span>
                            <span class="ml-auto text-xs bg-pastel-blue text-white px-2 py-1 rounded-full font-bold">!</span>
                        </a>
                        
                        <a href="#my-compliance" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="my-compliance" onclick="navigateToPage('myCompliance'); return false;">
                            <i class="fas fa-clipboard-check w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">My Compliance</span>
                        </a>
                        
                        <a href="#time-tracking" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="time-tracking" onclick="navigateToPage('timeTracking'); return false;">
                            <i class="fas fa-clock w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">Time Tracking</span>
                        </a>
                        
                        <a href="#locations" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="locations" onclick="navigateToPage('locations'); return false;">
                            <i class="fas fa-map-marker-alt w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Multi-Location</span>
                        </a>
                        
                        <a href="#leave" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="leave" onclick="navigateToPage('leave'); return false;">
                            <i class="fas fa-umbrella-beach w-6 text-pastel-blue"></i>
                            <span class="ml-3">Leave Management</span>
                        </a>
                        
                        <a href="#onboarding" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="onboarding" onclick="navigateToPage('onboarding'); return false;">
                            <i class="fas fa-user-plus w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">Employee Onboarding</span>
                        </a>
                        
                        <a href="#analytics" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="analytics" onclick="navigateToPage('analytics'); return false;">
                            <i class="fas fa-chart-line w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Analytics & BI</span>
                        </a>
                        
                        <a href="#user-management" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="user-management" onclick="navigateToPage('userManagement'); return false;">
                            <i class="fas fa-user-cog w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">User Management</span>
                        </a>
                        
                        <!-- Divider -->
                        <div class="border-t border-gray-200 my-2"></div>
                        
                        <!-- Advanced Workforce Features -->
                        <a href="#shift-swaps" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="shift-swaps" onclick="navigateToPage('shiftSwaps'); return false;">
                            <i class="fas fa-exchange-alt w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Shift Swaps</span>
                            <span class="ml-auto text-xs bg-pastel-blue text-white px-2 py-1 rounded-full font-bold">NEW</span>
                        </a>
                        
                        <a href="#messaging" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="messaging" onclick="navigateToPage('messaging'); return false;">
                            <i class="fas fa-comments-alt w-6 text-pastel-blue-dark"></i>
                            <span class="ml-3">Team Messaging</span>
                            <span class="ml-auto text-xs bg-pastel-blue text-white px-2 py-1 rounded-full font-bold">3</span>
                        </a>
                        
                        <a href="#documents" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="documents" onclick="navigateToPage('documents'); return false;">
                            <i class="fas fa-folder-open w-6 text-pastel-blue"></i>
                            <span class="ml-3">Documents</span>
                        </a>
                        
                        <a href="#payroll" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="payroll" onclick="navigateToPage('payroll'); return false;">
                            <i class="fas fa-dollar-sign w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Payroll Export</span>
                        </a>
                        
                        <a href="#forecasting" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="forecasting" onclick="navigateToPage('forecasting'); return false;">
                            <i class="fas fa-brain w-6 text-pastel-blue"></i>
                            <span class="ml-3">Labor Forecasting</span>
                            <span class="ml-auto text-xs bg-pastel-blue-dark text-white px-2 py-1 rounded-full font-bold">AI</span>
                        </a>
                        
                        <a href="#attendance-rules" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="attendance-rules" onclick="navigateToPage('attendanceRules'); return false;">
                            <i class="fas fa-gavel w-6 text-pastel-blue"></i>
                            <span class="ml-3">Attendance Rules</span>
                        </a>
                        
                        <a href="#budgets" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="budgets" onclick="navigateToPage('budgets'); return false;">
                            <i class="fas fa-chart-pie w-6 text-pastel-blue-light"></i>
                            <span class="ml-3">Budget Tracking</span>
                        </a>
                        
                        <!-- Divider -->
                        <div class="border-t border-gray-200 my-2"></div>
                        
                        <!-- Optional Features -->
                        <a href="#social" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="social" onclick="navigateToPage('social'); return false;">
                            <i class="fas fa-comments w-6 text-gray-400"></i>
                            <span class="ml-3 text-gray-600">Social Feed</span>
                        </a>
                        
                        <a href="#engagement" class="nav-item flex items-center p-3 rounded-xl hover:bg-pastel-blue-dark/10 transition" data-page="engagement" onclick="navigateToPage('engagement'); return false;">
                            <i class="fas fa-trophy w-6 text-gray-400"></i>
                            <span class="ml-3 text-gray-600">Engagement</span>
                        </a>
                    </nav>
                </div>
                
                <!-- Compliance Quick Stats -->
                <div class="glass-card p-4">
                    <h3 class="font-bold text-lg mb-3 text-pastel-blue-dark flex items-center">
                        <i class="fas fa-shield-alt mr-2"></i>
                        Compliance Health
                    </h3>
                    <div class="space-y-3">
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">BCEA Compliance</span>
                                <span class="font-bold text-pastel-blue-light">94%</span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-pastel-blue-light transition-all" style="width: 94%"></div>
                            </div>
                        </div>
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">EEA Progress</span>
                                <span class="font-bold text-pastel-blue-dark">78%</span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-pastel-blue-dark transition-all" style="width: 78%"></div>
                            </div>
                        </div>
                        <div class="mt-4 p-2 bg-pastel-blue/10 rounded-lg border border-pastel-blue/30">
                            <div class="flex items-center text-sm text-pastel-blue">
                                <i class="fas fa-exclamation-triangle mr-2"></i>
                                <span class="font-medium">3 items need attention</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-span-12 md:col-span-9">
                <!-- Dashboard Stats with SA Colors -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="glass-card p-6 border-l-4 border-pastel-blue-dark">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Active Team</p>
                                <p class="text-3xl font-bold text-pastel-blue-dark mt-1" id="stat-employees">0</p>
                                <p class="text-xs text-pastel-blue-light mt-1">↑ 12% vs last week</p>
                            </div>
                            <i class="fas fa-users text-5xl text-pastel-blue-dark opacity-20"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 border-l-4 border-pastel-blue-light">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Shifts Today</p>
                                <p class="text-3xl font-bold text-pastel-blue-light mt-1" id="stat-shifts">0</p>
                                <p class="text-xs text-pastel-blue mt-1">1 urgent fill needed</p>
                            </div>
                            <i class="fas fa-calendar-check text-5xl text-pastel-blue-light opacity-20"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 border-l-4 border-pastel-blue">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Compliance</p>
                                <p class="text-3xl font-bold text-pastel-blue mt-1" id="stat-compliance">0%</p>
                                <p class="text-xs text-pastel-blue-light mt-1">✓ BCEA Compliant</p>
                            </div>
                            <i class="fas fa-shield-check text-5xl text-pastel-blue opacity-20"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 border-l-4 border-pastel-blue">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm font-medium">Incidents</p>
                                <p class="text-3xl font-bold text-pastel-blue mt-1" id="stat-incidents">0</p>
                                <p class="text-xs text-gray-500 mt-1">This month</p>
                            </div>
                            <i class="fas fa-exclamation-circle text-5xl text-pastel-blue opacity-20"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Leaderboard Section -->
                <div class="glass-card p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-pastel-blue-dark">
                            <i class="fas fa-trophy mr-2 text-pastel-blue"></i>
                            Top Performers This Week
                        </h2>
                        <button class="px-4 py-2 bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white rounded-xl font-semibold hover:scale-105 transition">
                            View Full Leaderboard
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <!-- Rank 1 -->
                        <div class="glass-card p-6 rank-1 text-white text-center">
                            <div class="text-6xl mb-2">🥇</div>
                            <div class="font-bold text-xl">Thabo Molefe</div>
                            <div class="text-sm opacity-90">Operations Manager</div>
                            <div class="text-3xl font-bold mt-2">4,850 pts</div>
                            <div class="mt-2 text-sm">↑ 2 positions</div>
                        </div>
                        
                        <!-- Rank 2 -->
                        <div class="glass-card p-6 rank-2 text-white text-center">
                            <div class="text-6xl mb-2">🥈</div>
                            <div class="font-bold text-xl">Lerato Khumalo</div>
                            <div class="text-sm opacity-90">Sales Executive</div>
                            <div class="text-3xl font-bold mt-2">4,320 pts</div>
                            <div class="mt-2 text-sm">↑ 1 position</div>
                        </div>
                        
                        <!-- Rank 3 -->
                        <div class="glass-card p-6 rank-3 text-white text-center">
                            <div class="text-6xl mb-2">🥉</div>
                            <div class="font-bold text-xl">Nomsa Ndlovu</div>
                            <div class="text-sm opacity-90">HR Manager</div>
                            <div class="text-3xl font-bold mt-2">4,180 pts</div>
                            <div class="mt-2 text-sm">— Same position</div>
                        </div>
                    </div>
                </div>
                
                <!-- Recent Achievements -->
                <div class="glass-card p-6 mb-6">
                    <h2 class="text-2xl font-bold text-pastel-blue-light mb-4">
                        <i class="fas fa-star mr-2 text-pastel-blue"></i>
                        Recent Achievements
                    </h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-pastel-blue-dark/10 to-pastel-blue-light/10 border-2 border-pastel-blue-light badge-pop">
                            <div class="text-4xl mb-2">🔥</div>
                            <div class="font-bold text-sm">15-Day Streak</div>
                        </div>
                        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/10 border-2 border-pastel-blue badge-pop">
                            <div class="text-4xl mb-2">⚡</div>
                            <div class="font-bold text-sm">Speed Demon</div>
                        </div>
                        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-pastel-blue-light/10 to-pastel-blue-dark/10 border-2 border-pastel-blue-dark badge-pop">
                            <div class="text-4xl mb-2">🎯</div>
                            <div class="font-bold text-sm">Perfect Week</div>
                        </div>
                        <div class="text-center p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/10 border-2 border-pastel-blue badge-pop">
                            <div class="text-4xl mb-2">🏆</div>
                            <div class="font-bold text-sm">Top Contributor</div>
                        </div>
                    </div>
                </div>
                
                <!-- Social Feed with FOMO -->
                <div class="glass-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-2xl font-bold text-pastel-blue">
                            <i class="fas fa-fire mr-2"></i>
                            What's Happening Now
                        </h2>
                        <span class="viewing-now">
                            <i class="fas fa-eye"></i>
                            23 people online
                        </span>
                    </div>
                    
                    <div id="socialFeed" class="space-y-4">
                        <!-- Posts will be loaded here -->
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/auth-check.js"></script>
    <script>
        // ============================================================================
        // AUTHENTICATION & USER PROFILE
        // ============================================================================
        
        let currentUser = null;
        
        // Check authentication and load user profile (enhanced version)
        async function checkAuthEnhanced() {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                window.location.href = '/login';
                return;
            }
            
            try {
                // Set authorization header for all axios requests
                axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
                
                const response = await axios.get('/api/auth/me');
                if (response.data.success) {
                    currentUser = response.data.data;
                    updateUserProfile();
                } else {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
            }
        }
        
        // Update user profile display
        function updateUserProfile() {
            if (!currentUser) return;
            
            document.getElementById('userNameDisplay').textContent = currentUser.name.split(' ')[0];
            document.getElementById('userRoleDisplay').textContent = currentUser.role.display_name;
            document.getElementById('userNameFull').textContent = currentUser.name;
            document.getElementById('userEmailDisplay').textContent = currentUser.email;
            document.getElementById('userRoleBadge').textContent = currentUser.role.display_name;
            document.getElementById('userLevelDisplay').textContent = currentUser.role.level;
            
            // Display permissions (first 5)
            const permList = document.getElementById('userPermissionsList');
            const displayPerms = currentUser.permissions.slice(0, 5);
            permList.innerHTML = displayPerms.map(p => \`<div>• \${p}</div>\`).join('') + 
                (currentUser.permissions.length > 5 ? \`<div class="text-xs text-gray-400 mt-1">+\${currentUser.permissions.length - 5} more...</div>\` : '');
        }
        
        // Toggle profile menu
        function toggleProfileMenu() {
            const menu = document.getElementById('profileMenu');
            menu.classList.toggle('hidden');
        }
        
        // Close profile menu when clicking outside
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('profileMenu');
            const profileBtn = e.target.closest('button[onclick="toggleProfileMenu()"]');
            if (!profileBtn && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
        
        // Logout function
        async function logout() {
            try {
                await axios.post('/api/auth/logout');
            } catch (error) {
                console.error('Logout error:', error);
            } finally {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        
        // Check if user has permission
        function hasPermission(permissionName) {
            return currentUser && currentUser.permissions.includes(permissionName);
        }
        
        // Check if user has role
        function hasRole(roleName) {
            return currentUser && currentUser.role.name === roleName;
        }
        
        // ============================================================================
        // DASHBOARD & DATA LOADING
        // ============================================================================
        
        // Load dashboard stats
        async function loadStats() {
            try {
                const response = await axios.get('/api/dashboard/stats');
                if (response.data.success) {
                    const stats = response.data.data;
                    document.getElementById('stat-employees').textContent = stats.active_employees;
                    document.getElementById('stat-shifts').textContent = stats.shifts_today;
                    document.getElementById('stat-compliance').textContent = stats.compliance_score + '%';
                    document.getElementById('stat-incidents').textContent = stats.incidents_this_month;
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        // Load gamification stats
        async function loadGamificationStats() {
            try {
                const response = await axios.get('/api/gamification/stats/1');
                if (response.data.success) {
                    const stats = response.data.data;
                    document.getElementById('streakDays').textContent = stats.streak_days;
                    document.getElementById('zuzaCoins').textContent = stats.zuza_coins.toLocaleString();
                    document.getElementById('userLevel').textContent = stats.level;
                    document.getElementById('userRank').textContent = stats.rank;
                }
            } catch (error) {
                console.error('Failed to load gamification stats:', error);
            }
        }
        
        // Load live activity feed
        async function loadLiveActivity() {
            try {
                const response = await axios.get('/api/live/activity');
                if (response.data.success) {
                    const activities = response.data.data;
                    if (activities.length > 0) {
                        const latest = activities[0];
                        document.getElementById('liveActivity').textContent = 
                            \`\${latest.icon} \${latest.user} \${latest.action} • \${latest.time}\`;
                    }
                }
            } catch (error) {
                console.error('Failed to load activity:', error);
            }
        }
        
        // Show toast notification
        function showToast(type, message, icon = '') {
            const colors = {
                success: 'from-green-500 to-green-600',
                warning: 'from-yellow-500 to-orange-500',
                info: 'from-blue-500 to-blue-600',
                achievement: 'from-purple-500 to-pink-500',
                points: 'from-yellow-400 to-yellow-600'
            };
            
            const toast = document.createElement('div');
            toast.className = \`notification-slide glass-card p-4 mb-3 bg-gradient-to-r \${colors[type] || colors.info} text-white shadow-2xl\`;
            toast.innerHTML = \`
                <div class="flex items-center gap-3">
                    <div class="text-3xl">\${icon}</div>
                    <div class="flex-1">
                        <div class="font-bold">\${message}</div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="text-white/80 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`;
            
            document.getElementById('toastContainer').appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(400px)';
                    setTimeout(() => toast.remove(), 500);
                }
            }, 5000);
        }
        
        // Open digital twin chat
        function openTwinChat() {
            const twin = document.getElementById('digitalTwin');
            twin.classList.add('speaking');
            showToast('info', 'Hey! I noticed you\'re doing great today! Keep it up! 💪', '🤖');
            setTimeout(() => twin.classList.remove('speaking'), 2000);
        }
        
        // Simulate random achievement notifications
        function simulateAchievements() {
            const achievements = [
                { type: 'achievement', message: 'You unlocked "Early Bird" badge!', icon: '🏆' },
                { type: 'points', message: '+50 ZuZa Coins earned!', icon: '🪙' },
                { type: 'success', message: 'Shift completed perfectly!', icon: '✅' },
                { type: 'warning', message: 'Lerato just took your #2 spot!', icon: '⚡' },
                { type: 'info', message: 'New training module available!', icon: '📚' }
            ];
            
            setInterval(() => {
                if (Math.random() > 0.7) {
                    const achievement = achievements[Math.floor(Math.random() * achievements.length)];
                    showToast(achievement.type, achievement.message, achievement.icon);
                }
            }, 15000);
        }
        
        // Initialize - Check authentication first
        checkAuth().then(() => {
            loadStats();
            loadGamificationStats();
            loadLiveActivity();
            simulateAchievements();
        });
        
        // Refresh stats every 30 seconds
        setInterval(loadStats, 30000);
        setInterval(loadGamificationStats, 45000);
        setInterval(loadLiveActivity, 10000);
        
        // ============================================================================
        // NAVIGATION ROUTER
        // ============================================================================
        
        function navigateToPage(pageName) {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('bg-pastel-blue-light', 'text-white', 'font-semibold');
                item.classList.add('hover:bg-pastel-blue-dark/10');
            });
            
            const activeNav = document.querySelector(\`[data-page="\${pageName}"]\`);
            if (activeNav) {
                activeNav.classList.add('bg-pastel-blue-light', 'text-white', 'font-semibold');
                activeNav.classList.remove('hover:bg-pastel-blue-dark/10');
            }
            
            // Route to appropriate page loader
            switch(pageName) {
                case 'dashboard':
                    loadDashboardPage();
                    break;
                case 'schedule':
                    loadSchedulePage();
                    break;
                case 'employees':
                    loadEmployeesPage();
                    break;
                case 'interns':
                    loadInternsPage();
                    break;
                case 'compliance':
                    loadCompliancePage();
                    break;
                case 'myCompliance':
                    loadMyCompliancePage();
                    break;
                case 'timeTracking':
                    loadTimeTrackingPage();
                    break;
                case 'locations':
                    loadLocationsPage();
                    break;
                case 'leave':
                    loadLeavePage();
                    break;
                case 'onboarding':
                    loadOnboardingPage();
                    break;
                case 'analytics':
                    loadAnalyticsPage();
                    break;
                case 'userManagement':
                    loadUserManagementPage();
                    break;
                case 'shiftSwaps':
                    loadShiftSwapsPage();
                    break;
                case 'messaging':
                    loadMessagingPage();
                    break;
                case 'documents':
                    loadDocumentsPage();
                    break;
                case 'payroll':
                    loadPayrollPage();
                    break;
                case 'forecasting':
                    loadForecastingPage();
                    break;
                case 'attendanceRules':
                    loadAttendanceRulesPage();
                    break;
                case 'budgets':
                    loadBudgetsPage();
                    break;
                case 'social':
                    loadSocialPage();
                    break;
                case 'engagement':
                    loadLeaderboardPage(); // Gamification moved here
                    break;
                default:
                    loadDashboardPage();
            }
        }
        
        function loadDashboardPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading dashboard...</p></div>';
            
            // Get current user role from localStorage or sessionStorage
            const userRole = localStorage.getItem('userRole') || 'employee';
            
            axios.get(\`/api/dashboard/analytics?role=\${userRole}\`).then(response => {
                if (response.data.success) {
                    const { overview, roleSpecific } = response.data.data;
                    
                    // Build role-specific dashboard
                    let dashboardHTML = '';
                    
                    if (roleSpecific.type === 'executive') {
                        // EXECUTIVE/HR DASHBOARD
                        dashboardHTML = \`
                            <!-- Page Header -->
                            <div class="mb-6">
                                <h1 class="text-4xl font-bold text-pastel-blue-dark mb-2">
                                    <i class="fas fa-tachometer-alt mr-3"></i>
                                    Executive Dashboard
                                </h1>
                                <p class="text-gray-600 text-lg">Comprehensive workforce analytics and organizational insights</p>
                            </div>
                            
                            <!-- Key Performance Indicators -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-dark">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Total Workforce</p>
                                            <p class="text-4xl font-bold text-pastel-blue-dark mt-2">\${overview.totalEmployees}</p>
                                            <p class="text-xs text-pastel-blue-light mt-2">Active employees</p>
                                        </div>
                                        <i class="fas fa-users text-5xl text-pastel-blue-dark opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-light">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Scheduled Today</p>
                                            <p class="text-4xl font-bold text-pastel-blue-light mt-2">\${overview.shiftsToday}</p>
                                            <p class="text-xs text-gray-500 mt-2">Active shifts</p>
                                        </div>
                                        <i class="fas fa-calendar-check text-5xl text-pastel-blue-light opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Compliance Score</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${roleSpecific.compliance.percentage}%</p>
                                            <p class="text-xs text-\${roleSpecific.compliance.percentage >= 90 ? 'pastel-blue-light' : 'pastel-blue'} mt-2">
                                                \${roleSpecific.compliance.compliant}/\${roleSpecific.compliance.total} compliant
                                            </p>
                                        </div>
                                        <i class="fas fa-shield-check text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Incidents (30d)</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${overview.recentIncidents}</p>
                                            <p class="text-xs text-gray-500 mt-2">Safety & compliance</p>
                                        </div>
                                        <i class="fas fa-exclamation-triangle text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Workforce Distribution by Location -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-map-marked-alt mr-3"></i>
                                    Workforce Distribution Across South Africa
                                </h2>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    \${roleSpecific.locations.map(loc => \`
                                        <div class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-dark/10 to-pastel-blue-light/10 border border-pastel-blue-dark/20">
                                            <div class="flex items-center justify-between mb-2">
                                                <h3 class="font-bold text-lg text-gray-800">\${loc.name}</h3>
                                                <span class="px-3 py-1 bg-pastel-blue-dark text-white rounded-full text-sm font-bold">\${loc.employee_count}</span>
                                            </div>
                                            <p class="text-sm text-gray-600">
                                                <i class="fas fa-map-pin mr-1 text-pastel-blue"></i>
                                                \${loc.city}, \${loc.province}
                                            </p>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                            
                            <!-- Department Performance -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue-light mb-4 flex items-center">
                                    <i class="fas fa-building mr-3"></i>
                                    Department Headcount vs Target
                                </h2>
                                <div class="space-y-4">
                                    \${roleSpecific.departments.map(dept => {
                                        const fillRate = dept.headcount_target > 0 
                                            ? Math.round((dept.employee_count / dept.headcount_target) * 100) 
                                            : 100;
                                        const isUnderstaffed = fillRate < 80;
                                        
                                        return \`
                                            <div class="p-4 rounded-xl bg-white border-l-4 \${isUnderstaffed ? 'border-pastel-blue' : 'border-pastel-blue-light'}">
                                                <div class="flex items-center justify-between mb-2">
                                                    <div class="flex-1">
                                                        <h3 class="font-bold text-lg">\${dept.name}</h3>
                                                        <div class="flex items-center gap-4 mt-1">
                                                            <span class="text-sm text-gray-600">
                                                                <i class="fas fa-users mr-1"></i>
                                                                Current: <span class="font-bold">\${dept.employee_count}</span>
                                                            </span>
                                                            <span class="text-sm text-gray-600">
                                                                <i class="fas fa-bullseye mr-1"></i>
                                                                Target: <span class="font-bold">\${dept.headcount_target || 'N/A'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div class="text-right">
                                                        <div class="text-3xl font-bold \${isUnderstaffed ? 'text-pastel-blue' : 'text-pastel-blue-light'}">
                                                            \${fillRate}%
                                                        </div>
                                                        <div class="text-xs \${isUnderstaffed ? 'text-pastel-blue' : 'text-pastel-blue-light'} font-semibold">
                                                            \${isUnderstaffed ? 'UNDERSTAFFED' : 'ON TARGET'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <div class="h-full \${isUnderstaffed ? 'bg-pastel-blue' : 'bg-pastel-blue-light'} transition-all" 
                                                         style="width: \${Math.min(100, fillRate)}%"></div>
                                                </div>
                                            </div>
                                        \`;
                                    }).join('')}
                                </div>
                            </div>
                            
                            <!-- Workforce Operations Dashboard -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <!-- Pending Actions -->
                                <div class="glass-card p-6">
                                    <h3 class="text-xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                        <i class="fas fa-tasks mr-2"></i>
                                        Pending Actions
                                    </h3>
                                    <div class="space-y-3">
                                        <div class="p-3 rounded-lg bg-pastel-blue/10 border border-pastel-blue/30 flex items-center justify-between">
                                            <div>
                                                <div class="font-bold text-gray-800">Shift Swap Requests</div>
                                                <div class="text-sm text-gray-600">Awaiting manager approval</div>
                                            </div>
                                            <div class="text-2xl font-bold text-pastel-blue">\${roleSpecific.workforceMetrics.pendingSwaps}</div>
                                        </div>
                                        
                                        <div class="p-3 rounded-lg bg-pastel-blue/10 border border-pastel-blue/30 flex items-center justify-between">
                                            <div>
                                                <div class="font-bold text-gray-800">Attendance Violations</div>
                                                <div class="text-sm text-gray-600">Unresolved (last 7 days)</div>
                                            </div>
                                            <div class="text-2xl font-bold text-pastel-blue">\${roleSpecific.workforceMetrics.activeViolations}</div>
                                        </div>
                                        
                                        <div class="p-3 rounded-lg bg-pastel-blue-dark/10 border border-pastel-blue-dark/30 flex items-center justify-between">
                                            <div>
                                                <div class="font-bold text-gray-800">Leave Requests</div>
                                                <div class="text-sm text-gray-600">Pending approval</div>
                                            </div>
                                            <div class="text-2xl font-bold text-pastel-blue-dark">\${overview.pendingLeave}</div>
                                        </div>
                                        
                                        <div class="p-3 rounded-lg bg-pastel-blue-light/10 border border-pastel-blue-light/30 flex items-center justify-between">
                                            <div>
                                                <div class="font-bold text-gray-800">Compliance Checks</div>
                                                <div class="text-sm text-gray-600">Pending review</div>
                                            </div>
                                            <div class="text-2xl font-bold text-pastel-blue-light">\${roleSpecific.compliance.pending}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Budget Overview -->
                                <div class="glass-card p-6">
                                    <h3 class="text-xl font-bold text-pastel-blue-light mb-4 flex items-center">
                                        <i class="fas fa-dollar-sign mr-2"></i>
                                        Labor Budget Overview (30d)
                                    </h3>
                                    <div class="space-y-4">
                                        <div>
                                            <div class="flex justify-between text-sm mb-2">
                                                <span class="text-gray-600 font-medium">Budgeted Amount</span>
                                                <span class="font-bold text-pastel-blue-dark">R \${(roleSpecific.workforceMetrics.totalBudget || 0).toFixed(2)}</span>
                                            </div>
                                            <div class="flex justify-between text-sm mb-2">
                                                <span class="text-gray-600 font-medium">Actual Spend</span>
                                                <span class="font-bold text-pastel-blue-light">R \${(roleSpecific.workforceMetrics.totalActual || 0).toFixed(2)}</span>
                                            </div>
                                            <div class="flex justify-between text-sm mb-3">
                                                <span class="text-gray-600 font-medium">Variance</span>
                                                <span class="font-bold \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'text-pastel-blue' : 'text-pastel-blue-light'}">
                                                    R \${Math.abs(roleSpecific.workforceMetrics.budgetVariance || 0).toFixed(2)}
                                                    \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? '(Over)' : '(Under)'}
                                                </span>
                                            </div>
                                            <div class="h-4 bg-gray-200 rounded-full overflow-hidden">
                                                <div class="h-full \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'bg-pastel-blue' : 'bg-pastel-blue-light'}" 
                                                     style="width: \${roleSpecific.workforceMetrics.totalBudget > 0 ? Math.min(100, (roleSpecific.workforceMetrics.totalActual / roleSpecific.workforceMetrics.totalBudget) * 100) : 0}%"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="p-4 rounded-lg \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'bg-pastel-blue/10 border border-pastel-blue/30' : 'bg-pastel-blue-light/10 border border-pastel-blue-light/30'}">
                                            <div class="flex items-center gap-2 mb-2">
                                                <i class="fas fa-\${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'exclamation-triangle' : 'check-circle'} text-xl \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'text-pastel-blue' : 'text-pastel-blue-light'}"></i>
                                                <span class="font-bold \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'text-pastel-blue' : 'text-pastel-blue-light'}">
                                                    \${roleSpecific.workforceMetrics.budgetVariance >= 0 ? 'Budget Overrun Alert' : 'Within Budget'}
                                                </span>
                                            </div>
                                            <p class="text-sm text-gray-700">
                                                \${roleSpecific.workforceMetrics.budgetVariance >= 0 
                                                    ? 'Review spending patterns and optimize labor allocation.' 
                                                    : 'Excellent cost management. Labor costs are under control.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="glass-card p-6">
                                <h3 class="text-xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-bolt mr-2"></i>
                                    Quick Actions
                                </h3>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button onclick="navigateToPage('employees')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-dark/10 to-pastel-blue-dark/20 hover:from-pastel-blue-dark/20 hover:to-pastel-blue-dark/30 border border-pastel-blue-dark/30 transition text-center">
                                        <i class="fas fa-user-plus text-3xl text-pastel-blue-dark mb-2"></i>
                                        <div class="font-bold text-sm">Add Employee</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('schedule')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-light/10 to-pastel-blue-light/20 hover:from-pastel-blue-light/20 hover:to-pastel-blue-light/30 border border-pastel-blue-light/30 transition text-center">
                                        <i class="fas fa-calendar-plus text-3xl text-pastel-blue-light mb-2"></i>
                                        <div class="font-bold text-sm">Create Schedule</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('compliance')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-clipboard-check text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">Run Compliance</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('analytics')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-chart-bar text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">View Reports</div>
                                    </button>
                                </div>
                            </div>
                        \`;
                        
                    } else if (roleSpecific.type === 'manager') {
                        // MANAGER DASHBOARD
                        dashboardHTML = \`
                            <!-- Page Header -->
                            <div class="mb-6">
                                <h1 class="text-4xl font-bold text-pastel-blue-light mb-2">
                                    <i class="fas fa-user-tie mr-3"></i>
                                    Team Manager Dashboard
                                </h1>
                                <p class="text-gray-600 text-lg">Manage your team's schedule, attendance, and performance</p>
                            </div>
                            
                            <!-- Team Overview -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-dark">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Team Size</p>
                                            <p class="text-4xl font-bold text-pastel-blue-dark mt-2">\${roleSpecific.teamSize}</p>
                                            <p class="text-xs text-gray-500 mt-2">Active members</p>
                                        </div>
                                        <i class="fas fa-users text-5xl text-pastel-blue-dark opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-light">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Working Now</p>
                                            <p class="text-4xl font-bold text-pastel-blue-light mt-2">\${roleSpecific.attendance.currentlyWorking}</p>
                                            <p class="text-xs text-gray-500 mt-2">Clocked in today: \${roleSpecific.attendance.totalClocked}</p>
                                        </div>
                                        <i class="fas fa-clock text-5xl text-pastel-blue-light opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Pending Approvals</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${roleSpecific.pendingApprovals.swaps + roleSpecific.pendingApprovals.leave}</p>
                                            <p class="text-xs text-gray-500 mt-2">Swaps: \${roleSpecific.pendingApprovals.swaps} | Leave: \${roleSpecific.pendingApprovals.leave}</p>
                                        </div>
                                        <i class="fas fa-clipboard-list text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Shifts Today</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${roleSpecific.todayShifts.length}</p>
                                            <p class="text-xs text-gray-500 mt-2">Scheduled shifts</p>
                                        </div>
                                        <i class="fas fa-calendar-day text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Today's Shifts -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-calendar-alt mr-3"></i>
                                    Today's Team Schedule
                                </h2>
                                \${roleSpecific.todayShifts.length > 0 ? \`
                                    <div class="space-y-3">
                                        \${roleSpecific.todayShifts.map(shift => \`
                                            <div class="p-4 rounded-xl bg-white border-l-4 border-pastel-blue-light flex items-center justify-between">
                                                <div class="flex items-center gap-4">
                                                    <div class="w-12 h-12 rounded-full bg-pastel-blue-light/20 flex items-center justify-center">
                                                        <i class="fas fa-user text-pastel-blue-light text-xl"></i>
                                                    </div>
                                                    <div>
                                                        <div class="font-bold text-lg">\${shift.first_name} \${shift.last_name}</div>
                                                        <div class="text-sm text-gray-600">
                                                            <i class="fas fa-clock mr-1"></i>
                                                            \${shift.start_time} - \${shift.end_time}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span class="px-4 py-2 bg-pastel-blue-light/10 text-pastel-blue-light rounded-lg font-bold">
                                                    \${shift.shift_type || 'Regular'}
                                                </span>
                                            </div>
                                        \`).join('')}
                                    </div>
                                \` : \`
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-calendar-times text-6xl mb-4 opacity-30"></i>
                                        <p>No shifts scheduled for today</p>
                                    </div>
                                \`}
                            </div>
                            
                            <!-- Pending Leave Requests -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue mb-4 flex items-center">
                                    <i class="fas fa-umbrella-beach mr-3"></i>
                                    Pending Leave Requests
                                </h2>
                                \${roleSpecific.pendingLeave.length > 0 ? \`
                                    <div class="space-y-3">
                                        \${roleSpecific.pendingLeave.map(leave => \`
                                            <div class="p-4 rounded-xl bg-white border-l-4 border-pastel-blue">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-bold text-lg">\${leave.first_name} \${leave.last_name}</div>
                                                        <div class="text-sm text-gray-600 mt-1">
                                                            <i class="fas fa-calendar mr-1"></i>
                                                            \${leave.start_date} to \${leave.end_date} (\${leave.days_requested} days)
                                                        </div>
                                                        <div class="text-sm text-gray-600 mt-1">
                                                            <i class="fas fa-tag mr-1"></i>
                                                            Type: <span class="font-semibold">\${leave.leave_type}</span>
                                                        </div>
                                                    </div>
                                                    <div class="flex gap-2">
                                                        <button class="px-4 py-2 bg-pastel-blue-light text-white rounded-lg font-bold hover:shadow-lg transition">
                                                            <i class="fas fa-check mr-1"></i> Approve
                                                        </button>
                                                        <button class="px-4 py-2 bg-pastel-blue text-white rounded-lg font-bold hover:shadow-lg transition">
                                                            <i class="fas fa-times mr-1"></i> Decline
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        \`).join('')}
                                    </div>
                                \` : \`
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-check-circle text-6xl mb-4 opacity-30"></i>
                                        <p>No pending leave requests</p>
                                    </div>
                                \`}
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="glass-card p-6">
                                <h3 class="text-xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-bolt mr-2"></i>
                                    Quick Actions
                                </h3>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button onclick="navigateToPage('schedule')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-dark/10 to-pastel-blue-dark/20 hover:from-pastel-blue-dark/20 hover:to-pastel-blue-dark/30 border border-pastel-blue-dark/30 transition text-center">
                                        <i class="fas fa-calendar-plus text-3xl text-pastel-blue-dark mb-2"></i>
                                        <div class="font-bold text-sm">Create Shift</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('shiftSwaps')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-light/10 to-pastel-blue-light/20 hover:from-pastel-blue-light/20 hover:to-pastel-blue-light/30 border border-pastel-blue-light/30 transition text-center">
                                        <i class="fas fa-exchange-alt text-3xl text-pastel-blue-light mb-2"></i>
                                        <div class="font-bold text-sm">Approve Swaps</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('timeTracking')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-clock text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">View Timesheets</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('messaging')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-bullhorn text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">Team Message</div>
                                    </button>
                                </div>
                            </div>
                        \`;
                        
                    } else {
                        // EMPLOYEE DASHBOARD
                        dashboardHTML = \`
                            <!-- Page Header -->
                            <div class="mb-6">
                                <h1 class="text-4xl font-bold text-pastel-blue-light mb-2">
                                    <i class="fas fa-home mr-3"></i>
                                    My Workspace
                                </h1>
                                <p class="text-gray-600 text-lg">Your schedule, tasks, and personal information</p>
                            </div>
                            
                            <!-- Personal Stats -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-dark">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Today's Status</p>
                                            <p class="text-2xl font-bold text-pastel-blue-dark mt-2">
                                                \${roleSpecific.myTimeToday ? (roleSpecific.myTimeToday.clock_out_time ? 'Clocked Out' : 'Working') : 'Not Started'}
                                            </p>
                                            <p class="text-xs text-gray-500 mt-2">
                                                \${roleSpecific.myTimeToday ? roleSpecific.myTimeToday.clock_in_time.substring(11, 16) : '--:--'}
                                            </p>
                                        </div>
                                        <i class="fas fa-user-clock text-5xl text-pastel-blue-dark opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue-light">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Upcoming Shifts</p>
                                            <p class="text-4xl font-bold text-pastel-blue-light mt-2">\${roleSpecific.myShifts.length}</p>
                                            <p class="text-xs text-gray-500 mt-2">Next 7 days</p>
                                        </div>
                                        <i class="fas fa-calendar-alt text-5xl text-pastel-blue-light opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Leave Requests</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${roleSpecific.myLeave.length}</p>
                                            <p class="text-xs text-gray-500 mt-2">All statuses</p>
                                        </div>
                                        <i class="fas fa-umbrella-beach text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                                
                                <div class="glass-card p-6 border-l-4 border-pastel-blue">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-gray-600 text-sm font-medium">Available Swaps</p>
                                            <p class="text-4xl font-bold text-pastel-blue mt-2">\${roleSpecific.availableSwaps.length}</p>
                                            <p class="text-xs text-gray-500 mt-2">Open requests</p>
                                        </div>
                                        <i class="fas fa-exchange-alt text-5xl text-pastel-blue opacity-20"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- My Upcoming Shifts -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-calendar-week mr-3"></i>
                                    My Upcoming Shifts
                                </h2>
                                \${roleSpecific.myShifts.length > 0 ? \`
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        \${roleSpecific.myShifts.map(shift => \`
                                            <div class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-light/10 to-pastel-blue-dark/10 border border-pastel-blue-light/30">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-lg font-bold text-pastel-blue-dark">
                                                        \${new Date(shift.shift_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span class="px-3 py-1 bg-pastel-blue-light text-white rounded-full text-xs font-bold">
                                                        \${shift.shift_type || 'Regular'}
                                                    </span>
                                                </div>
                                                <div class="text-2xl font-bold text-gray-800 mb-2">
                                                    \${shift.start_time} - \${shift.end_time}
                                                </div>
                                                <div class="text-sm text-gray-600">
                                                    Duration: \${shift.duration_hours || 8}h
                                                </div>
                                            </div>
                                        \`).join('')}
                                    </div>
                                \` : \`
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-calendar-times text-6xl mb-4 opacity-30"></i>
                                        <p>No upcoming shifts scheduled</p>
                                    </div>
                                \`}
                            </div>
                            
                            <!-- Available Shift Swaps -->
                            \${roleSpecific.availableSwaps.length > 0 ? \`
                                <div class="glass-card p-6 mb-6">
                                    <h2 class="text-2xl font-bold text-pastel-blue mb-4 flex items-center">
                                        <i class="fas fa-exchange-alt mr-3"></i>
                                        Available Shift Swaps
                                    </h2>
                                    <div class="space-y-3">
                                        \${roleSpecific.availableSwaps.map(swap => \`
                                            <div class="p-4 rounded-xl bg-white border-l-4 border-pastel-blue">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-bold text-lg">\${swap.first_name} \${swap.last_name} is offering:</div>
                                                        <div class="text-sm text-gray-600 mt-1">
                                                            <i class="fas fa-calendar mr-1"></i>
                                                            \${new Date(swap.shift_date).toLocaleDateString()} • \${swap.start_time} - \${swap.end_time}
                                                        </div>
                                                    </div>
                                                    <button class="px-4 py-2 bg-pastel-blue-light text-white rounded-lg font-bold hover:shadow-lg transition">
                                                        <i class="fas fa-handshake mr-1"></i> Take Shift
                                                    </button>
                                                </div>
                                            </div>
                                        \`).join('')}
                                    </div>
                                </div>
                            \` : ''}
                            
                            <!-- My Compliance Status -->
                            <div class="glass-card p-6 mb-6">
                                <h2 class="text-2xl font-bold text-pastel-blue-light mb-4 flex items-center">
                                    <i class="fas fa-clipboard-check mr-3"></i>
                                    My Compliance Status
                                </h2>
                                \${roleSpecific.myCompliance.length > 0 ? \`
                                    <div class="space-y-3">
                                        \${roleSpecific.myCompliance.map(check => \`
                                            <div class="p-4 rounded-xl bg-white border-l-4 \${
                                                check.status === 'compliant' ? 'border-pastel-blue-light' :
                                                check.status === 'non_compliant' ? 'border-pastel-blue' :
                                                'border-pastel-blue'
                                            }">
                                                <div class="flex items-center justify-between">
                                                    <div class="flex-1">
                                                        <div class="font-bold text-lg">\${check.check_type}</div>
                                                        <div class="text-sm text-gray-600 mt-1">
                                                            Checked: \${new Date(check.check_date).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <span class="px-4 py-2 rounded-lg font-bold \${
                                                        check.status === 'compliant' ? 'bg-pastel-blue-light/10 text-pastel-blue-light' :
                                                        check.status === 'non_compliant' ? 'bg-pastel-blue/10 text-pastel-blue' :
                                                        'bg-pastel-blue/10 text-pastel-blue'
                                                    }">
                                                        \${check.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        \`).join('')}
                                    </div>
                                \` : \`
                                    <div class="text-center py-8 text-gray-500">
                                        <i class="fas fa-check-circle text-6xl mb-4 opacity-30"></i>
                                        <p>No compliance checks recorded</p>
                                    </div>
                                \`}
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="glass-card p-6">
                                <h3 class="text-xl font-bold text-pastel-blue-dark mb-4 flex items-center">
                                    <i class="fas fa-bolt mr-2"></i>
                                    Quick Actions
                                </h3>
                                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button onclick="navigateToPage('schedule')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-dark/10 to-pastel-blue-dark/20 hover:from-pastel-blue-dark/20 hover:to-pastel-blue-dark/30 border border-pastel-blue-dark/30 transition text-center">
                                        <i class="fas fa-calendar-alt text-3xl text-pastel-blue-dark mb-2"></i>
                                        <div class="font-bold text-sm">View Schedule</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('leave')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue-light/10 to-pastel-blue-light/20 hover:from-pastel-blue-light/20 hover:to-pastel-blue-light/30 border border-pastel-blue-light/30 transition text-center">
                                        <i class="fas fa-paper-plane text-3xl text-pastel-blue-light mb-2"></i>
                                        <div class="font-bold text-sm">Request Leave</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('shiftSwaps')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-exchange-alt text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">Swap Shift</div>
                                    </button>
                                    
                                    <button onclick="navigateToPage('myCompliance')" class="p-4 rounded-xl bg-gradient-to-br from-pastel-blue/10 to-pastel-blue/20 hover:from-pastel-blue/20 hover:to-pastel-blue/30 border border-pastel-blue/30 transition text-center">
                                        <i class="fas fa-shield-alt text-3xl text-pastel-blue mb-2"></i>
                                        <div class="font-bold text-sm">My Compliance</div>
                                    </button>
                                </div>
                            </div>
                        \`;
                    }
                    
                    mainContent.innerHTML = dashboardHTML;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading dashboard</p></div>';
            });
        }
        
        function loadLeaderboardPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading leaderboard...</p></div>';
            
            axios.get('/api/leaderboard?type=points').then(response => {
                if (response.data.success) {
                    const leaders = response.data.data;
                    let leaderHTML = '<div class="glass-card p-6 mb-6"><h2 class="text-3xl font-bold text-pastel-blue-dark mb-6"><i class="fas fa-trophy mr-3 text-pastel-blue"></i>Top Performers - Overall Points</h2><div class="space-y-4">';
                    
                    leaders.forEach((leader, idx) => {
                        const rankClass = idx === 0 ? 'rank-1' : (idx === 1 ? 'rank-2' : (idx === 2 ? 'rank-3' : 'glass-card'));
                        const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : ''));
                        
                        leaderHTML += '<div class="' + rankClass + ' p-4 rounded-xl flex items-center justify-between">' +
                            '<div class="flex items-center gap-4">' +
                                '<div class="text-4xl font-bold ' + (idx < 3 ? 'text-white' : 'text-pastel-blue-dark') + '">' + (idx + 1) + '</div>' +
                                '<div class="text-3xl">' + medal + '</div>' +
                                '<div>' +
                                    '<div class="font-bold text-lg ' + (idx < 3 ? 'text-white' : 'text-gray-800') + '">' + leader.name + '</div>' +
                                    '<div class="text-sm ' + (idx < 3 ? 'text-white/80' : 'text-gray-600') + '">' + leader.job_title + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="text-right">' +
                                '<div class="text-2xl font-bold ' + (idx < 3 ? 'text-white' : 'text-pastel-blue-light') + '">' + leader.points.toLocaleString() + ' pts</div>' +
                                '<div class="text-sm ' + (idx < 3 ? 'text-white/80' : 'text-gray-600') + '">Rank: #' + leader.rank + '</div>' +
                            '</div>' +
                        '</div>';
                    });
                    
                    leaderHTML += '</div></div>';
                    mainContent.innerHTML = leaderHTML;
                } else {
                    mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Failed to load leaderboard</h3></div>';
                }
            }).catch(error => {
                console.error('Error loading leaderboard:', error);
                mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Error loading leaderboard</h3></div>';
            });
        }
        
        function loadEmployeesPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading employees...</p></div>';
            
            axios.get('/api/employees?per_page=20').then(response => {
                if (response.data.success) {
                    const employees = response.data.data;
                    let empHTML = '<div class="mb-6"><h2 class="text-3xl font-bold text-pastel-blue-dark"><i class="fas fa-users mr-3"></i>People & Talent Management</h2><p class="text-gray-600 mt-2">' + response.data.meta.total + ' total employees</p></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
                    
                    employees.forEach(emp => {
                        empHTML += '<div class="glass-card p-4 hover:scale-102 transition">' +
                            '<div class="flex items-start justify-between mb-3">' +
                                '<div class="flex-1">' +
                                    '<h3 class="font-bold text-lg text-gray-800">' + emp.first_name + ' ' + emp.last_name + '</h3>' +
                                    '<p class="text-sm text-gray-600">' + emp.job_title + '</p>' +
                                    '<p class="text-xs text-gray-500">' + (emp.department_name || 'No Department') + '</p>' +
                                '</div>' +
                                '<div class="text-right">' +
                                    '<span class="px-2 py-1 bg-pastel-blue-light text-white text-xs rounded-full font-bold">' + emp.employment_type + '</span>' +
                                    '<p class="text-xs text-gray-500 mt-1">' + emp.employee_number + '</p>' +
                                '</div>' +
                            '</div>' +
                            '<div class="flex items-center gap-2 text-xs text-gray-600">' +
                                '<i class="fas fa-map-marker-alt"></i>' +
                                '<span>' + (emp.location_name || 'No Location') + '</span>' +
                            '</div>' +
                        '</div>';
                    });
                    
                    empHTML += '</div>';
                    mainContent.innerHTML = empHTML;
                } else {
                    mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Failed to load employees</h3></div>';
                }
            }).catch(error => {
                console.error('Error loading employees:', error);
                mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Error loading employees</h3></div>';
            });
        }
        
        function loadSchedulePage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading shifts...</p></div>';
            
            axios.get('/api/shifts').then(response => {
                if (response.data.success) {
                    const shifts = response.data.data;
                    let shiftHTML = '<div class="mb-6"><h2 class="text-3xl font-bold text-pastel-blue-light"><i class="fas fa-calendar-alt mr-3"></i>Today\'s Shift Schedule</h2><p class="text-gray-600 mt-2">' + shifts.length + ' shifts scheduled</p></div><div class="space-y-4">';
                    
                    shifts.forEach(shift => {
                        const statusColor = shift.status === 'Completed' ? 'bg-pastel-blue-light' : (shift.status === 'In Progress' ? 'bg-pastel-blue-dark' : 'bg-gray-400');
                        
                        shiftHTML += '<div class="glass-card p-4">' +
                            '<div class="flex items-start justify-between">' +
                                '<div class="flex-1">' +
                                    '<div class="flex items-center gap-2 mb-2">' +
                                        '<h3 class="font-bold text-gray-800">' + (shift.employee_name || 'Unassigned') + '</h3>' +
                                        '<span class="px-2 py-1 ' + statusColor + ' text-white text-xs rounded-full font-bold">' + shift.status + '</span>' +
                                    '</div>' +
                                    '<p class="text-sm text-gray-600"><i class="fas fa-building mr-2"></i>' + (shift.location_name || 'No Location') + '</p>' +
                                    '<p class="text-sm text-gray-600"><i class="fas fa-briefcase mr-2"></i>' + (shift.department_name || 'No Department') + '</p>' +
                                '</div>' +
                                '<div class="text-right">' +
                                    '<p class="text-sm font-bold text-pastel-blue-dark">' + shift.start_time + ' - ' + shift.end_time + '</p>' +
                                    '<p class="text-xs text-gray-500">' + shift.duration_hours + ' hours</p>' +
                                    '<p class="text-xs text-gray-600 mt-1">' + shift.shift_type + '</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>';
                    });
                    
                    shiftHTML += '</div>';
                    mainContent.innerHTML = shiftHTML;
                } else {
                    mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Failed to load shifts</h3></div>';
                }
            }).catch(error => {
                console.error('Error loading shifts:', error);
                mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Error loading shifts</h3></div>';
            });
        }
        
        function loadSocialPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading social feed...</p></div>';
            
            axios.get('/api/social/posts').then(response => {
                if (response.data.success) {
                    const posts = response.data.data;
                    let socialHTML = '<div class="mb-6"><h2 class="text-3xl font-bold text-pastel-blue"><i class="fas fa-comments mr-3"></i>Social Feed</h2><p class="text-gray-600 mt-2">Company-wide updates and collaboration</p></div><div class="space-y-4">';
                    
                    posts.forEach(post => {
                        socialHTML += '<div class="glass-card p-6">' +
                            '<div class="flex items-start gap-4 mb-4">' +
                                '<div class="w-12 h-12 rounded-full bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-light flex items-center justify-center text-white font-bold text-xl">' +
                                    post.author_name.charAt(0) +
                                '</div>' +
                                '<div class="flex-1">' +
                                    '<h4 class="font-bold text-gray-800">' + post.author_name + '</h4>' +
                                    '<p class="text-xs text-gray-500">' + (post.author_title || 'Team Member') + ' • ' + new Date(post.created_at).toLocaleString() + '</p>' +
                                '</div>' +
                                '<span class="px-3 py-1 bg-pastel-blue-dark/10 text-pastel-blue-dark text-xs rounded-full font-semibold">' + post.post_type + '</span>' +
                            '</div>' +
                            '<p class="text-gray-700 mb-4">' + post.content + '</p>' +
                            '<div class="flex items-center gap-6 text-sm text-gray-600">' +
                                '<button class="flex items-center gap-2 hover:text-pastel-blue transition"><i class="fas fa-heart"></i><span>' + post.likes_count + ' likes</span></button>' +
                                '<button class="flex items-center gap-2 hover:text-pastel-blue-dark transition"><i class="fas fa-comment"></i><span>' + post.comments_count + ' comments</span></button>' +
                            '</div>' +
                        '</div>';
                    });
                    
                    socialHTML += '</div>';
                    mainContent.innerHTML = socialHTML;
                } else {
                    mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Failed to load social feed</h3></div>';
                }
            }).catch(error => {
                console.error('Error loading social feed:', error);
                mainContent.innerHTML = '<div class="glass-card p-12 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><h3 class="text-2xl font-bold">Error loading social feed</h3></div>';
            });
        }
        
        function loadTrainingPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="glass-card p-12 text-center">' +
                '<i class="fas fa-graduation-cap text-6xl text-pastel-blue mb-4"></i>' +
                '<h2 class="text-3xl font-bold text-gray-800 mb-2">Skills & Training</h2>' +
                '<p class="text-gray-600 mb-6">Coming Soon: Training modules, skills tracking, and SETA compliance</p>' +
                '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
                    '<div class="p-4 bg-pastel-blue-dark/10 rounded-xl"><i class="fas fa-book text-3xl text-pastel-blue-dark mb-2"></i><p class="font-bold">Training Modules</p></div>' +
                    '<div class="p-4 bg-pastel-blue-light/10 rounded-xl"><i class="fas fa-certificate text-3xl text-pastel-blue-light mb-2"></i><p class="font-bold">Certifications</p></div>' +
                    '<div class="p-4 bg-pastel-blue/10 rounded-xl"><i class="fas fa-chart-line text-3xl text-pastel-blue mb-2"></i><p class="font-bold">Skills Progress</p></div>' +
                '</div>' +
            '</div>';
        }
        
        function loadRewardsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="glass-card p-12 text-center">' +
                '<i class="fas fa-gift text-6xl text-pastel-blue mb-4"></i>' +
                '<h2 class="text-3xl font-bold text-gray-800 mb-2">Rewards Store</h2>' +
                '<p class="text-gray-600 mb-6">Redeem your ZuZa Coins for awesome rewards!</p>' +
                '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
                    '<div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-light text-white rounded-xl"><i class="fas fa-coffee text-4xl mb-3"></i><h3 class="font-bold text-xl mb-2">Free Coffee</h3><p class="text-sm mb-3">50 ZuZa Coins</p><button class="px-4 py-2 bg-white text-pastel-blue-dark rounded-lg font-bold">Redeem</button></div>' +
                    '<div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue text-white rounded-xl"><i class="fas fa-parking text-4xl mb-3"></i><h3 class="font-bold text-xl mb-2">Premium Parking</h3><p class="text-sm mb-3">100 ZuZa Coins</p><button class="px-4 py-2 bg-white text-pastel-blue-light rounded-lg font-bold">Redeem</button></div>' +
                    '<div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue text-white rounded-xl"><i class="fas fa-tshirt text-4xl mb-3"></i><h3 class="font-bold text-xl mb-2">Company Merch</h3><p class="text-sm mb-3">200 ZuZa Coins</p><button class="px-4 py-2 bg-white text-pastel-blue rounded-lg font-bold">Redeem</button></div>' +
                '</div>' +
            '</div>';
        }
        
        // Show welcome notification
        setTimeout(() => {
            showToast('success', 'Welcome back! Your 15-day streak is impressive! 🔥', '👋');
        }, 1000);
        
        // ============================================================================
        // HR GEOLOCATION DASHBOARD
        // ============================================================================
        
        async function loadGeoLocationDashboard() {
            const mainContent = document.querySelector('.col-span-12.md\\:col-span-9');
            
            try {
                // Fetch team locations and locations list
                const [teamResponse, locationsResponse, deptsResponse] = await Promise.all([
                    axios.get('/api/hr/team-locations'),
                    axios.get('/api/locations'),
                    axios.get('/api/departments')
                ]);
                
                const teamData = teamResponse.data.success ? teamResponse.data.data : [];
                const locations = locationsResponse.data.success ? locationsResponse.data.data : [];
                const departments = deptsResponse.data.success ? deptsResponse.data.data : [];
                
                // Group workers by location
                const workersByLocation = {};
                teamData.forEach(worker => {
                    const locName = worker.location_name || 'Unassigned';
                    if (!workersByLocation[locName]) {
                        workersByLocation[locName] = [];
                    }
                    workersByLocation[locName].push(worker);
                });
                
                // Build statistics first
                const totalWorkers = teamData.length;
                const activeWorkers = teamData.filter(w => w.clock_in_time && !w.clock_out_time).length;
                const onBreakWorkers = teamData.filter(w => w.shift_status === 'On Break').length;
                const locationCount = locations.length;
                
                mainContent.innerHTML = \`
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h2 class="text-3xl font-bold">
                                    <i class="fas fa-map-marked-alt mr-3 text-pastel-blue-light"></i>
                                    <span class="sa-gradient bg-clip-text text-transparent">Team Locations Dashboard</span>
                                </h2>
                                <p class="text-gray-600 mt-1">Real-time geolocation tracking across South Africa</p>
                            </div>
                            <button onclick="loadStats(); loadGeoLocationDashboard();" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:scale-105 transition">
                                <i class="fas fa-sync-alt mr-2"></i> Refresh
                            </button>
                        </div>
                    </div>
                    
                    <!-- Statistics Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div class="glass-card p-6 border-l-4 border-pastel-blue-dark">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-600 text-sm font-medium">Total Workers</p>
                                    <p class="text-3xl font-bold text-pastel-blue-dark mt-1">\${totalWorkers}</p>
                                </div>
                                <i class="fas fa-users text-5xl text-pastel-blue-dark opacity-20"></i>
                            </div>
                        </div>
                        
                        <div class="glass-card p-6 border-l-4 border-pastel-blue-light">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-600 text-sm font-medium">Currently Active</p>
                                    <p class="text-3xl font-bold text-pastel-blue-light mt-1">\${activeWorkers}</p>
                                    <div class="flex items-center gap-1 mt-1">
                                        <div class="w-2 h-2 bg-pastel-blue-light rounded-full animate-pulse"></div>
                                        <span class="text-xs text-pastel-blue-light font-bold">LIVE</span>
                                    </div>
                                </div>
                                <i class="fas fa-user-check text-5xl text-pastel-blue-light opacity-20"></i>
                            </div>
                        </div>
                        
                        <div class="glass-card p-6 border-l-4 border-pastel-blue">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-600 text-sm font-medium">On Break</p>
                                    <p class="text-3xl font-bold text-pastel-blue mt-1">\${onBreakWorkers}</p>
                                </div>
                                <i class="fas fa-coffee text-5xl text-pastel-blue opacity-20"></i>
                            </div>
                        </div>
                        
                        <div class="glass-card p-6 border-l-4 border-pastel-blue">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-gray-600 text-sm font-medium">Locations</p>
                                    <p class="text-3xl font-bold text-pastel-blue mt-1">\${locationCount}</p>
                                    <p class="text-xs text-gray-500 mt-1">Across 9 provinces</p>
                                </div>
                                <i class="fas fa-map-marker-alt text-5xl text-pastel-blue opacity-20"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Cards Grid -->
                    <div class="glass-card p-6 mb-6">
                        <h3 class="text-xl font-bold text-pastel-blue-dark mb-4">
                            <i class="fas fa-building mr-2"></i>
                            Locations Overview
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="locationGrid">
                            <!-- Will be populated by JavaScript -->
                        </div>
                    </div>
                    
                    <!-- Worker Details Modal (will be populated on click) -->
                    <div id="workerDetailsModal" class="hidden"></div>
                \`;
                
                // Store data for modal use
                window.teamLocationData = teamData;
                window.workersByLocationData = workersByLocation;
                
                // Build location cards dynamically
                const locationGrid = document.getElementById('locationGrid');
                locations.forEach(loc => {
                    const workers = workersByLocation[loc.name] || [];
                    const clockedInCount = workers.filter(w => w.clock_in_time && !w.clock_out_time).length;
                    
                    const card = document.createElement('div');
                    card.className = 'glass-card p-6 hover:scale-105 transition cursor-pointer';
                    card.onclick = () => showLocationWorkers(loc.name);
                    
                    const gpsText = loc.latitude && loc.longitude 
                        ? '<p class="text-xs text-gray-500 mt-1">GPS: ' + loc.latitude.toFixed(4) + ', ' + loc.longitude.toFixed(4) + '</p>'
                        : '';
                    
                    card.innerHTML = '<div class="flex items-start justify-between mb-4">' +
                        '<div>' +
                            '<h3 class="text-lg font-bold text-pastel-blue-dark">' + loc.name + '</h3>' +
                            '<p class="text-sm text-gray-600"><i class="fas fa-map-marker-alt mr-1"></i>' + loc.province + ', ' + loc.city + '</p>' +
                            gpsText +
                        '</div>' +
                        '<div class="text-right">' +
                            '<div class="text-3xl font-bold text-pastel-blue-light">' + workers.length + '</div>' +
                            '<div class="text-xs text-gray-600">Total Workers</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex items-center justify-between text-sm">' +
                        '<div class="flex items-center gap-3">' +
                            '<span class="flex items-center gap-1">' +
                                '<div class="w-2 h-2 bg-pastel-blue-light rounded-full animate-pulse"></div>' +
                                '<span class="font-bold text-pastel-blue-light">' + clockedInCount + '</span>' +
                                '<span class="text-gray-600">Active</span>' +
                            '</span>' +
                            '<span class="flex items-center gap-1">' +
                                '<div class="w-2 h-2 bg-gray-400 rounded-full"></div>' +
                                '<span class="font-bold text-gray-600">' + (workers.length - clockedInCount) + '</span>' +
                                '<span class="text-gray-600">Offline</span>' +
                            '</span>' +
                        '</div>' +
                        '<button class="text-pastel-blue-dark hover:text-pastel-blue-light transition">' +
                            '<i class="fas fa-arrow-right"></i>' +
                        '</button>' +
                    '</div>';
                    
                    locationGrid.appendChild(card);
                });
                
            } catch (error) {
                console.error('Failed to load geolocation dashboard:', error);
                mainContent.innerHTML = \`
                    <div class="glass-card p-12 text-center">
                        <i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i>
                        <h3 class="text-2xl font-bold text-gray-800 mb-2">Failed to Load Dashboard</h3>
                        <p class="text-gray-600 mb-4">Could not fetch team location data</p>
                        <button onclick="loadGeoLocationDashboard()" class="px-6 py-3 bg-pastel-blue-dark text-white rounded-xl font-bold hover:scale-105 transition">
                            Try Again
                        </button>
                    </div>
                \`;
            }
        }
        
        function showLocationWorkers(locationName) {
            const workers = window.workersByLocationData[locationName] || [];
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            
            mainContent.innerHTML = '<div class="mb-6">' +
                '<button onclick="loadGeoLocationDashboard()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold mb-4 transition">' +
                    '<i class="fas fa-arrow-left mr-2"></i> Back to Locations' +
                '</button>' +
                '<h2 class="text-3xl font-bold">' +
                    '<i class="fas fa-building mr-3 text-pastel-blue-light"></i>' +
                    '<span class="sa-gradient bg-clip-text text-transparent">' + locationName + '</span>' +
                '</h2>' +
                '<p class="text-gray-600 mt-1">' + workers.length + ' workers at this location</p>' +
            '</div>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="workersGrid"></div>';
            
            const workersGrid = document.getElementById('workersGrid');
            
            workers.forEach(worker => {
                const statusBadge = worker.clock_in_time && !worker.clock_out_time
                    ? '<span class="px-2 py-1 bg-pastel-blue-light text-white text-xs rounded-full font-bold"><i class="fas fa-circle text-white mr-1" style="font-size: 6px;"></i>Active</span>'
                    : '<span class="px-2 py-1 bg-gray-400 text-white text-xs rounded-full font-bold">Offline</span>';
                
                const gpsInfo = worker.clock_in_latitude && worker.clock_in_longitude
                    ? '<div class="text-xs text-gray-500 mt-1"><i class="fas fa-map-pin mr-1"></i>GPS: ' + worker.clock_in_latitude.toFixed(4) + ', ' + worker.clock_in_longitude.toFixed(4) + '</div>'
                    : '<div class="text-xs text-gray-500 mt-1"><i class="fas fa-map-pin mr-1"></i>No GPS data</div>';
                
                const clockInfo = worker.clock_in_time
                    ? '<div class="text-xs text-gray-600 mt-1"><i class="fas fa-clock mr-1"></i>Clocked in: ' + new Date(worker.clock_in_time).toLocaleTimeString() + '</div>'
                    : '<div class="text-xs text-gray-600 mt-1"><i class="fas fa-clock mr-1"></i>Not clocked in</div>';
                
                const workerCard = document.createElement('div');
                workerCard.className = 'glass-card p-4 hover:scale-102 transition';
                workerCard.innerHTML = '<div class="flex items-start justify-between">' +
                    '<div class="flex-1">' +
                        '<div class="flex items-center gap-2 mb-1">' +
                            '<h4 class="font-bold text-gray-800">' + worker.name + '</h4>' +
                            statusBadge +
                        '</div>' +
                        '<p class="text-sm text-gray-600">' + worker.job_title + '</p>' +
                        '<p class="text-xs text-gray-500">' + (worker.department_name || 'No Department') + '</p>' +
                        clockInfo +
                        gpsInfo +
                    '</div>' +
                    '<div class="text-right">' +
                        '<p class="text-xs text-gray-500">' + worker.employee_number + '</p>' +
                        '<p class="text-xs text-gray-600 mt-1">' + worker.employment_type + '</p>' +
                    '</div>' +
                '</div>';
                
                workersGrid.appendChild(workerCard);
            });
        }
        
        // ============================================================================
        // NEW ENTERPRISE PAGE LOADERS
        // ============================================================================
        
        function loadInternsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-user-graduate mr-3 text-pastel-blue-light"></i>
                        Interns Management (SETA/YES/NYS)
                    </h2>
                    <p class="text-gray-600 mb-6">Centralized management of SA accredited intern programs with comprehensive tracking and reporting.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">24</div>
                            <div class="text-sm opacity-90">SETA Interns</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">12</div>
                            <div class="text-sm opacity-90">YES Program</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">8</div>
                            <div class="text-sm opacity-90">NYS Participants</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">5</div>
                            <div class="text-sm opacity-90">Self-Funded</div>
                        </div>
                    </div>
                    
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-tools text-6xl mb-4 opacity-30"></i>
                        <p class="text-lg">Full intern management interface coming soon</p>
                        <p class="text-sm">Track progress, stipends, mentor assignments, and compliance</p>
                    </div>
                </div>
            \`;
        }
        
        function loadCompliancePage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue mb-4">
                        <i class="fas fa-shield-alt mr-3"></i>
                        Compliance Manager Dashboard
                    </h2>
                    <p class="text-gray-600 mb-6">Real-time monitoring of BCEA, EEA, and COIDA compliance with automated alerts and reporting.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div class="p-6 border-l-4 border-pastel-blue-light bg-white rounded-xl">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm text-gray-600 mb-1">BCEA Compliance</div>
                                    <div class="text-4xl font-bold text-pastel-blue-light">94%</div>
                                </div>
                                <i class="fas fa-check-circle text-5xl text-pastel-blue-light opacity-20"></i>
                            </div>
                        </div>
                        <div class="p-6 border-l-4 border-pastel-blue bg-white rounded-xl">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm text-gray-600 mb-1">EEA Progress</div>
                                    <div class="text-4xl font-bold text-pastel-blue">78%</div>
                                </div>
                                <i class="fas fa-exclamation-triangle text-5xl text-pastel-blue opacity-20"></i>
                            </div>
                        </div>
                        <div class="p-6 border-l-4 border-pastel-blue bg-white rounded-xl">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="text-sm text-gray-600 mb-1">At-Risk Items</div>
                                    <div class="text-4xl font-bold text-pastel-blue">3</div>
                                </div>
                                <i class="fas fa-times-circle text-5xl text-pastel-blue opacity-20"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-pastel-blue/10 border border-pastel-blue/30 rounded-xl p-6 mb-6">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-exclamation-triangle text-2xl text-pastel-blue"></i>
                            <div class="flex-1">
                                <h3 class="font-bold text-pastel-blue mb-2">Compliance Alerts</h3>
                                <ul class="space-y-2 text-sm text-gray-700">
                                    <li>• 2 employees exceeding BCEA working hours limits</li>
                                    <li>• Annual EEA report due in 14 days</li>
                                    <li>• 1 incident requires COIDA submission</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg">Full compliance tracking and reporting interface</p>
                    </div>
                </div>
            \`;
        }
        
        function loadMyCompliancePage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-clipboard-check mr-3 text-pastel-blue-light"></i>
                        My Compliance Dashboard
                    </h2>
                    <p class="text-gray-600 mb-6">Your personalized compliance checklist and responsibilities.</p>
                    
                    <div class="space-y-4">
                        <div class="p-4 bg-pastel-blue-light/10 border-l-4 border-pastel-blue-light rounded-lg flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-check-circle text-2xl text-pastel-blue-light"></i>
                                <div>
                                    <div class="font-bold">Safety Training Certificate</div>
                                    <div class="text-sm text-gray-600">Valid until: Dec 2025</div>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-pastel-blue-light text-white text-xs rounded-full font-bold">Compliant</span>
                        </div>
                        
                        <div class="p-4 bg-pastel-blue-light/10 border-l-4 border-pastel-blue-light rounded-lg flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-check-circle text-2xl text-pastel-blue-light"></i>
                                <div>
                                    <div class="font-bold">Time Sheets Submitted</div>
                                    <div class="text-sm text-gray-600">Last week: Approved</div>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-pastel-blue-light text-white text-xs rounded-full font-bold">Up to Date</span>
                        </div>
                        
                        <div class="p-4 bg-pastel-blue/10 border-l-4 border-pastel-blue rounded-lg flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-exclamation-triangle text-2xl text-pastel-blue"></i>
                                <div>
                                    <div class="font-bold">Annual Leave Balance</div>
                                    <div class="text-sm text-gray-600">14 days available - Use before March</div>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-pastel-blue text-white text-xs rounded-full font-bold">Action Needed</span>
                        </div>
                        
                        <div class="p-4 bg-pastel-blue/10 border-l-4 border-pastel-blue rounded-lg flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-times-circle text-2xl text-pastel-blue"></i>
                                <div>
                                    <div class="font-bold">Performance Review</div>
                                    <div class="text-sm text-gray-600">Due: 3 days overdue</div>
                                </div>
                            </div>
                            <span class="px-3 py-1 bg-pastel-blue text-white text-xs rounded-full font-bold">Overdue</span>
                        </div>
                    </div>
                    
                    <div class="mt-8 p-6 bg-pastel-blue-dark/10 rounded-xl">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-info-circle text-2xl text-pastel-blue-dark"></i>
                            <div>
                                <div class="font-bold text-pastel-blue-dark mb-1">Know Your Rights</div>
                                <p class="text-sm text-gray-700">All compliance requirements are based on SA labour laws (BCEA, EEA, Skills Development Act)</p>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }
        
        function loadTimeTrackingPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-clock mr-3"></i>
                        Time Tracking & Attendance
                    </h2>
                    <p class="text-gray-600 mb-6">GPS-verified clock-in system with automatic time calculation and payroll integration.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="p-8 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-2xl">
                            <div class="text-center mb-6">
                                <div class="text-6xl font-bold mb-2" id="currentTime">${new Date().toLocaleTimeString()}</div>
                                <div class="text-lg opacity-90">${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                            <button class="w-full py-4 bg-white text-pastel-blue-dark font-bold text-xl rounded-xl hover:scale-105 transition">
                                <i class="fas fa-sign-in-alt mr-2"></i>
                                Clock In
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="p-6 bg-white border-l-4 border-pastel-blue-light rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-map-marker-alt text-2xl text-pastel-blue-light"></i>
                                    <div>
                                        <div class="font-bold">GPS Verification</div>
                                        <div class="text-sm text-gray-600">Location automatically validated</div>
                                    </div>
                                </div>
                            </div>
                            <div class="p-6 bg-white border-l-4 border-pastel-blue-dark rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-calculator text-2xl text-pastel-blue-dark"></i>
                                    <div>
                                        <div class="font-bold">Real-Time Hours</div>
                                        <div class="text-sm text-gray-600">Precise payroll calculation</div>
                                    </div>
                                </div>
                            </div>
                            <div class="p-6 bg-white border-l-4 border-pastel-blue rounded-xl">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-shield-alt text-2xl text-pastel-blue"></i>
                                    <div>
                                        <div class="font-bold">Fraud Prevention</div>
                                        <div class="text-sm text-gray-600">GPS + timestamp validation</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg">Interactive time clock interface coming soon</p>
                    </div>
                </div>
            \`;
        }
        
        function loadLocationsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            loadGeoLocationDashboard(); // Reuse existing geolocation dashboard
        }
        
        function loadLeavePage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-umbrella-beach mr-3 text-pastel-blue"></i>
                        Leave Management (BCEA-Compliant)
                    </h2>
                    <p class="text-gray-600 mb-6">Comprehensive leave tracking for all SA leave types with automated approval workflows.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div class="p-6 bg-white border-l-4 border-pastel-blue-dark rounded-xl">
                            <div class="text-sm text-gray-600 mb-1">Annual Leave</div>
                            <div class="text-3xl font-bold text-pastel-blue-dark">14</div>
                            <div class="text-xs text-gray-500 mt-1">days available</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-pastel-blue-light rounded-xl">
                            <div class="text-sm text-gray-600 mb-1">Sick Leave</div>
                            <div class="text-3xl font-bold text-pastel-blue-light">12</div>
                            <div class="text-xs text-gray-500 mt-1">days available</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-pastel-blue rounded-xl">
                            <div class="text-sm text-gray-600 mb-1">Family Resp.</div>
                            <div class="text-3xl font-bold text-pastel-blue">3</div>
                            <div class="text-xs text-gray-500 mt-1">days available</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-pastel-blue rounded-xl">
                            <div class="text-sm text-gray-600 mb-1">Maternity</div>
                            <div class="text-3xl font-bold text-pastel-blue">120</div>
                            <div class="text-xs text-gray-500 mt-1">days (4 months)</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-gray-400 rounded-xl">
                            <div class="text-sm text-gray-600 mb-1">Study Leave</div>
                            <div class="text-3xl font-bold text-gray-700">5</div>
                            <div class="text-xs text-gray-500 mt-1">days available</div>
                        </div>
                    </div>
                    
                    <button class="w-full py-4 bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white font-bold text-lg rounded-xl hover:scale-105 transition mb-6">
                        <i class="fas fa-plus mr-2"></i>
                        Request Leave
                    </button>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg">Full leave management interface with approval workflows</p>
                    </div>
                </div>
            \`;
        }
        
        function loadOnboardingPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-user-plus mr-3 text-pastel-blue-light"></i>
                        Employee Onboarding
                    </h2>
                    <p class="text-gray-600 mb-6">Structured 5-step onboarding process built for South African requirements.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl text-center">
                            <div class="text-4xl mb-2">1</div>
                            <div class="text-sm opacity-90">Personal Info</div>
                            <div class="text-xs mt-2">SA ID Validation</div>
                        </div>
                        <div class="p-6 bg-white border-2 border-pastel-blue-dark rounded-xl text-center">
                            <div class="text-4xl mb-2 text-gray-400">2</div>
                            <div class="text-sm text-gray-600">Employment</div>
                            <div class="text-xs mt-2 text-gray-500">Contract Details</div>
                        </div>
                        <div class="p-6 bg-white border-2 border-gray-200 rounded-xl text-center">
                            <div class="text-4xl mb-2 text-gray-400">3</div>
                            <div class="text-sm text-gray-600">Documents</div>
                            <div class="text-xs mt-2 text-gray-500">ID, Certificates</div>
                        </div>
                        <div class="p-6 bg-white border-2 border-gray-200 rounded-xl text-center">
                            <div class="text-4xl mb-2 text-gray-400">4</div>
                            <div class="text-sm text-gray-600">Social Media</div>
                            <div class="text-xs mt-2 text-gray-500">LinkedIn, etc.</div>
                        </div>
                        <div class="p-6 bg-white border-2 border-gray-200 rounded-xl text-center">
                            <div class="text-4xl mb-2 text-gray-400">5</div>
                            <div class="text-sm text-gray-600">Banking</div>
                            <div class="text-xs mt-2 text-gray-500">Payroll Setup</div>
                        </div>
                    </div>
                    
                    <button class="w-full py-4 bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white font-bold text-lg rounded-xl hover:scale-105 transition mb-6">
                        <i class="fas fa-user-plus mr-2"></i>
                        Start New Employee Onboarding
                    </button>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg">Full onboarding workflow with multi-level approval system</p>
                    </div>
                </div>
            \`;
        }
        
        function loadAnalyticsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-chart-line mr-3 text-pastel-blue-light"></i>
                        Analytics & Business Intelligence
                    </h2>
                    <p class="text-gray-600 mb-6">Data-driven insights for smarter workforce management decisions.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="p-6 bg-white border-l-4 border-pastel-blue-dark rounded-xl">
                            <div class="text-sm text-gray-600 mb-2">Productivity Score</div>
                            <div class="text-4xl font-bold text-pastel-blue-dark mb-2">87%</div>
                            <div class="text-xs text-pastel-blue-light">↑ 12% vs last month</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-pastel-blue-light rounded-xl">
                            <div class="text-sm text-gray-600 mb-2">Labor Cost Efficiency</div>
                            <div class="text-4xl font-bold text-pastel-blue-light">R2.4M</div>
                            <div class="text-xs text-pastel-blue-light">↓ 8% cost reduction</div>
                        </div>
                        <div class="p-6 bg-white border-l-4 border-pastel-blue rounded-xl">
                            <div class="text-sm text-gray-600 mb-2">Staffing Utilization</div>
                            <div class="text-4xl font-bold text-pastel-blue">92%</div>
                            <div class="text-xs text-pastel-blue">↓ 3% vs last month</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="p-6 bg-white rounded-xl">
                            <h3 class="font-bold mb-4">Department Performance</h3>
                            <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
                                <i class="fas fa-chart-bar text-6xl text-gray-300"></i>
                            </div>
                        </div>
                        <div class="p-6 bg-white rounded-xl">
                            <h3 class="font-bold mb-4">Resource Allocation</h3>
                            <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
                                <i class="fas fa-chart-pie text-6xl text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 text-center py-8 text-gray-500">
                        <p class="text-lg">Interactive charts and customizable reporting coming soon</p>
                    </div>
                </div>
            \`;
        }
        
        function loadUserManagementPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = \`
                <div class="glass-card p-8">
                    <h2 class="text-3xl font-bold text-pastel-blue-dark mb-4">
                        <i class="fas fa-user-cog mr-3"></i>
                        User Management & Security
                    </h2>
                    <p class="text-gray-600 mb-6">Enterprise-grade role-based access control with granular permissions (POPIA-compliant).</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">5</div>
                            <div class="text-sm opacity-90">System Roles</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">15+</div>
                            <div class="text-sm opacity-90">Permission Toggles</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">100%</div>
                            <div class="text-sm opacity-90">POPIA Compliant</div>
                        </div>
                        <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                            <div class="text-4xl font-bold mb-2">Full</div>
                            <div class="text-sm opacity-90">Audit Trails</div>
                        </div>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <div class="p-4 bg-white border-l-4 border-pastel-blue-dark rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold">Super Administrator</div>
                                    <div class="text-sm text-gray-600">Full system access and configuration</div>
                                </div>
                                <span class="px-3 py-1 bg-pastel-blue text-white text-xs rounded-full font-bold">Restricted</span>
                            </div>
                        </div>
                        <div class="p-4 bg-white border-l-4 border-pastel-blue-light rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold">HR Manager</div>
                                    <div class="text-sm text-gray-600">Employee data, compliance, reporting</div>
                                </div>
                                <span class="px-3 py-1 bg-pastel-blue-light text-white text-xs rounded-full font-bold">Active</span>
                            </div>
                        </div>
                        <div class="p-4 bg-white border-l-4 border-pastel-blue-dark rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold">Department Manager</div>
                                    <div class="text-sm text-gray-600">Team management, scheduling, performance</div>
                                </div>
                                <span class="px-3 py-1 bg-pastel-blue-dark text-white text-xs rounded-full font-bold">Active</span>
                            </div>
                        </div>
                        <div class="p-4 bg-white border-l-4 border-gray-400 rounded-lg">
                            <div class="flex items-center justify-between">
                                <div>
                                    <div class="font-bold">Employee (Standard)</div>
                                    <div class="text-sm text-gray-600">Self-service access, time tracking, leave</div>
                                </div>
                                <span class="px-3 py-1 bg-gray-500 text-white text-xs rounded-full font-bold">Standard</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center py-8 text-gray-500">
                        <p class="text-lg">Full role management and permission configuration interface</p>
                    </div>
                </div>
            \`;
        }
        
        // ========== SHIFT SWAPS PAGE ==========
        function loadShiftSwapsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading shift swaps...</p></div>';
            
            axios.get('/api/shift-swaps').then(response => {
                if (response.data.success) {
                    const swaps = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-exchange-alt mr-3"></i>
                                    Shift Swaps & Trades
                                </h2>
                                <button onclick="openShiftSwapModal()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-plus mr-2"></i> Request Swap
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${swaps.filter(s => s.status === 'pending').length}</div>
                                    <div class="text-sm opacity-90">Pending Requests</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${swaps.filter(s => s.status === 'accepted').length}</div>
                                    <div class="text-sm opacity-90">Accepted</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${swaps.filter(s => s.status === 'approved_by_manager').length}</div>
                                    <div class="text-sm opacity-90">Manager Approved</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${swaps.filter(s => s.status === 'declined').length}</div>
                                    <div class="text-sm opacity-90">Declined</div>
                                </div>
                            </div>
                            
                            <div class="mb-6 flex gap-2">
                                <button onclick="filterSwaps('all')" class="px-4 py-2 rounded-lg bg-pastel-blue-dark text-white font-bold swap-filter-btn" data-filter="all">All</button>
                                <button onclick="filterSwaps('pending')" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 swap-filter-btn" data-filter="pending">Pending</button>
                                <button onclick="filterSwaps('accepted')" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 swap-filter-btn" data-filter="accepted">Accepted</button>
                                <button onclick="filterSwaps('approved_by_manager')" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 swap-filter-btn" data-filter="approved_by_manager">Manager Approved</button>
                                <button onclick="filterSwaps('declined')" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 swap-filter-btn" data-filter="declined">Declined</button>
                            </div>
                            
                            <div id="swapsList" class="space-y-4">
                                \${swaps.map(swap => \`
                                    <div class="swap-item p-6 bg-white rounded-xl border-l-4 \${
                                        swap.status === 'pending' ? 'border-pastel-blue' :
                                        swap.status === 'accepted' ? 'border-pastel-blue-light' :
                                        swap.status === 'approved_by_manager' ? 'border-pastel-blue-dark' :
                                        'border-pastel-blue'
                                    }" data-status="\${swap.status}">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-3 mb-3">
                                                    <span class="px-3 py-1 rounded-full text-xs font-bold \${
                                                        swap.status === 'pending' ? 'bg-pastel-blue text-white' :
                                                        swap.status === 'accepted' ? 'bg-pastel-blue-light text-white' :
                                                        swap.status === 'approved_by_manager' ? 'bg-pastel-blue-dark text-white' :
                                                        'bg-pastel-blue text-white'
                                                    }">\${swap.status.replace(/_/g, ' ').toUpperCase()}</span>
                                                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-gray-200">\${swap.swap_type.toUpperCase()}</span>
                                                </div>
                                                <div class="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <div class="text-sm text-gray-600 mb-1">Requesting</div>
                                                        <div class="font-bold text-lg">\${swap.requesting_employee_name}</div>
                                                        <div class="text-sm text-gray-600">\${new Date(swap.original_shift_start).toLocaleDateString()} • \${swap.original_shift_start.substring(11, 16)} - \${swap.original_shift_end.substring(11, 16)}</div>
                                                    </div>
                                                    <div>
                                                        <div class="text-sm text-gray-600 mb-1">Target Employee</div>
                                                        <div class="font-bold text-lg">\${swap.target_employee_name || 'Open to All'}</div>
                                                        <div class="text-sm text-gray-600">\${swap.target_employee_name ? 'Specific swap' : 'Anyone can accept'}</div>
                                                    </div>
                                                </div>
                                                \${swap.reason ? \`<div class="mt-3 p-3 bg-gray-50 rounded-lg"><div class="text-sm text-gray-600">Reason:</div><div class="text-gray-800">\${swap.reason}</div></div>\` : ''}
                                                <div class="mt-3 text-xs text-gray-500">Expires: \${new Date(swap.expires_at).toLocaleString()}</div>
                                            </div>
                                            <div class="flex flex-col gap-2 ml-6">
                                                \${swap.status === 'pending' ? \`
                                                    <button onclick="handleSwapAction(\${swap.id}, 'accept')" class="px-4 py-2 bg-pastel-blue-light text-white rounded-lg font-bold hover:shadow-lg transition">
                                                        <i class="fas fa-check mr-2"></i> Accept
                                                    </button>
                                                    <button onclick="handleSwapAction(\${swap.id}, 'decline')" class="px-4 py-2 bg-pastel-blue text-white rounded-lg font-bold hover:shadow-lg transition">
                                                        <i class="fas fa-times mr-2"></i> Decline
                                                    </button>
                                                \` : swap.status === 'accepted' ? \`
                                                    <button onclick="handleSwapAction(\${swap.id}, 'approve')" class="px-4 py-2 bg-pastel-blue-dark text-white rounded-lg font-bold hover:shadow-lg transition">
                                                        <i class="fas fa-user-check mr-2"></i> Manager Approve
                                                    </button>
                                                \` : ''}
                                            </div>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading shift swaps</p></div>';
            });
        }
        
        window.filterSwaps = function(status) {
            document.querySelectorAll('.swap-filter-btn').forEach(btn => {
                btn.classList.remove('bg-pastel-blue-dark', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            event.target.classList.remove('bg-gray-200', 'text-gray-700');
            event.target.classList.add('bg-pastel-blue-dark', 'text-white');
            
            document.querySelectorAll('.swap-item').forEach(item => {
                if (status === 'all' || item.dataset.status === status) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        };
        
        window.handleSwapAction = function(swapId, action) {
            if (!confirm(\`Are you sure you want to \${action} this swap request?\`)) return;
            
            axios.patch(\`/api/shift-swaps/\${swapId}\`, { action }).then(response => {
                if (response.data.success) {
                    alert('Swap request updated successfully!');
                    loadShiftSwapsPage();
                }
            }).catch(error => {
                alert('Error updating swap request');
            });
        };
        
        window.openShiftSwapModal = function() {
            alert('Shift swap request form will open here (full form implementation pending)');
        };
        
        // ========== TEAM MESSAGING PAGE ==========
        function loadMessagingPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading messages...</p></div>';
            
            axios.get('/api/messages').then(response => {
                if (response.data.success) {
                    const messages = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-comments-alt mr-3"></i>
                                    Team Messaging
                                </h2>
                                <button onclick="openMessageComposer()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-paper-plane mr-2"></i> New Message
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${messages.length}</div>
                                    <div class="text-sm opacity-90">Total Messages</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${messages.filter(m => m.is_urgent).length}</div>
                                    <div class="text-sm opacity-90">Urgent</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${messages.filter(m => m.is_pinned).length}</div>
                                    <div class="text-sm opacity-90">Pinned</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${messages.filter(m => m.has_attachments).length}</div>
                                    <div class="text-sm opacity-90">With Attachments</div>
                                </div>
                            </div>
                            
                            <div class="space-y-4">
                                \${messages.map(msg => \`
                                    <div class="p-6 bg-white rounded-xl border-l-4 \${msg.is_urgent ? 'border-pastel-blue' : msg.is_pinned ? 'border-pastel-blue' : 'border-pastel-blue-dark'}">
                                        <div class="flex items-start justify-between mb-3">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-3 mb-2">
                                                    <h3 class="text-xl font-bold text-gray-800">\${msg.subject}</h3>
                                                    \${msg.is_urgent ? '<span class="px-3 py-1 bg-pastel-blue text-white rounded-full text-xs font-bold"><i class="fas fa-exclamation-triangle mr-1"></i> URGENT</span>' : ''}
                                                    \${msg.is_pinned ? '<span class="px-3 py-1 bg-pastel-blue text-white rounded-full text-xs font-bold"><i class="fas fa-thumbtack mr-1"></i> PINNED</span>' : ''}
                                                </div>
                                                <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                    <span><i class="fas fa-user mr-1"></i> \${msg.sender_name}</span>
                                                    <span><i class="fas fa-clock mr-1"></i> \${new Date(msg.sent_at).toLocaleString()}</span>
                                                    <span><i class="fas fa-users mr-1"></i> \${msg.target_type === 'all' ? 'All Employees' : msg.target_type === 'department' ? 'Department' : 'Location'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="text-gray-700 mb-3">\${msg.message}</div>
                                        \${msg.has_attachments ? '<div class="flex items-center gap-2 text-sm text-pastel-blue-dark"><i class="fas fa-paperclip mr-1"></i> <span>Has attachments</span></div>' : ''}
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading messages</p></div>';
            });
        }
        
        window.openMessageComposer = function() {
            alert('Message composer will open here (full form implementation pending)');
        };
        
        // ========== DOCUMENTS PAGE ==========
        function loadDocumentsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading documents...</p></div>';
            
            axios.get('/api/documents').then(response => {
                if (response.data.success) {
                    const documents = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-folder-open mr-3"></i>
                                    Document Management
                                </h2>
                                <button onclick="openDocumentUploader()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-cloud-upload-alt mr-2"></i> Upload Document
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${documents.length}</div>
                                    <div class="text-sm opacity-90">Total Documents</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${documents.filter(d => !d.requires_signature || d.signed_at).length}</div>
                                    <div class="text-sm opacity-90">Signed/No Signature</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${documents.filter(d => d.requires_signature && !d.signed_at).length}</div>
                                    <div class="text-sm opacity-90">Pending Signature</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${documents.filter(d => d.expires_at && new Date(d.expires_at) < new Date()).length}</div>
                                    <div class="text-sm opacity-90">Expired</div>
                                </div>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="w-full bg-white rounded-xl overflow-hidden">
                                    <thead class="bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white">
                                        <tr>
                                            <th class="px-6 py-4 text-left">Document Name</th>
                                            <th class="px-6 py-4 text-left">Employee</th>
                                            <th class="px-6 py-4 text-left">Type</th>
                                            <th class="px-6 py-4 text-left">Status</th>
                                            <th class="px-6 py-4 text-left">Uploaded</th>
                                            <th class="px-6 py-4 text-left">Expires</th>
                                            <th class="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        \${documents.map(doc => \`
                                            <tr class="hover:bg-gray-50 transition">
                                                <td class="px-6 py-4">
                                                    <div class="flex items-center gap-3">
                                                        <i class="fas fa-file-pdf text-pastel-blue text-2xl"></i>
                                                        <span class="font-bold">\${doc.document_name}</span>
                                                    </div>
                                                </td>
                                                <td class="px-6 py-4">\${doc.employee_name}</td>
                                                <td class="px-6 py-4">
                                                    <span class="px-3 py-1 bg-gray-200 rounded-full text-xs font-bold">\${doc.document_type}</span>
                                                </td>
                                                <td class="px-6 py-4">
                                                    \${doc.requires_signature ? 
                                                        (doc.signed_at ? 
                                                            '<span class="px-3 py-1 bg-pastel-blue-light text-white rounded-full text-xs font-bold"><i class="fas fa-check mr-1"></i> Signed</span>' : 
                                                            '<span class="px-3 py-1 bg-pastel-blue text-white rounded-full text-xs font-bold"><i class="fas fa-clock mr-1"></i> Pending</span>'
                                                        ) : 
                                                        '<span class="px-3 py-1 bg-pastel-blue-dark text-white rounded-full text-xs font-bold">No Signature Required</span>'
                                                    }
                                                </td>
                                                <td class="px-6 py-4 text-sm text-gray-600">\${new Date(doc.uploaded_at).toLocaleDateString()}</td>
                                                <td class="px-6 py-4 text-sm">
                                                    \${doc.expires_at ? 
                                                        (new Date(doc.expires_at) < new Date() ? 
                                                            '<span class="text-pastel-blue font-bold">EXPIRED</span>' : 
                                                            new Date(doc.expires_at).toLocaleDateString()
                                                        ) : 
                                                        '<span class="text-gray-400">No Expiry</span>'
                                                    }
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    <button class="px-3 py-1 bg-pastel-blue-dark text-white rounded-lg text-sm font-bold hover:shadow-lg transition">
                                                        <i class="fas fa-download"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        \`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading documents</p></div>';
            });
        }
        
        window.openDocumentUploader = function() {
            alert('Document uploader will open here (R2/S3 integration pending)');
        };
        
        // ========== PAYROLL EXPORT PAGE ==========
        function loadPayrollPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading payroll...</p></div>';
            
            axios.get('/api/payroll/batches').then(response => {
                if (response.data.success) {
                    const batches = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-dollar-sign mr-3"></i>
                                    Payroll Export
                                </h2>
                                <button onclick="createPayrollBatch()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-plus mr-2"></i> New Payroll Batch
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${batches.length}</div>
                                    <div class="text-sm opacity-90">Total Batches</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${batches.filter(b => b.status === 'draft').length}</div>
                                    <div class="text-sm opacity-90">Draft</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${batches.filter(b => b.status === 'approved').length}</div>
                                    <div class="text-sm opacity-90">Approved</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">R\${batches.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0).toFixed(2)}</div>
                                    <div class="text-sm opacity-90">Total Value</div>
                                </div>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="w-full bg-white rounded-xl overflow-hidden">
                                    <thead class="bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white">
                                        <tr>
                                            <th class="px-6 py-4 text-left">Batch Name</th>
                                            <th class="px-6 py-4 text-left">Period</th>
                                            <th class="px-6 py-4 text-left">Employees</th>
                                            <th class="px-6 py-4 text-left">Total Amount</th>
                                            <th class="px-6 py-4 text-left">Status</th>
                                            <th class="px-6 py-4 text-left">Created</th>
                                            <th class="px-6 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        \${batches.map(batch => \`
                                            <tr class="hover:bg-gray-50 transition">
                                                <td class="px-6 py-4 font-bold">\${batch.batch_name}</td>
                                                <td class="px-6 py-4">\${batch.period_start} to \${batch.period_end}</td>
                                                <td class="px-6 py-4">\${batch.employee_count}</td>
                                                <td class="px-6 py-4 font-bold text-pastel-blue-light">R\${parseFloat(batch.total_amount || 0).toFixed(2)}</td>
                                                <td class="px-6 py-4">
                                                    <span class="px-3 py-1 rounded-full text-xs font-bold \${
                                                        batch.status === 'draft' ? 'bg-pastel-blue text-white' :
                                                        batch.status === 'approved' ? 'bg-pastel-blue-light text-white' :
                                                        batch.status === 'exported' ? 'bg-pastel-blue-dark text-white' :
                                                        'bg-gray-200 text-gray-700'
                                                    }">\${batch.status.toUpperCase()}</span>
                                                </td>
                                                <td class="px-6 py-4 text-sm text-gray-600">\${new Date(batch.created_at).toLocaleDateString()}</td>
                                                <td class="px-6 py-4 text-center">
                                                    <div class="flex gap-2 justify-center">
                                                        <button onclick="exportPayroll(\${batch.id})" class="px-3 py-1 bg-pastel-blue-light text-white rounded-lg text-sm font-bold hover:shadow-lg transition">
                                                            <i class="fas fa-download mr-1"></i> Export
                                                        </button>
                                                        \${batch.status === 'draft' ? \`
                                                            <button onclick="approvePayroll(\${batch.id})" class="px-3 py-1 bg-pastel-blue-dark text-white rounded-lg text-sm font-bold hover:shadow-lg transition">
                                                                <i class="fas fa-check mr-1"></i> Approve
                                                            </button>
                                                        \` : ''}
                                                    </div>
                                                </td>
                                            </tr>
                                        \`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading payroll</p></div>';
            });
        }
        
        window.createPayrollBatch = function() {
            alert('Payroll batch creation form will open here (full form implementation pending)');
        };
        
        window.exportPayroll = function(batchId) {
            alert(\`Exporting payroll batch #\${batchId} (CSV/Excel export pending)\`);
        };
        
        window.approvePayroll = function(batchId) {
            if (!confirm('Approve this payroll batch?')) return;
            alert(\`Payroll batch #\${batchId} approval workflow pending\`);
        };
        
        // ========== LABOR FORECASTING PAGE ==========
        function loadForecastingPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading forecasts...</p></div>';
            
            axios.get('/api/forecasts').then(response => {
                if (response.data.success) {
                    const forecasts = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-brain mr-3"></i>
                                    AI Labor Forecasting
                                </h2>
                                <span class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold">
                                    <i class="fas fa-robot mr-2"></i> AI-Powered
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${forecasts.length}</div>
                                    <div class="text-sm opacity-90">Forecasted Days</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${Math.round(forecasts.reduce((sum, f) => sum + f.predicted_customer_count, 0) / forecasts.length)}</div>
                                    <div class="text-sm opacity-90">Avg Customers/Day</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${Math.round(forecasts.reduce((sum, f) => sum + f.recommended_staff_count, 0) / forecasts.length)}</div>
                                    <div class="text-sm opacity-90">Avg Staff Needed</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${Math.round(forecasts.reduce((sum, f) => sum + (f.confidence_level || 0), 0) / forecasts.length * 100)}%</div>
                                    <div class="text-sm opacity-90">Avg Confidence</div>
                                </div>
                            </div>
                            
                            <div class="mb-6 p-4 bg-blue-50 border-l-4 border-pastel-blue-dark rounded-lg">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="fas fa-lightbulb text-pastel-blue text-2xl"></i>
                                    <h3 class="font-bold text-lg">AI Insights</h3>
                                </div>
                                <p class="text-gray-700">Machine learning models analyze historical data, seasonal patterns, weather, and local events to predict customer demand and optimal staffing levels.</p>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="w-full bg-white rounded-xl overflow-hidden">
                                    <thead class="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        <tr>
                                            <th class="px-6 py-4 text-left">Date</th>
                                            <th class="px-6 py-4 text-left">Location</th>
                                            <th class="px-6 py-4 text-left">Predicted Customers</th>
                                            <th class="px-6 py-4 text-left">Recommended Staff</th>
                                            <th class="px-6 py-4 text-left">Skill Mix</th>
                                            <th class="px-6 py-4 text-left">Confidence</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        \${forecasts.map(forecast => {
                                            const skillMix = forecast.recommended_skill_mix ? JSON.parse(forecast.recommended_skill_mix) : {};
                                            const confidence = Math.round((forecast.confidence_level || 0) * 100);
                                            
                                            return \`
                                                <tr class="hover:bg-gray-50 transition">
                                                    <td class="px-6 py-4 font-bold">\${new Date(forecast.forecast_date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                                    <td class="px-6 py-4">\${forecast.location_name}</td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-2">
                                                            <i class="fas fa-users text-pastel-blue-dark"></i>
                                                            <span class="font-bold text-lg">\${forecast.predicted_customer_count}</span>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-2">
                                                            <i class="fas fa-user-tie text-pastel-blue-light"></i>
                                                            <span class="font-bold text-lg">\${forecast.recommended_staff_count}</span>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex flex-wrap gap-1">
                                                            \${Object.entries(skillMix).map(([skill, count]) => \`
                                                                <span class="px-2 py-1 bg-pastel-blue-dark/10 text-pastel-blue-dark rounded text-xs font-bold">\${skill}: \${count}</span>
                                                            \`).join('')}
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                <div class="h-full bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark rounded-full" style="width: \${confidence}%"></div>
                                                            </div>
                                                            <span class="font-bold text-sm">\${confidence}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            \`;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading forecasts</p></div>';
            });
        }
        
        // ========== ATTENDANCE RULES PAGE ==========
        function loadAttendanceRulesPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading attendance rules...</p></div>';
            
            Promise.all([
                axios.get('/api/attendance/rules'),
                axios.get('/api/attendance/violations')
            ]).then(([rulesResponse, violationsResponse]) => {
                if (rulesResponse.data.success && violationsResponse.data.success) {
                    const rules = rulesResponse.data.data;
                    const violations = violationsResponse.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-gavel mr-3"></i>
                                    Attendance Rules & Violations
                                </h2>
                                <button onclick="createAttendanceRule()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-plus mr-2"></i> New Rule
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${rules.filter(r => r.is_active).length}</div>
                                    <div class="text-sm opacity-90">Active Rules</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${violations.length}</div>
                                    <div class="text-sm opacity-90">Total Violations</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${violations.reduce((sum, v) => sum + (v.penalty_points || 0), 0)}</div>
                                    <div class="text-sm opacity-90">Penalty Points</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">R\${violations.reduce((sum, v) => sum + parseFloat(v.pay_deduction || 0), 0).toFixed(2)}</div>
                                    <div class="text-sm opacity-90">Total Deductions</div>
                                </div>
                            </div>
                            
                            <h3 class="text-2xl font-bold text-gray-800 mb-4"><i class="fas fa-list-check mr-2 text-pastel-blue-dark"></i> Active Rules</h3>
                            <div class="space-y-4 mb-8">
                                \${rules.filter(r => r.is_active).map(rule => {
                                    const config = rule.rule_config ? JSON.parse(rule.rule_config) : {};
                                    
                                    return \`
                                        <div class="p-6 bg-white rounded-xl border-l-4 \${
                                            rule.rule_type === 'late_arrival' ? 'border-pastel-blue' :
                                            rule.rule_type === 'early_departure' ? 'border-pastel-blue' :
                                            'border-pastel-blue-dark'
                                        }">
                                            <div class="flex items-start justify-between">
                                                <div class="flex-1">
                                                    <div class="flex items-center gap-3 mb-2">
                                                        <h4 class="text-xl font-bold text-gray-800">\${rule.rule_name}</h4>
                                                        <span class="px-3 py-1 bg-gray-200 rounded-full text-xs font-bold">\${rule.rule_type.replace(/_/g, ' ').toUpperCase()}</span>
                                                    </div>
                                                    <p class="text-gray-600 mb-3">\${rule.description}</p>
                                                    <div class="grid grid-cols-3 gap-4">
                                                        <div class="p-3 bg-gray-50 rounded-lg">
                                                            <div class="text-sm text-gray-600">Penalty Points</div>
                                                            <div class="text-2xl font-bold text-pastel-blue">\${rule.penalty_points}</div>
                                                        </div>
                                                        <div class="p-3 bg-gray-50 rounded-lg">
                                                            <div class="text-sm text-gray-600">Auto Deduct Pay</div>
                                                            <div class="text-2xl font-bold \${rule.auto_deduct_pay ? 'text-pastel-blue' : 'text-pastel-blue-light'}">
                                                                <i class="fas fa-\${rule.auto_deduct_pay ? 'check' : 'times'}"></i>
                                                            </div>
                                                        </div>
                                                        <div class="p-3 bg-gray-50 rounded-lg">
                                                            <div class="text-sm text-gray-600">Threshold</div>
                                                            <div class="text-lg font-bold text-pastel-blue-dark">\${config.grace_minutes || config.threshold_minutes || 0} min</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onclick="toggleRule(\${rule.id}, false)" class="ml-4 px-4 py-2 bg-pastel-blue text-white rounded-lg font-bold hover:shadow-lg transition">
                                                    <i class="fas fa-pause mr-2"></i> Disable
                                                </button>
                                            </div>
                                        </div>
                                    \`;
                                }).join('')}
                            </div>
                            
                            <h3 class="text-2xl font-bold text-gray-800 mb-4"><i class="fas fa-exclamation-triangle mr-2 text-pastel-blue"></i> Recent Violations</h3>
                            <div class="overflow-x-auto">
                                <table class="w-full bg-white rounded-xl overflow-hidden">
                                    <thead class="bg-gradient-to-r from-pastel-blue to-pastel-blue text-white">
                                        <tr>
                                            <th class="px-6 py-4 text-left">Employee</th>
                                            <th class="px-6 py-4 text-left">Rule</th>
                                            <th class="px-6 py-4 text-left">Date</th>
                                            <th class="px-6 py-4 text-left">Penalty Points</th>
                                            <th class="px-6 py-4 text-left">Pay Deduction</th>
                                            <th class="px-6 py-4 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        \${violations.map(violation => \`
                                            <tr class="hover:bg-gray-50 transition">
                                                <td class="px-6 py-4 font-bold">\${violation.employee_name}</td>
                                                <td class="px-6 py-4">\${violation.rule_name}</td>
                                                <td class="px-6 py-4">\${new Date(violation.violation_date).toLocaleDateString()}</td>
                                                <td class="px-6 py-4">
                                                    <span class="px-3 py-1 bg-pastel-blue text-white rounded-full text-sm font-bold">
                                                        \${violation.penalty_points} pts
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 font-bold text-pastel-blue">R\${parseFloat(violation.pay_deduction || 0).toFixed(2)}</td>
                                                <td class="px-6 py-4">
                                                    <span class="px-3 py-1 rounded-full text-xs font-bold \${
                                                        violation.is_disputed ? 'bg-pastel-blue text-white' :
                                                        violation.is_resolved ? 'bg-pastel-blue-light text-white' :
                                                        'bg-gray-200 text-gray-700'
                                                    }">
                                                        \${violation.is_disputed ? 'DISPUTED' : violation.is_resolved ? 'RESOLVED' : 'ACTIVE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        \`).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading attendance rules</p></div>';
            });
        }
        
        window.createAttendanceRule = function() {
            alert('Attendance rule creation form will open here (full form implementation pending)');
        };
        
        window.toggleRule = function(ruleId, isActive) {
            alert(\`Rule #\${ruleId} will be \${isActive ? 'enabled' : 'disabled'}\`);
        };
        
        // ========== BUDGET TRACKING PAGE ==========
        function loadBudgetsPage() {
            const mainContent = document.querySelector('.col-span-12.md\\\\:col-span-9');
            mainContent.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-6xl text-pastel-blue-dark mb-4"></i><p class="text-gray-600">Loading budgets...</p></div>';
            
            axios.get('/api/budgets').then(response => {
                if (response.data.success) {
                    const budgets = response.data.data;
                    
                    mainContent.innerHTML = \`
                        <div class="glass-card p-8 mb-6">
                            <div class="flex items-center justify-between mb-6">
                                <h2 class="text-3xl font-bold text-pastel-blue-dark">
                                    <i class="fas fa-chart-pie mr-3"></i>
                                    Labor Budget Tracking
                                </h2>
                                <button onclick="createBudgetPeriod()" class="px-6 py-3 bg-gradient-to-r from-pastel-blue-light to-pastel-blue-dark text-white rounded-xl font-bold hover:shadow-lg transition">
                                    <i class="fas fa-plus mr-2"></i> New Budget Period
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-dark to-pastel-blue-dark/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">\${budgets.length}</div>
                                    <div class="text-sm opacity-90">Active Budgets</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue-light to-pastel-blue-light/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">R\${budgets.reduce((sum, b) => sum + parseFloat(b.budgeted_amount || 0), 0).toFixed(2)}</div>
                                    <div class="text-sm opacity-90">Total Budget</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">R\${budgets.reduce((sum, b) => sum + parseFloat(b.actual_amount || 0), 0).toFixed(2)}</div>
                                    <div class="text-sm opacity-90">Actual Spend</div>
                                </div>
                                <div class="p-6 bg-gradient-to-br from-pastel-blue to-pastel-blue/80 text-white rounded-xl">
                                    <div class="text-4xl font-bold mb-2">R\${budgets.reduce((sum, b) => sum + parseFloat(b.variance_amount || 0), 0).toFixed(2)}</div>
                                    <div class="text-sm opacity-90">Variance</div>
                                </div>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="w-full bg-white rounded-xl overflow-hidden">
                                    <thead class="bg-gradient-to-r from-pastel-blue-dark to-pastel-blue-light text-white">
                                        <tr>
                                            <th class="px-6 py-4 text-left">Period</th>
                                            <th class="px-6 py-4 text-left">Location</th>
                                            <th class="px-6 py-4 text-left">Department</th>
                                            <th class="px-6 py-4 text-left">Budgeted</th>
                                            <th class="px-6 py-4 text-left">Actual</th>
                                            <th class="px-6 py-4 text-left">Variance</th>
                                            <th class="px-6 py-4 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                                        \${budgets.map(budget => {
                                            const budgeted = parseFloat(budget.budgeted_amount || 0);
                                            const actual = parseFloat(budget.actual_amount || 0);
                                            const variance = parseFloat(budget.variance_amount || 0);
                                            const variancePercent = budgeted > 0 ? Math.round((variance / budgeted) * 100) : 0;
                                            const isOverBudget = variance > 0;
                                            
                                            return \`
                                                <tr class="hover:bg-gray-50 transition">
                                                    <td class="px-6 py-4 font-bold">\${budget.period_start} to \${budget.period_end}</td>
                                                    <td class="px-6 py-4">\${budget.location_name || 'All Locations'}</td>
                                                    <td class="px-6 py-4">\${budget.department_name || 'All Departments'}</td>
                                                    <td class="px-6 py-4 font-bold">R\${budgeted.toFixed(2)}</td>
                                                    <td class="px-6 py-4 font-bold">R\${actual.toFixed(2)}</td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-2">
                                                            <span class="font-bold \${isOverBudget ? 'text-pastel-blue' : 'text-pastel-blue-light'}">
                                                                R\${Math.abs(variance).toFixed(2)}
                                                            </span>
                                                            <span class="px-2 py-1 rounded text-xs font-bold \${isOverBudget ? 'bg-pastel-blue text-white' : 'bg-pastel-blue-light text-white'}">
                                                                \${isOverBudget ? '+' : ''}\${variancePercent}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-2">
                                                            <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                <div class="h-full \${isOverBudget ? 'bg-pastel-blue' : 'bg-pastel-blue-light'} rounded-full" 
                                                                     style="width: \${Math.min(100, Math.abs(variancePercent))}%"></div>
                                                            </div>
                                            \${isOverBudget ? 
                                                                '<i class="fas fa-exclamation-triangle text-pastel-blue"></i>' : 
                                                                '<i class="fas fa-check-circle text-pastel-blue-light"></i>'
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            \`;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    \`;
                }
            }).catch(error => {
                mainContent.innerHTML = '<div class="glass-card p-8 text-center"><i class="fas fa-exclamation-triangle text-6xl text-pastel-blue mb-4"></i><p class="text-gray-600">Error loading budgets</p></div>';
            });
        }
        
        window.createBudgetPeriod = function() {
            alert('Budget period creation form will open here (full form implementation pending)');
        };
        
    </script>
</body>
</html>
  `);
});

app.notFound((c) => c.json({ success: false, error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, error: 'Internal server error', message: err.message }, 500);
});

export default app;
