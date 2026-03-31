/**
 * HIPAA Audit Trail — client-side helper
 * Sends an audit log entry to /api/audit/log
 * Call this whenever a user accesses patient data.
 */
export async function logAuditEvent(params: {
  action: string;
  resourceType: string;
  resourceId?: string;
  patientName?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await fetch('/api/audit/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // Audit logging must never break the UI — fail silently
  }
}
