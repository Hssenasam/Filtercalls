export default function PortalDocsPage() {
  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold'>API docs</h1>
      <iframe title='openapi' src='/api/openapi.json' className='h-[70vh] w-full rounded border border-white/10 bg-white' />
    </section>
  );
}
