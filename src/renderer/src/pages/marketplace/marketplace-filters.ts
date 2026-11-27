export type FilterListing = { official: boolean; installed: boolean; update: boolean }
export const matchesMarketplaceFilters = (
  entry: FilterListing,
  source: string,
  status: string
): boolean =>
  (source === 'all' || entry.official === (source === 'official')) &&
  (status === 'all' ||
    (status === 'updates' ? entry.update : entry.installed === (status === 'installed')))
