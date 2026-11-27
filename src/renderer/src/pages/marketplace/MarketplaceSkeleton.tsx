import { marketplaceGridClassName } from './ResourceMarketplaceIdentity'
export const MarketplaceSkeleton = ({ label }: { label: string }): React.JSX.Element => (
  <div role="status" aria-busy="true" data-slot="skill-marketplace-loading" className="space-y-4">
    <span className="sr-only">{label}</span>
    <div
      aria-hidden="true"
      className="h-9 rounded-lg bg-muted animate-pulse motion-reduce:animate-none"
    />
    <div aria-hidden="true" className={marketplaceGridClassName}>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="space-y-4 rounded-lg border border-border p-4 animate-pulse motion-reduce:animate-none"
        >
          <div className="h-5 w-3/5 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
          </div>
          <div className="h-6 w-2/5 rounded bg-muted" />
        </div>
      ))}
    </div>
  </div>
)
