import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employee_id, action, latitude, longitude, location_id,
      shift_id, method, photo_url,
    } = body;

    if (!employee_id || !action || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: employee_id, action, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate location proximity if location_id is provided
    let hasLocationMismatch = false;
    if (location_id) {
      const location = queryOne<any>(
        'SELECT latitude, longitude FROM locations WHERE id = ?',
        [location_id]
      );

      if (location && location.latitude && location.longitude) {
        // Calculate distance using Haversine formula (simplified)
        const R = 6371000; // Earth's radius in meters
        const dLat = ((latitude - location.latitude) * Math.PI) / 180;
        const dLon = ((longitude - location.longitude) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((location.latitude * Math.PI) / 180) *
            Math.cos((latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        // Flag if more than 200 meters away
        hasLocationMismatch = distance > 200;
      }
    }

    if (action === 'clock_in') {
      // Check for existing open time entry
      const existing = queryOne<any>(
        'SELECT id FROM time_entries WHERE employee_id = ? AND clock_out_time IS NULL',
        [employee_id]
      );

      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Employee already has an open time entry. Please clock out first.' },
          { status: 400 }
        );
      }

      const result = execute(`
        INSERT INTO time_entries (
          employee_id, shift_id, location_id,
          clock_in_time, clock_in_latitude, clock_in_longitude,
          clock_in_method, clock_in_photo_url, clock_in_verified,
          has_location_mismatch
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?)
      `, [
        employee_id, shift_id || null, location_id || null,
        latitude, longitude, method || 'Mobile', photo_url || null,
        hasLocationMismatch ? 0 : 1, hasLocationMismatch ? 1 : 0,
      ]);

      const entry = queryOne<any>('SELECT * FROM time_entries WHERE id = ?', [result.lastInsertRowid]);

      return NextResponse.json({
        success: true,
        data: entry,
        location_mismatch: hasLocationMismatch,
        message: hasLocationMismatch
          ? 'Clocked in successfully, but location does not match assigned workplace.'
          : 'Clocked in successfully.',
      }, { status: 201 });
    }

    if (action === 'clock_out') {
      // Find open time entry
      const openEntry = queryOne<any>(
        'SELECT * FROM time_entries WHERE employee_id = ? AND clock_out_time IS NULL ORDER BY clock_in_time DESC LIMIT 1',
        [employee_id]
      );

      if (!openEntry) {
        return NextResponse.json(
          { success: false, error: 'No open time entry found. Please clock in first.' },
          { status: 400 }
        );
      }

      // Calculate total hours
      const clockInTime = new Date(openEntry.clock_in_time).getTime();
      const clockOutTime = Date.now();
      const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60);
      const breakMinutes = openEntry.break_duration_minutes || 0;
      const netHours = totalHours - breakMinutes / 60;
      const regularHours = Math.min(netHours, 8);
      const overtimeHours = Math.max(0, netHours - 8);

      execute(`
        UPDATE time_entries SET
          clock_out_time = CURRENT_TIMESTAMP,
          clock_out_latitude = ?,
          clock_out_longitude = ?,
          clock_out_method = ?,
          clock_out_photo_url = ?,
          clock_out_verified = ?,
          total_hours = ROUND(?, 2),
          regular_hours = ROUND(?, 2),
          overtime_hours = ROUND(?, 2),
          has_location_mismatch = CASE WHEN has_location_mismatch = 1 THEN 1 ELSE ? END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        latitude, longitude, method || 'Mobile', photo_url || null,
        hasLocationMismatch ? 0 : 1,
        netHours, regularHours, overtimeHours,
        hasLocationMismatch ? 1 : 0,
        openEntry.id,
      ]);

      const updatedEntry = queryOne<any>('SELECT * FROM time_entries WHERE id = ?', [openEntry.id]);

      return NextResponse.json({
        success: true,
        data: updatedEntry,
        location_mismatch: hasLocationMismatch,
        message: 'Clocked out successfully.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "clock_in" or "clock_out".' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to process geo request', message: error.message }, { status: 500 });
  }
}
