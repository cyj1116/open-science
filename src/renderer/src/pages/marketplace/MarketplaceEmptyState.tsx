import { Button } from '@/components/ui/button'

export function MarketplaceEmptyState({
  message,
  action,
  onAction
}: {
  message: string
  action: string
  onAction: () => void
}): React.JSX.Element {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-6 text-center">
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onAction}>
        {action}
      </Button>
    </div>
  )
}
