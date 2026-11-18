import Link from "next/link";
import { ArrowLeft } from "lucide-react";
export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-6 text-center">
    <div><p className="text-sm font-extrabold tracking-[.2em] text-[#635bff]">PAULNOVA</p><p className="mt-8 text-7xl font-black tracking-tighter text-slate-200">404</p><h1 className="mt-3 text-3xl font-black text-slate-900">This page isn’t here.</h1><p className="mt-3 max-w-md text-sm leading-7 text-slate-500">The page may have moved, or the address may be incorrect. Let’s get you back to something useful.</p><Link href="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#635bff] px-6 py-3 text-sm font-bold text-white"><ArrowLeft size={16}/> Back to PaulNova</Link></div>
  </main>;
}
