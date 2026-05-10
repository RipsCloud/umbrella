import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  DollarSign,
  FileText,
  FileMinus2,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { axiosInstance } from '@/lib/api'

interface FinancialSummary {
  totalInvoiced: number
  totalCredited: number
  netRevenue: number
  invoiceCount: number
  creditNoteCount: number
}

interface RipsSummary {
  sent: number
  failed: number
  pending: number
}

interface ResolutionUsage {
  prefix: string
  type: string
  used: number
  total: number
  percentUsed: number
  daysRemaining: number
  status: string
}

interface RecentDocument {
  date: string
  documentType: string
  number: string
  clientName: string
  totalAmount: number
  status: string
}

interface DashboardSummary {
  financial: FinancialSummary
  rips: RipsSummary
  resolutions: ResolutionUsage[]
  recentDocuments: RecentDocument[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export function Dashboard() {
  const { t } = useTranslation()
  const { user, currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? ''

  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) return

    setLoading(true)
    setError(null)

    axiosInstance
      .get(`/api/workspaces/${workspaceId}/dashboard/summary`)
      .then((res) => setData(res.data))
      .catch(() => setError(t('dashboard.loadError')))
      .finally(() => setLoading(false))
  }, [workspaceId, t])

  if (!workspaceId) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
        {user && (
          <p className="text-muted-foreground mt-1">
            {t('dashboard.welcome', { name: user.firstName })} &mdash;{' '}
            {t('dashboard.currentMonth')}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Financial KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title={t('dashboard.financial.totalInvoiced')}
          value={loading ? null : formatCurrency(data?.financial.totalInvoiced ?? 0)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.financial.totalCredited')}
          value={loading ? null : formatCurrency(data?.financial.totalCredited ?? 0)}
          icon={<FileMinus2 className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.financial.netRevenue')}
          value={loading ? null : formatCurrency(data?.financial.netRevenue ?? 0)}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
          highlight
        />
        <KpiCard
          title={t('dashboard.financial.invoices')}
          value={loading ? null : String(data?.financial.invoiceCount ?? 0)}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <KpiCard
          title={t('dashboard.financial.creditNotes')}
          value={loading ? null : String(data?.financial.creditNoteCount ?? 0)}
          icon={<FileMinus2 className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
      </div>

      {/* RIPS Status + Resolution Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* RIPS Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.rips.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <RipsStatusCard
                  label={t('dashboard.rips.sent')}
                  count={data?.rips.sent ?? 0}
                  icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                  color="bg-green-50 dark:bg-green-950"
                />
                <RipsStatusCard
                  label={t('dashboard.rips.failed')}
                  count={data?.rips.failed ?? 0}
                  icon={<XCircle className="h-5 w-5 text-red-500" />}
                  color="bg-red-50 dark:bg-red-950"
                />
                <RipsStatusCard
                  label={t('dashboard.rips.pending')}
                  count={data?.rips.pending ?? 0}
                  icon={<Clock className="h-5 w-5 text-yellow-500" />}
                  color="bg-yellow-50 dark:bg-yellow-950"
                />
              </div>
            )}
            {!loading &&
              data &&
              data.rips.failed === 0 &&
              data.rips.pending === 0 &&
              data.rips.sent > 0 && (
                <p className="text-sm text-green-600 mt-3">
                  <CheckCircle2 className="inline h-4 w-4 mr-1" />
                  {t('dashboard.rips.allSynced')}
                </p>
              )}
          </CardContent>
        </Card>

        {/* Resolution Usage */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.resolutions.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !data?.resolutions.length ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.resolutions.noResolutions')}
              </p>
            ) : (
              <div className="space-y-4">
                {data.resolutions.map((r) => (
                  <div key={r.prefix} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {r.prefix}{' '}
                        <span className="text-muted-foreground">({r.type})</span>
                      </span>
                      <span className="text-muted-foreground">
                        {r.used}/{r.total} {t('dashboard.resolutions.used')}
                        {r.status === 'Active' && (
                          <> &middot; {r.daysRemaining} {t('dashboard.resolutions.daysLeft')}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={r.percentUsed} className="h-2 flex-1" />
                      <ResolutionStatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentDocuments.title')}</CardTitle>
          <CardDescription>{t('dashboard.currentMonth')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data?.recentDocuments.length ? (
            <p className="text-sm text-muted-foreground">
              {t('dashboard.recentDocuments.noDocuments')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('dashboard.recentDocuments.date')}</TableHead>
                  <TableHead>{t('dashboard.recentDocuments.type')}</TableHead>
                  <TableHead>{t('dashboard.recentDocuments.number')}</TableHead>
                  <TableHead>{t('dashboard.recentDocuments.client')}</TableHead>
                  <TableHead className="text-right">
                    {t('dashboard.recentDocuments.amount')}
                  </TableHead>
                  <TableHead>{t('dashboard.recentDocuments.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentDocuments.map((doc, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {new Date(doc.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.documentType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{doc.number}</TableCell>
                    <TableCell>{doc.clientName}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(doc.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={doc.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({
  title,
  value,
  icon,
  loading,
  highlight,
}: {
  title: string
  value: string | null
  icon: React.ReactNode
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Card className={highlight ? 'border-primary' : undefined}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <div className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RipsStatusCard({
  label,
  count,
  icon,
  color,
}: {
  label: string
  count: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className={`rounded-lg p-3 text-center ${color}`}>
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function ResolutionStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'Active'
      ? 'default'
      : status === 'Expired'
        ? 'destructive'
        : 'secondary'

  return <Badge variant={variant}>{status}</Badge>
}

function DocumentStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'Sent'
      ? 'default'
      : status === 'PartiallyAnnulled'
        ? 'secondary'
        : status === 'Annulled'
          ? 'destructive'
          : 'outline'

  return <Badge variant={variant}>{status}</Badge>
}
