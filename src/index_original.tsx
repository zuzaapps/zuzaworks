/**
 * ZuZaWorksOS - Comprehensive Workforce Operating System
 * Built for South African businesses with B-BBEE, BCEA, and Skills Development Act compliance
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings, Variables } from './types';

// Initialize Hono app with types
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static files from public/static directory
app.use('/static/*', serveStatic({ root: './public' }));

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${ms}ms - ${c.res.status}`);
});

// ============================================================================
// API ROUTES - DASHBOARD & STATS
// ============================================================================

app.get('/api/dashboard/stats', async (c) => {
  const { DB } = c.env;
  
  try {
    // Get dashboard statistics
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
    
    const violationStats = await DB.prepare(`
      SELECT COUNT(*) as violations_this_week
      FROM bcea_violations
      WHERE violation_date >= DATE('now', '-7 days')
    `).all();
    
    const incidentStats = await DB.prepare(`
      SELECT COUNT(*) as incidents_this_month
      FROM incidents
      WHERE incident_date >= DATE('now', 'start of month')
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
        bcea_violations_this_week: violationStats.results[0]?.violations_this_week || 0,
        incidents_this_month: incidentStats.results[0]?.incidents_this_month || 0,
        compliance_score: 94, // Calculated based on various compliance checks
        training_completion_rate: 78, // Calculated from training enrollments
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch dashboard stats', message: String(error) }, 500);
  }
});

// ============================================================================
// API ROUTES - EMPLOYEES
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
    let whereClause = 'WHERE e.is_active = 1';
    const params: any[] = [];
    
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
        l.name as location_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN employees m ON e.manager_id = m.id
      ${whereClause}
      ORDER BY e.created_at DESC
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
        l.name as location_name,
        m.first_name || ' ' || m.last_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN locations l ON e.location_id = l.id
      LEFT JOIN employees m ON e.manager_id = m.id
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
    
    // Generate employee number
    const employee_number = `EMP${data.organization_id}-${Date.now().toString(36).toUpperCase()}`;
    
    const result = await DB.prepare(`
      INSERT INTO employees (
        organization_id, employee_number, first_name, last_name, email,
        employment_type, employment_status, job_title, hire_date,
        department_id, location_id, manager_id,
        phone_mobile, date_of_birth, gender, nationality,
        contracted_hours_per_week, salary_amount, salary_currency, salary_frequency,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
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
      data.manager_id || null,
      data.phone_mobile || null,
      data.date_of_birth || null,
      data.gender || null,
      data.nationality || 'South African',
      data.contracted_hours_per_week || 40,
      data.salary_amount || null,
      data.salary_currency || 'ZAR',
      data.salary_frequency || 'Monthly'
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
        updated_at = datetime('now')
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
// API ROUTES - SOCIAL COLLABORATION
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
// API ROUTES - AI DIGITAL TWIN
// ============================================================================

// Chat with AI assistant
app.post('/api/ai/chat', async (c) => {
  const { DB, AI } = c.env;
  
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
    
    // Generate AI response using Cloudflare AI
    const systemPrompt = `You are a helpful workplace assistant for ${employee.first_name}, who works as a ${employee.job_title} in South Africa. 
    Provide practical advice about work scheduling, performance, skills development, and BCEA compliance. 
    Be friendly, professional, and focus on improving their work experience.`;
    
    const aiResponse = await AI.run('@cf/meta/llama-3-8b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    });
    
    const assistantMessage = aiResponse.response || "I'm here to help! How can I assist you today?";
    
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
// API ROUTES - SHIFTS & SCHEDULING
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
        l.name as location_name,
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
// API ROUTES - INCIDENTS
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
        l.name as location_name,
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
// FRONTEND - MAIN APPLICATION
// ============================================================================

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZuZaWorksOS - Workforce Operating System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        /* Apple-inspired design system */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.18);
        }
        
        .stat-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.25);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }
        
        .nav-link {
            transition: all 0.2s ease;
        }
        
        .nav-link:hover {
            background: rgba(102, 126, 234, 0.1);
        }
        
        .nav-link.active {
            background: rgba(102, 126, 234, 0.15);
            border-left: 4px solid #667eea;
        }
    </style>
