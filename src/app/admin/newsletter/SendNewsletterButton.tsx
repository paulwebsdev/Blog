"use client";

import { sendNewsletterCampaign } from "@/app/admin/actions";

export default function SendNewsletterButton({ campaignId, subscriberCount }: { campaignId: string; subscriberCount: number }) {
  return (
    <form
      action={sendNewsletterCampaign}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Send this newsletter to up to ${subscriberCount} active, consented subscriber(s) now? This action cannot be undone.`
        );
        if (!ok) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={campaignId} />
      <button
        type="submit"
        className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
      >
        Send now
      </button>
    </form>
  );
}
