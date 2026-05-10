import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Loader2, Check, X, FlaskConical, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import type {
  RipsAdminApplicationDTOsInvoiceResolutionDto,
  RipsAdminApplicationDTOsCreateInvoiceResolutionRequestDto,
  RipsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto,
} from '@/api'

interface ResolutionFormState {
  resolutionNumber: string
  prefix: string
  fromNumber: string
  toNumber: string
  validFrom: string
  validTo: string
  isActive: boolean
  environment: number
  technicalKey: string
}

const emptyForm = (): ResolutionFormState => ({
  resolutionNumber: '',
  prefix: '',
  fromNumber: '1',
  toNumber: '1000',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  isActive: true,
  environment: 2,
  technicalKey: '',
})

export function InvoiceResolutions() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace } = useAuth()
  const workspaceId = currentWorkspace?.id ?? ''

  const [resolutions, setResolutions] = useState<RipsAdminApplicationDTOsInvoiceResolutionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ResolutionFormState>(emptyForm())
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadResolutions = useCallback(async () => {
    if (!workspaceId) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.ripsAdminPresentationEndpointsInvoiceListInvoiceResolutionsEndpoint(workspaceId)
      setResolutions(response.data ?? [])
    } catch (err) {
      console.error('Failed to load resolutions:', err)
      setError(t('resolutionsPage.loadError'))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, apiClient, t])

  useEffect(() => {
    void loadResolutions()
  }, [loadResolutions])

  const handleOpenCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleOpenEdit = (resolution: RipsAdminApplicationDTOsInvoiceResolutionDto) => {
    setForm({
      resolutionNumber: resolution.resolutionNumber ?? '',
      prefix: resolution.prefix ?? '',
      fromNumber: String(resolution.fromNumber ?? 1),
      toNumber: String(resolution.toNumber ?? 1000),
      validFrom: resolution.validFrom ?? '',
      validTo: resolution.validTo ?? '',
      isActive: resolution.isActive ?? true,
      environment: resolution.environment ?? 2,
      technicalKey: resolution.technicalKey ?? '',
    })
    setEditingId(resolution.id ?? null)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setForm(emptyForm())
    setEditingId(null)
  }

  const handleSave = async () => {
    if (!workspaceId) return
    try {
      setSaving(true)
      setError(null)

      if (dialogMode === 'create') {
        const payload: RipsAdminApplicationDTOsCreateInvoiceResolutionRequestDto = {
          resolutionNumber: form.resolutionNumber,
          prefix: form.prefix,
          fromNumber: parseInt(form.fromNumber, 10),
          toNumber: parseInt(form.toNumber, 10),
          validFrom: form.validFrom,
          validTo: form.validTo,
          isActive: form.isActive,
          environment: form.environment,
          technicalKey: form.technicalKey,
        }
        await apiClient.ripsAdminPresentationEndpointsInvoiceCreateInvoiceResolutionEndpoint(workspaceId, payload)
        setSuccess(t('resolutionsPage.createSuccess'))
      } else if (editingId) {
        const payload: RipsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto = {
          resolutionNumber: form.resolutionNumber,
          prefix: form.prefix,
          fromNumber: parseInt(form.fromNumber, 10),
          toNumber: parseInt(form.toNumber, 10),
          validFrom: form.validFrom,
          validTo: form.validTo,
          isActive: form.isActive,
          environment: form.environment,
          technicalKey: form.technicalKey,
        }
        await apiClient.ripsAdminPresentationEndpointsInvoiceUpdateInvoiceResolutionEndpoint(workspaceId, editingId, payload)
        setSuccess(t('resolutionsPage.updateSuccess'))
      }

      handleCloseDialog()
      await loadResolutions()
    } catch (err) {
      console.error('Failed to save resolution:', err)
      setError(t('resolutionsPage.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!workspaceId || !deletingId) return
    try {
      setDeleting(true)
      setError(null)
      await apiClient.ripsAdminPresentationEndpointsInvoiceDeleteInvoiceResolutionEndpoint(workspaceId, deletingId)
      setSuccess(t('resolutionsPage.deleteSuccess'))
      setDeleteDialogOpen(false)
      setDeletingId(null)
      await loadResolutions()
    } catch (err) {
      console.error('Failed to delete resolution:', err)
      setError(t('resolutionsPage.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  const isExpired = (validTo: string | undefined) => {
    if (!validTo) return false
    return new Date(validTo) < new Date()
  }

  const isExhausted = (next: number | undefined, to: number | undefined) => {
    if (next === undefined || to === undefined) return false
    return next > to
  }

  if (!workspaceId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('resolutionsPage.title')}</CardTitle>
            <CardDescription>{t('companyPage.emptyWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('resolutionsPage.title')}</h1>
          <p className="text-muted-foreground">{t('resolutionsPage.description')}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('resolutionsPage.addButton')}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && !error && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('resolutionsPage.listTitle')}</CardTitle>
          <CardDescription>{t('resolutionsPage.listDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : resolutions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('resolutionsPage.emptyState')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('resolutionsPage.columns.prefix')}</TableHead>
                  <TableHead>{t('resolutionsPage.columns.resolution')}</TableHead>
                  <TableHead>{t('resolutionsPage.columns.range')}</TableHead>
                  <TableHead>{t('resolutionsPage.columns.next')}</TableHead>
                  <TableHead>{t('resolutionsPage.columns.validity')}</TableHead>
                  <TableHead>{t('environment.title')}</TableHead>
                  <TableHead>{t('resolutionsPage.columns.status')}</TableHead>
                  <TableHead className="text-right">{t('resolutionsPage.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resolutions.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-mono font-medium">{res.prefix}</TableCell>
                    <TableCell>{res.resolutionNumber}</TableCell>
                    <TableCell>{res.fromNumber} - {res.toNumber}</TableCell>
                    <TableCell>
                      {res.nextNumber}
                      {isExhausted(res.nextNumber, res.toNumber) && (
                        <Badge variant="destructive" className="ml-2">{t('resolutionsPage.exhausted')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(res.validFrom)} - {formatDate(res.validTo)}
                      {isExpired(res.validTo) && (
                        <Badge variant="destructive" className="ml-2">{t('resolutionsPage.expired')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {res.environment === 1 ? (
                        <Badge variant="default" className="bg-green-600"><Building2 className="h-3 w-3 mr-1" />{t('environment.production')}</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500 text-white"><FlaskConical className="h-3 w-3 mr-1" />{t('environment.testing')}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {res.isActive ? (
                        <Badge variant="default"><Check className="h-3 w-3 mr-1" />{t('resolutionsPage.active')}</Badge>
                      ) : (
                        <Badge variant="secondary"><X className="h-3 w-3 mr-1" />{t('resolutionsPage.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(res)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(res.id ?? '')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? t('resolutionsPage.createTitle') : t('resolutionsPage.editTitle')}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? t('resolutionsPage.createDescription') : t('resolutionsPage.editDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">{t('resolutionsPage.form.prefix')}</Label>
                <Input
                  id="prefix"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                  placeholder="FV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolutionNumber">{t('resolutionsPage.form.resolutionNumber')}</Label>
                <Input
                  id="resolutionNumber"
                  value={form.resolutionNumber}
                  onChange={(e) => setForm({ ...form, resolutionNumber: e.target.value })}
                  placeholder="18764100387354"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromNumber">{t('resolutionsPage.form.fromNumber')}</Label>
                <Input
                  id="fromNumber"
                  type="number"
                  value={form.fromNumber}
                  onChange={(e) => setForm({ ...form, fromNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toNumber">{t('resolutionsPage.form.toNumber')}</Label>
                <Input
                  id="toNumber"
                  type="number"
                  value={form.toNumber}
                  onChange={(e) => setForm({ ...form, toNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">{t('resolutionsPage.form.validFrom')}</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">{t('resolutionsPage.form.validTo')}</Label>
                <Input
                  id="validTo"
                  type="date"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">{t('environment.title')}</Label>
              <Select
                value={String(form.environment)}
                onValueChange={(value) => setForm({ ...form, environment: parseInt(value, 10) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2 text-green-600" />
                      {t('environment.production')}
                    </div>
                  </SelectItem>
                  <SelectItem value="2">
                    <div className="flex items-center">
                      <FlaskConical className="h-4 w-4 mr-2 text-amber-500" />
                      {t('environment.testing')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="technicalKey">{t('resolutionsPage.form.technicalKey')}</Label>
              <Input
                id="technicalKey"
                value={form.technicalKey}
                onChange={(e) => setForm({ ...form, technicalKey: e.target.value })}
                placeholder="fc8eac422eba16e22ffd8c6f94b3f40a6e38162c"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{t('resolutionsPage.form.technicalKeyHint')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="isActive">{t('resolutionsPage.form.isActive')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('resolutionsPage.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('resolutionsPage.deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.deleting')}
                </>
              ) : (
                t('common.delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
