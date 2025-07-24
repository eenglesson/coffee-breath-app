'use client';

import React, { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

/**
 * Format “my-blog-post” -> “My Blog Post”
 * and strip [id] / [[...slug]] dynamic params.
 */
const formatLabel = (slug: string) =>
  slug
    .replace(/^\[|\]$/g, '') // remove [ ] from dynamic segments
    .toLowerCase()
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export default function DynamicBreadcrumb() {
  const pathname = usePathname(); // e.g. /dashboard/projects/123
  const segments = pathname.split('/').filter(Boolean);

  // Detect whether we’re in /dashboard
  const inDashboard = segments[0] === 'dashboard';

  // If so, drop that first segment so we don’t show it twice
  const displaySegments = inDashboard ? segments.slice(1) : segments;

  const rootHref = inDashboard ? '/dashboard' : '/';
  const rootLabel = inDashboard ? 'Dashboard' : 'Home';

  return (
    <Breadcrumb className='max-w-full overflow-hidden'>
      <BreadcrumbList className='flex-nowrap overflow-hidden'>
        <BreadcrumbItem className='shrink-0'>
          <BreadcrumbLink asChild>
            <Link href={rootHref} className='truncate whitespace-nowrap'>
              {rootLabel}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {displaySegments.map((segment, i) => {
          const href =
            '/' + segments.slice(0, (inDashboard ? 1 : 0) + i + 1).join('/');
          const isLast = i === displaySegments.length - 1;

          return (
            <Fragment key={href}>
              <BreadcrumbSeparator className='shrink-0' />
              <BreadcrumbItem
                className={isLast ? 'min-w-0 flex-1' : 'shrink-0'}
              >
                {isLast ? (
                  <BreadcrumbPage className='truncate whitespace-nowrap'>
                    {formatLabel(segment)}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className='truncate whitespace-nowrap'>
                      {formatLabel(segment)}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
