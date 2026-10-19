// Liveness: responde siempre 200 si el proceso está vivo.
// Railway usa este endpoint; /api/health sigue siendo readiness (toca la base).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ ok: true, app: 'W-SIMCE', uptimeSeg: Math.round(process.uptime()) });
}
