"use client";

import { deleteBloggingClassFacebookPost } from "./actions";

export default function ConfirmDeletePostForm({ id }: { id: string }) {
  return <form action={deleteBloggingClassFacebookPost} onSubmit={(event) => {
    if (!window.confirm("Delete this Facebook post permanently?")) event.preventDefault();
  }}>
    <input type="hidden" name="id" value={id}/>
    <button className="rounded-full border border-rose-200 px-4 py-2.5 text-xs font-bold text-rose-700">Delete</button>
  </form>;
}
