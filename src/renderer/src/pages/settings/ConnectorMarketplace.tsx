import { MarketplaceEmptyState } from '../marketplace/MarketplaceEmptyState'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import * as Dialog from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ErrorNotice } from '@/components/error-notice'
import { useSettingsStore } from '@/stores/settings-store'
import { isRemoteWebSurface } from '@/lib/session-package-capabilities'
import type { ConnectorsView } from '@/lib/settings-navigation'
import { MarketplaceFilters } from '../marketplace/MarketplaceFilters'
import { matchesMarketplaceFilters } from '../marketplace/marketplace-filters'
import {
  marketplaceGridClassName,
  ResourceMarketplaceCard,
  MarketplaceTrustBadge
} from '../marketplace/ResourceMarketplaceIdentity'
import {
  ResourceCatalogHeader,
  ResourceCatalogFilter,
  ResourceCatalogToolbar,
  ResourceCenterModeTabs
} from '../marketplace/ResourceCenterModeTabs'
import { ConnectorsNavIcon } from './connector-icons'
import { ResourceAssignmentControls } from './ResourceAssignmentControls'
import { SettingsSearchInput } from './SettingsSearchInput'
import { dialogOverlayClassName } from '@/components/ui/dialog-chrome'

export function ConnectorMarketplace({
  onNavigate,
  installedId
}: {
  installedId?: string
  onNavigate: (view: ConnectorsView) => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const listings = useSettingsStore((s) => s.marketplaceListings) ?? []
  const connectors = useSettingsStore((s) => s.connectors)
  const servers = useSettingsStore((s) => s.customServers)
  const refresh = useSettingsStore((s) => s.loadConnectors)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [source, setSource] = useState('all')
  const [sort, setSort] = useState('name')
  const [count, setCount] = useState(36)
  const [review, setReview] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [updateFailed, setUpdateFailed] = useState(false)
  const canInstall =
    !isRemoteWebSurface() && typeof window.api?.settings?.addCustomServer === 'function'
  const openReview = (digest: string): void => {
    setUpdateFailed(false)
    setReview(digest)
  }
  const enable = useSettingsStore((s) => s.setCustomServerEnabled)
  const update = useSettingsStore((s) => s.updateCustomServer)
  const [failed, setFailed] = useState(false)
  const rows = listings.map((entry) => {
    const server = servers.find(
      (item) => item.marketplace?.source === entry.source && item.marketplace.name === entry.name
    )
    return {
      entry,
      server,
      official: false,
      installed: Boolean(server),
      update: Boolean(server && server.marketplace?.digest !== entry.digest)
    }
  })
  const visible = rows.filter(
    (row) =>
      matchesMarketplaceFilters(row, source, status) &&
      [row.entry.template.displayName, row.entry.template.description, row.entry.source]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  )
  if (sort === 'name')
    visible.sort((a, b) => a.entry.template.displayName.localeCompare(b.entry.template.displayName))
  const [attempt, setAttempt] = useState(0)
  const [probeResult, setProbe] = useState<{ key: string; success: boolean; code: string }>()
  const probeKey = installedId + '/' + attempt
  const probe = probeResult?.key === probeKey ? probeResult : undefined
  const pendingProbe = useRef<{ key: string; result: Promise<{ success: boolean; code: string }> }>(
    undefined
  )
  useEffect(() => {
    if (!installedId) return
    let active = true
    const key = probeKey
    if (pendingProbe.current?.key !== key)
      pendingProbe.current = {
        key,
        result: window.api.settings
          .testCustomServer({ id: installedId })
          .catch(() => ({ success: false, code: 'unavailable' }))
      }
    void pendingProbe.current.result.then((result) => {
      if (active) setProbe({ key, ...result })
    })
    return () => {
      active = false
    }
  }, [installedId, probeKey])
  const completed = servers.find((server) => server.id === installedId)
  const selected = rows.find((row) => row.entry.digest === review)
  const template = selected?.entry.template
  const reset = (): void => {
    setSource('all')
    setStatus('all')
    setSort('name')
    setCount(36)
  }
  const reload = async (): Promise<void> => {
    try {
      await refresh()
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }
  return (
    <div className="p-5">
      <ResourceCatalogHeader
        icon={ConnectorsNavIcon}
        title={t('Connectors')}
        toolbar={
          <ResourceCatalogToolbar
            onResetFilters={reset}
            activeFilterCount={
              Number(source !== 'all') + Number(status !== 'all') + Number(sort !== 'name')
            }
            search={
              <SettingsSearchInput
                aria-label={t('Search Marketplace')}
                placeholder={t('Search Marketplace…')}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCount(36)
                }}
              />
            }
            trailing={
              <span className="text-xs text-muted-foreground">
                {t('Results: {{results}} / {{total}}', {
                  results: visible.length,
                  total: rows.length
                })}
              </span>
            }
          >
            <MarketplaceFilters
              source={source}
              status={status}
              entries={rows}
              onSource={(v) => {
                setSource(v)
                setCount(36)
              }}
              onStatus={(v) => {
                setStatus(v)
                setCount(36)
              }}
            />
            <ResourceCatalogFilter label={t('Sort by')}>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v)
                  setCount(36)
                }}
              >
                <SelectTrigger aria-label={t('Sort by')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('Name A–Z')}</SelectItem>
                  <SelectItem value="manifest">{t('Catalog order')}</SelectItem>
                </SelectContent>
              </Select>
            </ResourceCatalogFilter>
          </ResourceCatalogToolbar>
        }
      >
        <ResourceCenterModeTabs
          count={connectors.length + servers.length}
          value="marketplace"
          onChange={(v) => {
            if (v === 'installed') onNavigate({ kind: 'list' })
          }}
        />
      </ResourceCatalogHeader>
      {completed && (
        <ErrorNotice
          level={probe ? (probe.success ? 'success' : 'warning') : 'info'}
          title={completed.displayName}
          description={
            !probe
              ? t('Checking…')
              : probe.success
                ? t('Connected')
                : probe.code === 'startup_failed'
                  ? t('Check the command and runtime installation.')
                  : t('Connection test failed.')
          }
          primaryButton={
            !probe || probe.success
              ? undefined
              : {
                  label: t('Retry'),
                  onClick: () => {
                    setAttempt((n) => n + 1)
                  }
                }
          }
          content={
            <ResourceAssignmentControls
              resource={{
                ...completed,
                kind: 'connector',
                group: 'custom',
                mainEnabled: completed.enabled
              }}
              onSetMain={(value) => enable(completed.id, value)}
            />
          }
        />
      )}
      {failed && (
        <ErrorNotice
          description={t('Unable to load Marketplace')}
          primaryButton={{ label: t('Retry'), onClick: reload }}
        />
      )}
      {!visible.length && (
        <MarketplaceEmptyState
          message={
            listings.length ? t('No matching connectors') : t('No Marketplace sources configured.')
          }
          action={listings.length ? t('Clear all') : t('Refresh')}
          onAction={
            listings.length
              ? () => {
                  setQuery('')
                  reset()
                }
              : reload
          }
        />
      )}
      <ul className={marketplaceGridClassName}>
        {visible.slice(0, count).map(({ entry, server, update }) => (
          <ResourceMarketplaceCard
            key={entry.digest}
            id={entry.name}
            name={entry.template.displayName}
            summary={entry.template.description ?? ''}
            publisher={entry.source}
            source={entry.source}
            official={false}
            version={entry.version}
            metadata={[
              entry.template.transport === 'stdio' ? 'stdio' : t('Streamable HTTP'),
              t('Credentials') +
                ' · ' +
                (entry.template.requiredSecrets ? t('Required') : t('None'))
            ].join(' · ')}
            onOpen={() => openReview(entry.digest)}
            status={update ? 'update' : server ? 'installed' : undefined}
            primaryAction={
              <Button
                variant="outline"
                size="sm"
                disabled={(!server || update) && !canInstall}
                onClick={() =>
                  server && !update
                    ? onNavigate({ kind: 'edit', id: server.id })
                    : openReview(entry.digest)
                }
              >
                {update ? t('Update', { context: 'verb' }) : server ? t('Installed') : t('Install')}
              </Button>
            }
          />
        ))}
      </ul>
      {visible.length > count && (
        <Button onClick={() => setCount((n) => n + 36)}>{t('Load more')}</Button>
      )}
      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setReview(undefined)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={dialogOverlayClassName} />
          <Dialog.Content className="fixed inset-y-0 right-0 flex w-full flex-col overflow-auto border-l border-border bg-card text-card-foreground shadow-dialog outline-none sm:w-[min(46rem,calc(100vw-4rem))] data-[state=open]:animate-in data-[state=open]:slide-in-from-right motion-reduce:animate-none">
            {selected && template && (
              <div className="flex min-h-full flex-col gap-4 p-5">
                <Dialog.Title className="text-xl font-semibold tracking-tight">
                  {template.displayName}
                </Dialog.Title>
                <Dialog.Description>{template.description}</Dialog.Description>
                <MarketplaceTrustBadge official={false} />
                <p>
                  {selected.entry.source} · {selected.entry.version}
                </p>
                <h3 className="font-semibold">{t('What happens after installation')}</h3>
                {template.command && (
                  <>
                    <p>
                      {t('Runtime')} · {template.command}
                    </p>
                    <pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-3">
                      {[
                        template.command,
                        ...(template.args ?? []).map((arg) => JSON.stringify(arg))
                      ].join(' ')}
                    </pre>
                  </>
                )}
                {template.url && (
                  <p className="break-all">
                    {t('URL')} · {template.url}
                  </p>
                )}
                <p>
                  {t('Credentials')} ·{' '}
                  {[
                    ...(template.requiredSecrets?.environment ?? []),
                    ...(template.requiredSecrets?.headers ?? [])
                  ].join(', ') || t('None')}
                </p>
                <p>
                  {t('Tools')} · {selected.entry.tools.join(', ')}
                </p>
                <details>
                  <summary>{t('Sources and verification')}</summary>
                  <code className="break-all">
                    {t('Checksum')} · {selected.entry.digest}
                  </code>
                </details>
                {selected.update && selected.server && (
                  <div>
                    <p>
                      {t('Installed version: {{version}}', {
                        version: selected.server.marketplace!.version
                      })}
                    </p>
                    <pre className="whitespace-pre-wrap break-all">
                      {selected.server.url ??
                        [selected.server.command, ...(selected.server.args ?? [])].join(' ')}
                    </pre>
                    <p>
                      {t('Credentials')} ·{' '}
                      {[
                        ...(selected.server.environmentNames ?? []),
                        ...(selected.server.headerNames ?? [])
                      ].join(', ') || t('None')}
                    </p>
                    {updateFailed && (
                      <ErrorNotice
                        description={t('Could not update resource access. Refresh and try again.')}
                      />
                    )}
                  </div>
                )}
                <div className="sticky bottom-0 mt-auto flex justify-end gap-2 border-t bg-card py-3">
                  <Dialog.Close asChild>
                    <Button variant="outline">{t('Cancel')}</Button>
                  </Dialog.Close>
                  <Button
                    disabled={saving || ((!selected.server || selected.update) && !canInstall)}
                    onClick={async () => {
                      if (selected.update && selected.server?.marketplace) {
                        setSaving(true)
                        setUpdateFailed(false)
                        try {
                          await update({
                            id: selected.server.id,
                            displayName: template.displayName,
                            description: template.description,
                            transport: template.transport,
                            command: template.command,
                            args: template.args ?? [],
                            url: template.url,
                            marketplaceUpdate: {
                              expectedDigest: selected.server.marketplace.digest,
                              digest: selected.entry.digest
                            }
                          })
                          setReview(undefined)
                          onNavigate({ kind: 'marketplace', installedId: selected.server.id })
                        } catch {
                          setUpdateFailed(true)
                        } finally {
                          setSaving(false)
                        }
                        return
                      }
                      selected.server
                        ? onNavigate({ kind: 'edit', id: selected.server.id })
                        : onNavigate({
                            kind: 'add',
                            transport: template.transport === 'stdio' ? 'local' : 'remote',
                            template,
                            marketplaceDigest: selected.entry.digest
                          })
                    }}
                  >
                    {selected.update
                      ? t('Confirm update')
                      : selected.server
                        ? t('Installed')
                        : t('Continue')}
                  </Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
