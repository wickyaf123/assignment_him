import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ResponseSkeleton() {
  return (
    <Card className="rounded-lg shadow-sm bg-white border border-slate-200">
      <CardHeader className="pb-4">
        {/* Answer area */}
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-5/6" />
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Accordion section header rows */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        {/* Metadata footer */}
        <div className="pt-2">
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </Card>
  )
}
