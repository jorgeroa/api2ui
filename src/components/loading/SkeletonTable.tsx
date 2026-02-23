import Skeleton from 'react-loading-skeleton'

export function SkeletonTable() {
  return (
    <div className="border border-border rounded-lg overflow-hidden p-4">
      {/* Header skeleton */}
      <div className="flex gap-4 mb-4">
        <Skeleton width={150} height={24} />
        <Skeleton width={150} height={24} />
        <Skeleton width={150} height={24} />
        <Skeleton width={150} height={24} />
      </div>

      {/* Row skeletons */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex gap-4 mb-2">
          <Skeleton width={150} height={32} />
          <Skeleton width={150} height={32} />
          <Skeleton width={150} height={32} />
          <Skeleton width={150} height={32} />
        </div>
      ))}
    </div>
  )
}
