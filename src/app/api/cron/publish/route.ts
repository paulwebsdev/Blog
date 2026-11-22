import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Article = { id: string; title: string; slug: string; excerpt: string | null };
type Recipient = { delivery_id: string; subscriber_id: string; email: string; unsubscribe_token: string };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function sendArticleNotifications(supabase: Awaited<ReturnType<typeof createClient>>, article: Article) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: 0, failed: 0, reason: "missing-resend-key" };

  const { data, error } = await supabase.rpc("paulnova_prepare_auto_publish_notifications", {
    p_secret: process.env.PAULNOVA_PUBLISH_CRON_SECRET,
    p_article_id: article.id
  });
  if (error) return { sent: 0, failed: 0, reason: "notification-queue-failed" };

  const recipients = (Array.isArray(data) ? data : []) as Recipient[];
  if (!recipients.length) return { sent: 0, failed: 0, reason: "no-consented-subscribers" };

  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const { data: claimed, error: claimError } = await supabase.rpc("paulnova_claim_auto_publish_delivery", {
      p_secret: process.env.PAULNOVA_PUBLISH_CRON_SECRET,
      p_delivery_id: recipient.delivery_id
    });
    if (claimError || claimed !== true) continue;

    const articleUrl = "https://paulnova.name.ng/articles/" + encodeURIComponent(article.slug);
    const unsubscribeUrl = "https://paulnova.name.ng/newsletter/unsubscribe?token=" + encodeURIComponent(recipient.unsubscribe_token);
    const subject = "New on PaulNova: " + article.title;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f7f8fc;font-family:Arial,Helvetica,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:18px;padding:32px"><tr><td><p style="font-size:24px;font-weight:800;margin:0 0 24px">Paul<span style="color:#635bff">Nova</span></p><p style="font-size:12px;font-weight:700;letter-spacing:2px;color:#635bff;text-transform:uppercase">Technology. Intelligence. Opportunities.</p><h1 style="font-size:26px;line-height:1.25;margin:12px 0 16px">${escapeHtml(article.title)}</h1><p style="font-size:16px;line-height:1.7;color:#526078">${escapeHtml(article.excerpt || "")}</p><p style="margin:28px 0"><a href="${articleUrl}" style="display:inline-block;background:#635bff;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">Read article</a></p><hr style="border:0;border-top:1px solid #e8ebf2;margin:28px 0"><p style="font-size:12px;line-height:1.6;color:#7b8496">You received this email because you subscribed to PaulNova updates. <a href="${unsubscribeUrl}" style="color:#635bff">Unsubscribe</a>.</p><p style="font-size:12px;color:#9aa2b1">PaulNova · Technology. Intelligence. Opportunities.</p></td></tr></table></td></tr></table></body></html>`;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "Idempotency-Key": "paulnova-article-" + article.id + "-subscriber-" + recipient.subscriber_id
        },
        body: JSON.stringify({
          from: "PaulNova <newsletter@paulnova.name.ng>",
          to: [recipient.email],
          reply_to: "contact.paulnova@gmail.com",
          subject,
          html,
          headers: { "List-Unsubscribe": "<" + unsubscribeUrl + ">" }
        }),
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
      if (!response.ok || !result.id) throw new Error(result.message || "Resend rejected the message.");
      const { error: finishError } = await supabase.rpc("paulnova_finish_auto_publish_delivery", {
        p_secret: process.env.PAULNOVA_PUBLISH_CRON_SECRET,
        p_delivery_id: recipient.delivery_id,
        p_status: "sent",
        p_resend_email_id: result.id,
        p_error_message: null
      });
      if (finishError) throw new Error("Email accepted but delivery status could not be saved.");
      sent++;
    } catch (error) {
      failed++;
      await supabase.rpc("paulnova_finish_auto_publish_delivery", {
        p_secret: process.env.PAULNOVA_PUBLISH_CRON_SECRET,
        p_delivery_id: recipient.delivery_id,
        p_status: "failed",
        p_resend_email_id: null,
        p_error_message: String(error).slice(0, 500)
      });
    }
  }
  return { sent, failed, reason: failed ? "some-failed" : "complete" };
}

export async function POST(request: NextRequest) {
  const expected = process.env.PAULNOVA_PUBLISH_CRON_SECRET;
  const supplied = request.headers.get("x-paulnova-cron-secret");
  if (!expected || !supplied || supplied.length !== expected.length || supplied !== expected) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  let body: { slot?: string } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (body.slot !== "morning" && body.slot !== "evening") {
    return NextResponse.json({ error: "Slot must be morning or evening." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("paulnova_auto_publish_next_article", {
    p_secret: supplied,
    p_slot: body.slot
  });
  if (error) return NextResponse.json({ error: "Automatic publishing could not run.", detail: error.message }, { status: 500 });

  const result = data as { status?: string; article?: Article; detail?: string } | null;
  if (!result || result.status !== "published" || !result.article) {
    return NextResponse.json({ ok: true, status: result?.status || "no-result", detail: result?.detail || null });
  }

  const notifications = await sendArticleNotifications(supabase, result.article);
  return NextResponse.json({
    ok: true,
    status: "published",
    slot: body.slot,
    article: { id: result.article.id, title: result.article.title, slug: result.article.slug },
    notifications
  });
}
