export const runtime = 'edge';
export default function PortalSettingsPage() {
  return (
    <section className='space-y-3'>
      <h1 className='text-2xl font-semibold'>Settings</h1>
      <p className='text-slate-300'>Account settings UI is currently limited in the portal.</p>
      <p className='text-sm text-slate-400'>
        Available now: API support for profile/password/account actions via <code>/api/portal/me</code>.
      </p>
      <p className='text-sm text-slate-400'>
        Coming next in portal UI: profile edit forms and account deletion confirmations.
      </p>
    </section>
  );
}
