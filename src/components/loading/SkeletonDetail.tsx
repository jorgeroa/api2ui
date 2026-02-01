import Skeleton from 'react-loading-skeleton'

export function SkeletonDetail() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-6">
          <Skeleton width={120} height={20} />
          <Skeleton width={250} height={20} />
        </div>
      ))}
    </div>
  )
}
