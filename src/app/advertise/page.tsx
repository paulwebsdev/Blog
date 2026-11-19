import type { Metadata } from "next";
import Link from "next/link";
import InfoPage from "@/components/InfoPage";
import InquiryForm from "./InquiryForm";
export const metadata:Metadata={title:"Partnerships & Advertising",description:"Explore advertising, sponsorship and affiliate partnership enquiries with PaulNova."};
export default async function AdvertisePage({searchParams}:{searchParams:Promise<{sent?:string;error?:string}>}){
 const params=await searchParams;
 return <main><InfoPage eyebrow="Work with us" title="Partnerships & advertising" intro="PaulNova is building a global readership around technology, artificial intelligence, digital business, education and career opportunities. We welcome thoughtful conversations with organisations whose work is relevant to our audience." sections={[
 {heading:"Potential collaborations",bullets:["Clearly labelled display advertising and banner campaigns.","Clearly labelled sponsored articles and educational features.","Relevant product, platform and service announcements.","Affiliate partnerships for products and services that genuinely help readers."]},
 {heading:"Our standards",paragraphs:["Partnerships must be relevant to our coverage and useful to readers. Sponsored and affiliate relationships are disclosed clearly. Commercial relationships do not guarantee positive editorial coverage, and we reserve the right to decline proposals that do not meet our standards.","Advertising inventory, audience metrics, campaign packages and delivery are not guaranteed. We will confirm availability and terms individually before any agreement."]},
 {heading:"Contact",paragraphs:["For general questions, email contact.paulnova@gmail.com. For a proposal, use the enquiry form below."]}
 ]}/><div className="container max-w-4xl -mt-10 pb-16"><InquiryForm sent={params.sent==="1"} error={!!params.error}/><p className="mt-4 text-xs text-slate-400">Submitting this form authorises PaulNova to use your contact details to respond to this business enquiry. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p></div></main>;
}