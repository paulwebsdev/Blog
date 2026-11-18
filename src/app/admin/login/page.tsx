import Link from "next/link";
import { signIn } from "@/app/admin/actions";

type Props = { searchParams: Promise<{ error?: string }> };
export default async function AdminLogin({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = error === "invalid" ? "Email or password is incorrect." : error === "not-authorised" ? "This account does not have editorial access yet." : error === "missing" ? "Enter your email and password." : "";
  return <main className="grid min-h-screen place-items-center bg-[#f7f8fc] px-5 py-12">
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
      <Link href="/" className="text-2xl font-black tracking-tight text-[#101828]">Paul<span className="text-[#635bff]">Nova</span></Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[.18em] text-[#635bff]">Private editorial workspace</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Welcome back.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">Sign in with an approved PaulNova editor account.</p>
      {message && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p>}
      <form action={signIn} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Email<input required type="email" name="email" autoComplete="username" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400"/></label>
        <label className="block text-sm font-semibold text-slate-700">Password<input required type="password" name="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-400"/></label>
        <button className="w-full rounded-xl bg-[#635bff] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#5148e5]">Sign in securely</button>
      </form>
      <p className="mt-6 text-xs leading-5 text-slate-400">Access is invitation-only. There is no public editor registration.</p>
    </div>
  </main>;
}
