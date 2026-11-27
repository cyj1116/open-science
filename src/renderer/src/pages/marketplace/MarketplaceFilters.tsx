import { useTranslation } from 'react-i18next'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { ResourceCatalogFilter } from './ResourceCenterModeTabs'

import { matchesMarketplaceFilters, type FilterListing } from './marketplace-filters'

export function MarketplaceFilters({
  entries,
  source,
  status,
  onSource,
  onStatus
}: {
  entries: readonly FilterListing[]
  source: string
  status: string
  onSource: (value: string) => void
  onStatus: (value: string) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const filters = [
    {
      label: t('Resource source'),
      value: source,
      change: onSource,
      options: [
        ['all', t('All')],
        ['official', t('Official')],
        ['community', t('Community')]
      ],
      count: (key: string) =>
        entries.filter((entry) => matchesMarketplaceFilters(entry, key, status)).length
    },
    {
      label: t('Installation status'),
      value: status,
      change: onStatus,
      options: [
        ['all', t('All')],
        ['available', t('Not installed')],
        ['installed', t('Installed')],
        ['updates', t('Update available')]
      ],
      count: (key: string) =>
        entries.filter((entry) => matchesMarketplaceFilters(entry, source, key)).length
    }
  ]
  return (
    <>
      {filters.map((filter) => (
        <ResourceCatalogFilter key={filter.label} label={filter.label}>
          <Select value={filter.value} onValueChange={filter.change}>
            <SelectTrigger aria-label={filter.label} className="w-40">
              <span>{filter.options.find(([key]) => key === filter.value)?.[1]}</span>
            </SelectTrigger>
            <SelectContent>
              {filter.options.map(([key, label]) => (
                <SelectItem value={key} key={key}>
                  {label}
                  <span className="ml-2 tabular-nums text-muted-foreground">
                    {filter.count(key)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ResourceCatalogFilter>
      ))}
    </>
  )
}
