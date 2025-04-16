import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Protect ALL routes, except auth callback and static assets
    '/((?!auth/callback|_next/static|_next/image|favicon.ico).*)',
  ],
};
