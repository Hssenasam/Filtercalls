export const runtime = 'edge';
export default function PortalDocsPage() {
  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold'>API docs</h1>
      <p className='text-sm text-slate-300'>
        Use the OpenAPI spec for SDK generation and Postman import.
      </p>
      <div className='flex gap-2'>
        <a href='/api/openapi.json' target='_blank' className='rounded border border-white/20 px-3 py-1 text-sm'>Open OpenAPI JSON</a>
        <a href='/api-docs' target='_blank' className='rounded border border-white/20 px-3 py-1 text-sm'>Open API Docs page</a>
      </div>
      <iframe title='openapi' src='/api/openapi.json' className='h-[60vh] w-full rounded border border-white/10 bg-white' />
    </section>
  );
}
