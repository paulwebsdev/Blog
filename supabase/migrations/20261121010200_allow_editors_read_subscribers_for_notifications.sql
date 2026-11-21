create policy "PaulNova editors can read consented subscribers for notifications"
on public.subscribers
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role in ('admin', 'editor')
  )
);