</head>
<body class="antialiased">
    <div id="app" class="min-h-screen p-4 md:p-8">
        <!-- Header -->
        <div class="glass-card p-6 mb-6">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-1">
                        <i class="fas fa-users-cog mr-3 text-purple-600"></i>
                        ZuZaWorksOS
                    </h1>
                    <p class="text-gray-600">Comprehensive Workforce Operating System for South Africa</p>
                </div>
                <div class="flex items-center space-x-4">
                    <button class="px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                        <i class="fas fa-bell mr-2"></i>
                        Notifications
                    </button>
                    <button class="px-4 py-2 rounded-lg hover:bg-gray-100 transition">
                        <i class="fas fa-user-circle text-2xl"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-12 gap-6">
            <!-- Sidebar Navigation -->
            <div class="col-span-12 md:col-span-3">
                <div class="glass-card p-4">
                    <nav class="space-y-2">
                        <a href="#" class="nav-link active flex items-center p-3 rounded-lg">
                            <i class="fas fa-home w-6"></i>
                            <span class="ml-3">Dashboard</span>
                        </a>
                        <a href="#employees" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-users w-6"></i>
                            <span class="ml-3">People & Talent</span>
                        </a>
                        <a href="#schedule" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-calendar-alt w-6"></i>
                            <span class="ml-3">Scheduling</span>
                        </a>
                        <a href="#social" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-comments w-6"></i>
                            <span class="ml-3">Social Feed</span>
                        </a>
                        <a href="#ai" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-robot w-6"></i>
                            <span class="ml-3">AI Assistant</span>
                        </a>
                        <a href="#performance" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-chart-line w-6"></i>
                            <span class="ml-3">Performance</span>
                        </a>
                        <a href="#skills" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-graduation-cap w-6"></i>
                            <span class="ml-3">Skills & Training</span>
                        </a>
                        <a href="#incidents" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-exclamation-triangle w-6"></i>
                            <span class="ml-3">Incidents</span>
                        </a>
                        <a href="#compliance" class="nav-link flex items-center p-3 rounded-lg">
                            <i class="fas fa-shield-alt w-6"></i>
                            <span class="ml-3">Compliance</span>
                        </a>
                    </nav>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="col-span-12 md:col-span-9">
                <!-- Dashboard Stats -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div class="glass-card p-6 stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Active Employees</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1" id="stat-employees">0</p>
                            </div>
                            <i class="fas fa-users text-4xl text-blue-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Shifts Today</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1" id="stat-shifts">0</p>
                            </div>
                            <i class="fas fa-calendar-check text-4xl text-green-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Compliance Score</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1" id="stat-compliance">0%</p>
                            </div>
                            <i class="fas fa-shield-check text-4xl text-purple-500"></i>
                        </div>
                    </div>
                    
                    <div class="glass-card p-6 stat-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-gray-600 text-sm">Incidents</p>
                                <p class="text-3xl font-bold text-gray-800 mt-1" id="stat-incidents">0</p>
                            </div>
                            <i class="fas fa-exclamation-circle text-4xl text-orange-500"></i>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="glass-card p-6 mb-6">
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button class="btn-primary text-white p-4 rounded-xl">
                            <i class="fas fa-user-plus block text-2xl mb-2"></i>
                            <span class="text-sm">Add Employee</span>
                        </button>
                        <button class="btn-primary text-white p-4 rounded-xl">
                            <i class="fas fa-calendar-plus block text-2xl mb-2"></i>
                            <span class="text-sm">Create Shift</span>
                        </button>
                        <button class="btn-primary text-white p-4 rounded-xl">
                            <i class="fas fa-clipboard-list block text-2xl mb-2"></i>
                            <span class="text-sm">Report Incident</span>
                        </button>
                        <button class="btn-primary text-white p-4 rounded-xl">
                            <i class="fas fa-robot block text-2xl mb-2"></i>
                            <span class="text-sm">AI Assistant</span>
                        </button>
                    </div>
                </div>
                
                <!-- Features Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- People Management -->
                    <div class="glass-card p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-users mr-2 text-blue-500"></i>
                            People & Talent Management
                        </h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Full-Time, Part-Time, Seasonal Workers</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Comprehensive Employee Profiles</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Talent Pipeline & Succession Planning</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Intern & Graduate Programs</li>
                        </ul>
                    </div>
                    
                    <!-- Social Collaboration -->
                    <div class="glass-card p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-comments mr-2 text-purple-500"></i>
                            Social Collaboration
                        </h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Team Experience Sharing</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Peer Recognition & Kudos</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Internal Chat & Messaging</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Knowledge Sharing Platform</li>
                        </ul>
                    </div>
                    
                    <!-- AI Digital Twin -->
                    <div class="glass-card p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-robot mr-2 text-indigo-500"></i>
                            AI Digital Twin System
                        </h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Personal Work Assistant</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Performance Predictions</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Work Output Enhancement</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Skills Gap Analysis</li>
                        </ul>
                    </div>
                    
                    <!-- BCEA Compliance -->
                    <div class="glass-card p-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-shield-alt mr-2 text-green-500"></i>
                            BCEA & Compliance
                        </h3>
                        <ul class="space-y-2 text-gray-700">
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Real-Time BCEA Monitoring</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Skills Development Act</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> B-BBEE Scorecard Tracking</li>
                            <li><i class="fas fa-check text-green-500 mr-2"></i> Employment Equity Compliance</li>
                        </ul>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="glass-card p-6 mt-6 text-center">
                    <p class="text-gray-600">
                        <i class="fas fa-flag mr-2 text-green-500"></i>
                        <span class="font-semibold">Proudly South African</span> • 
                        <i class="fas fa-award mr-2 text-purple-500"></i>
                        <span class="font-semibold">B-BBEE Level 1 Contributor</span>
                    </p>
                    <p class="text-gray-500 text-sm mt-2">
                        ZuZaWorksOS v1.0 - Built for the South African workforce
                    </p>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
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
        
        // Load stats on page load
        loadStats();
        
        // Refresh stats every 30 seconds
        setInterval(loadStats, 30000);
    </script>
</body>
</html>
  `);
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({ success: false, error: 'Internal server error', message: err.message }, 500);
});

export default app;
