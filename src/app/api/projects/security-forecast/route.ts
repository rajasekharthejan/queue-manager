import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface SecurityMilestone {
  date: string;
  milestone_name: string;
  amount: number;
  type: string;
  at_risk: boolean;
  refundable?: boolean;
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const url = new URL(req.url);
  const targetDate = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const projectId = url.searchParams.get("projectId");

  let query = supabase.from("projects").select("*");
  if (projectId) query = query.eq("id", projectId);

  const { data: projects, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const forecasts = (projects || []).map((p) => {
    const milestones: SecurityMilestone[] = Array.isArray(p.security_milestones)
      ? p.security_milestones
      : JSON.parse(p.security_milestones || "[]");

    const milestonesBeforeDate = milestones.filter((m) => m.date <= targetDate);
    const milestonesAfterDate = milestones.filter((m) => m.date > targetDate);

    const totalSecurityPosted = milestonesBeforeDate.reduce((sum, m) => sum + m.amount, 0);
    const securityAtRisk = milestonesBeforeDate.filter((m) => m.at_risk).reduce((sum, m) => sum + m.amount, 0);
    const depositsPosted = milestonesBeforeDate.filter((m) => m.type === "deposit").reduce((sum, m) => sum + m.amount, 0);
    const refundable = milestonesBeforeDate.filter((m) => m.refundable).reduce((sum, m) => sum + m.amount, 0);

    const nextMilestone = milestonesAfterDate.length > 0 ? milestonesAfterDate[0] : null;

    return {
      project_id: p.id,
      project_name: p.project_name,
      iso_region: p.iso_region,
      fuel_type: p.fuel_type,
      size_mw: p.size_mw,
      target_date: targetDate,
      total_security_posted: totalSecurityPosted,
      security_at_risk: securityAtRisk,
      deposits_posted: depositsPosted,
      refundable_amount: refundable,
      non_refundable_at_risk: securityAtRisk - refundable,
      sunk_cost: p.sunk_cost_to_date,
      next_milestone: nextMilestone,
      upcoming_milestones: milestonesAfterDate,
      milestones_completed: milestonesBeforeDate.length,
      milestones_remaining: milestonesAfterDate.length,
      planned_cod: p.planned_cod,
      interconnection_status: p.interconnection_status,
    };
  });

  const summary = {
    target_date: targetDate,
    total_projects: forecasts.length,
    total_security_at_risk: forecasts.reduce((s, f) => s + f.security_at_risk, 0),
    total_security_posted: forecasts.reduce((s, f) => s + f.total_security_posted, 0),
    total_refundable: forecasts.reduce((s, f) => s + f.refundable_amount, 0),
    total_non_refundable_at_risk: forecasts.reduce((s, f) => s + f.non_refundable_at_risk, 0),
    by_iso: Object.groupBy(forecasts, (f) => f.iso_region),
  };

  return NextResponse.json({ summary, forecasts });
}
