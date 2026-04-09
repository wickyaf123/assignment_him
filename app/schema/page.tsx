'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchSchema } from '@/lib/api'
import { getNodeColor } from '@/lib/graph-colors'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

export default function SchemaPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['schema'],
    queryFn: fetchSchema,
  })

  const nodeEntries = data
    ? Object.entries(data.node_labels).sort((a, b) => b[1] - a[1])
    : []

  const relEntries = data
    ? Object.entries(data.relationship_types).sort((a, b) => b[1] - a[1])
    : []

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <h1 className="text-xl font-semibold text-slate-900 pt-12 pb-8">Schema Overview</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-red-700">
            Schema unavailable. The API may be starting up — refresh in a moment.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-6">
        {/* Node Types Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Node Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : nodeEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 text-sm">
                      No node types found
                    </TableCell>
                  </TableRow>
                ) : (
                  nodeEntries.map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getNodeColor(type) }}
                          />
                          <span className="text-sm text-slate-900">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-700">
                        {count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Relationship Types Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Relationship Types</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : relEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 text-sm">
                      No relationship types found
                    </TableCell>
                  </TableRow>
                ) : (
                  relEntries.map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell className="text-sm text-slate-900">{type}</TableCell>
                      <TableCell className="text-right text-sm text-slate-700">
                        {count.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
