export const runtime = 'edge';
import { redirect } from 'next/navigation';

export default function PortalRoot() {
  redirect('/portal/overview');
}
