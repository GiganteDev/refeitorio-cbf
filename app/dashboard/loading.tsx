import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[150px]" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[100px]" />
            <Skeleton className="h-9 w-[260px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-[120px] w-full" />
              ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="col-span-4 h-[350px]" />
            <Skeleton className="col-span-3 h-[350px]" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  )
}
