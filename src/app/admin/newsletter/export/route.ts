import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { data, error } = await supabase.from("subscribers").select("email,status,consent_at,created_at,unsubscribed_at").order("created_at", { ascending: false });
  if (error) return new Response("Could not export subscribers", { status: 500 });
  const quote = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const rows = ["email,status,consented_at,subscribed_at,unsubscribed_at", ...(data ?? []).map((row) => [row.email,row.status,row.consent_at,row.created_at,row.unsubscribed_at].map(quote).join(","))];
  return new Response(rows.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="paulnova-subscribers.csv"', "Cache-Control": "no-store" } });
}
