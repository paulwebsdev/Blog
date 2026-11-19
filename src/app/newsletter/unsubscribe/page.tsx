import Link from "next/link";
import { confirmNewsletterUnsubscribe } from "./actions";
export const metadata = { title: "Unsubscribe | PaulNova", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string; done?: string; invalid?: string; error?: string }> }) {
  const params = await searchParams;
  const validToken = Boolean(params.token && /^[0-9a-f-]{36}$/i.test(params.token));
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5 py-12"><section className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200/50"><Link href="/" className="text-2xl font-black text-slate-900">Paul<span className="text-[#635bff]">Nova</span></Link><h1 className="mt-8 text-2xl font-black text-slate-900">Newsletter preferences</h1>
    {params.done ? <p className="mt-4 text-sm leading-7 text-slate-600">Your unsubscribe request has been processed. If the address was already unsubscribed, no further action was needed.</p> : params.error ? <p className="mt-4 text-sm leading-7 text-red-600">We couldn't process this request right now. Please try again later.</p> : params.invalid || !validToken ? <p className="mt-4 text-sm leading-7 text-slate-600">This unsubscribe link is incomplete or invalid. Please use the link included in your PaulNova email.</p> : <><p className="mt-4 text-sm leading-7 text-slate-600">Confirm that you want to stop receiving PaulNova newsletter emails at this address.</p><form action={confirmNewsletterUnsubscribe} className="mt-7"><input type="hidden" name="token" value={params.token}/><button className="rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white">Confirm unsubscribe</button></form></>}
    <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[#635bff]">Return to PaulNova</Link></section></main>;
}
