import { submitAdvertiserInquiry } from "./actions";
export default function InquiryForm({sent=false,error=false}:{sent?:boolean;error?:boolean}){
 return <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 md:p-8"><h2 className="text-xl font-extrabold text-slate-900">Send a partnership enquiry</h2><p className="mt-2 text-sm leading-6 text-slate-500">Share a few details. We will review your enquiry and reply by email.</p>
 {sent&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Thank you. Your enquiry has been received.</p>}
 {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">We could not submit that enquiry. Please check the details and try again.</p>}
 <form action={submitAdvertiserInquiry} className="mt-5 grid gap-4 sm:grid-cols-2">
 <label className="text-xs font-bold text-slate-600">Company / organisation<input required name="company_name" maxLength={160} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/></label>
 <label className="text-xs font-bold text-slate-600">Your name<input required name="contact_name" maxLength={120} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/></label>
 <label className="text-xs font-bold text-slate-600">Work email<input required type="email" name="email" maxLength={254} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/></label>
 <label className="text-xs font-bold text-slate-600">Company website (optional)<input type="url" name="company_website" placeholder="https://" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/></label>
 <label className="text-xs font-bold text-slate-600">What are you interested in?<select name="interest" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"><option value="display_ads">Display advertising</option><option value="sponsored_content">Sponsored content</option><option value="affiliate_partnership">Affiliate partnership</option><option value="other">Other collaboration</option></select></label>
 <label className="text-xs font-bold text-slate-600">Indicative budget (optional)<input name="budget_range" maxLength={100} placeholder="e.g. $500–$1,000" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"/></label>
 <label className="text-xs font-bold text-slate-600 sm:col-span-2">Tell us about your goals<textarea required name="message" minLength={20} maxLength={5000} rows={5} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6"/></label>
 <div aria-hidden="true" className="hidden"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
 <button className="w-fit rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white">Submit enquiry</button>
 </form></section>;
}
