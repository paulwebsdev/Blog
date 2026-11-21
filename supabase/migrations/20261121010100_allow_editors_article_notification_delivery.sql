drop policy if exists "PaulNova admins can manage article notification deliveries" on public.article_notification_deliveries;
create policy "PaulNova editors can manage article notification deliveries"
  on public.article_notification_deliveries
  for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','editor')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role in ('admin','editor')
  ));
