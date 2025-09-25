import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PageSkeletonProps {
  type?: 'dashboard' | 'list' | 'form' | 'analytics' | 'payments';
}

export function PageSkeleton({ type = 'dashboard' }: PageSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className='p-4 md:p-6 space-y-6'>
        {/* Stat Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className='p-4'>
                <Skeleton className='h-4 w-1/2 mb-2' />
                <Skeleton className='h-8 w-2/3 mb-1' />
                <Skeleton className='h-3 w-1/3' />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Provider Verification Title */}
        <div className='space-y-4'>
          <Skeleton className='h-6 w-1/4' />

          {/* Tabs (Pending, Approved, Rejected, All) */}
          <div className='flex space-x-4'>
            {[1, 2, 3, 4].map((_, i) => (
              <Skeleton key={i} className='h-8 w-20 rounded-full' />
            ))}
          </div>

          {/* Provider Cards */}
          <div className='space-y-4'>
            {[1, 2, 3].map((_, i) => (
              <Card key={i}>
                <CardContent className='p-4 space-y-4'>
                  {/* Top Row: Name & Status */}
                  <div className='flex justify-between items-center'>
                    <div className='space-y-1'>
                      <Skeleton className='h-5 w-32' /> {/* Name */}
                      <Skeleton className='h-4 w-48' /> {/* Email */}
                    </div>
                    <Skeleton className='h-6 w-16 rounded-full' /> {/* Status badge */}
                  </div>

                  {/* Applied Date & Documents */}
                  <div className='flex flex-col space-y-2'>
                    <Skeleton className='h-4 w-32' /> {/* Applied date */}
                    <Skeleton className='h-4 w-24' /> {/* Docs count */}
                  </div>

                  {/* Uploaded Documents */}
                  <div className='flex space-x-2'>
                    <Skeleton className='h-6 w-24 rounded-full' />
                    <Skeleton className='h-6 w-24 rounded-full' />
                  </div>

                  {/* Business Name */}
                  <Skeleton className='h-4 w-1/2' />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
