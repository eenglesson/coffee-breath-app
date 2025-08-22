import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Only protect dashboard routes, exclude static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
