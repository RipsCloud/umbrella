import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, RefreshCcw, PencilLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { useApiClient } from '@/context/ApiClientContext'
import { useAuth } from '@/context/useAuth'
import type {
  RipsAdminApplicationDTOsClientDto,
  RipsAdminApplicationDTOsCreateClientRequestDto,
  RipsAdminApplicationDTOsUpdateClientRequestDto,
} from '@/api'
import { ClientForm } from '@/components/clients/ClientForm'
import {
  clientFormDefaultValues,
  clientFormSchema,
  type ClientFormValues,
} from '@/components/clients/clientForm.schema'

interface Client {
  id: string
  tenantId: string
  nit: string
  verificationDigit: string
  companyName: string
  commercialName: string
  taxRegime: string
  economicActivityCode: string
  address: string
  departmentCode: string
  municipalityCode: string
  phoneNumber: string
  email: string
  typeOrganizationId: number
  typeDocumentIdentificationId: number
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

const mapClientDto = (dto: RipsAdminApplicationDTOsClientDto): Client => ({
  id: dto.id ?? '',
  tenantId: dto.tenantId ?? '',
  nit: dto.nit ?? '',
  verificationDigit: dto.verificationDigit ?? '',
  companyName: dto.companyName ?? '',
  commercialName: dto.commercialName ?? '',
  taxRegime: dto.taxRegime ?? '',
  economicActivityCode: dto.economicActivityCode ?? '',
  address: dto.address ?? '',
  departmentCode: dto.departmentCode ?? '',
  municipalityCode: dto.municipalityCode ?? '',
  phoneNumber: dto.phoneNumber ?? '',
  email: dto.email ?? '',
  typeOrganizationId: dto.typeOrganizationId ?? 2,
  typeDocumentIdentificationId: dto.typeDocumentIdentificationId ?? 3,
  isActive: dto.isActive ?? true,
  createdAt: dto.createdAt ?? new Date().toISOString(),
  updatedAt: dto.updatedAt ?? undefined,
})

export function Clients() {
  const { t } = useTranslation()
  const { apiClient } = useApiClient()
  const { currentWorkspace, roles } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientFormDefaultValues,
  })

  const workspaceId = currentWorkspace?.id ?? ''
  const hasAdminAccess = useMemo(
    () => roles.includes('SuperAdmin') || roles.includes('Admin'),
    [roles],
  )

  const totalPages = Math.ceil(clients.length / pageSize)
  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize
    return clients.slice(start, start + pageSize)
  }, [clients, page, pageSize])

  const resetFeedback = () => {
    setError(null)
    setSuccess(null)
  }

  const fetchClients = useCallback(async () => {
    if (!workspaceId) {
      setClients([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      resetFeedback()

      const response = await apiClient.ripsAdminPresentationEndpointsClientsListClientsEndpoint(workspaceId)
      const data = response.data ?? []
      const mapped = data.map(mapClientDto).sort((a, b) => a.companyName.localeCompare(b.companyName))
      setClients(mapped)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('clientsPage.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [apiClient, t, workspaceId])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  const openCreateDialog = () => {
    setIsEditing(false)
    setEditingClientId(null)
    form.reset(clientFormDefaultValues)
    resetFeedback()
    setIsDialogOpen(true)
  }

  const openEditDialog = (client: Client) => {
    setIsEditing(true)
    setEditingClientId(client.id)
    form.reset({
      nit: client.nit,
      verificationDigit: client.verificationDigit,
      companyName: client.companyName,
      commercialName: client.commercialName,
      taxRegime: client.taxRegime,
      economicActivityCode: client.economicActivityCode,
      address: client.address,
      departmentCode: client.departmentCode,
      municipalityCode: client.municipalityCode,
      phoneNumber: client.phoneNumber,
      email: client.email,
      typeOrganizationId: client.typeOrganizationId,
      typeDocumentIdentificationId: client.typeDocumentIdentificationId,
      isActive: client.isActive,
    })
    resetFeedback()
    setIsDialogOpen(true)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!workspaceId) return

    const payload: RipsAdminApplicationDTOsCreateClientRequestDto | RipsAdminApplicationDTOsUpdateClientRequestDto = {
      nit: values.nit,
      verificationDigit: values.verificationDigit,
      companyName: values.companyName,
      commercialName: values.commercialName,
      taxRegime: values.taxRegime,
      economicActivityCode: values.economicActivityCode,
      address: values.address,
      departmentCode: values.departmentCode,
      municipalityCode: values.municipalityCode,
      phoneNumber: values.phoneNumber,
      email: values.email,
      typeOrganizationId: values.typeOrganizationId,
      typeDocumentIdentificationId: values.typeDocumentIdentificationId,
      isActive: values.isActive,
    }

    try {
      setIsSubmitting(true)
      resetFeedback()

      if (isEditing && editingClientId) {
        const response =
          await apiClient.ripsAdminPresentationEndpointsClientsUpdateClientEndpoint(
            workspaceId,
            editingClientId,
            payload as RipsAdminApplicationDTOsUpdateClientRequestDto,
          )
        const updatedClient = mapClientDto(response.data ?? {})
        setClients((prev) =>
          prev
            .map((client) => (client.id === updatedClient.id ? updatedClient : client))
            .sort((a, b) => a.companyName.localeCompare(b.companyName)),
        )
        setSuccess(t('clientsPage.updateSuccess'))
      } else {
        const response =
          await apiClient.ripsAdminPresentationEndpointsClientsCreateClientEndpoint(
            workspaceId,
            payload as RipsAdminApplicationDTOsCreateClientRequestDto,
          )
        const newClient = mapClientDto(response.data ?? {})
        setClients((prev) =>
          [...prev, newClient].sort((a, b) => a.companyName.localeCompare(b.companyName)),
        )
        setSuccess(t('clientsPage.createSuccess'))
      }

      setIsDialogOpen(false)
      setEditingClientId(null)
      form.reset(clientFormDefaultValues)
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } }).response?.data?.error
      setError(apiError ?? t('clientsPage.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  })

  if (!currentWorkspace) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('clientsPage.emptyWorkspaceTitle')}</CardTitle>
            <CardDescription>{t('clientsPage.emptyWorkspaceDescription')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-72" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">{t('clientsPage.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('clientsPage.description')}</p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>{t('common.success')}</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t('clientsPage.listTitle')}</CardTitle>
            <CardDescription>{t('clientsPage.listDescription')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void fetchClients()} className="gap-2" size="sm">
              <RefreshCcw className="h-4 w-4" />
              {t('clientsPage.actions.refresh')}
            </Button>
            {hasAdminAccess ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" size="sm" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4" />
                    {t('clientsPage.actions.addClient')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditing ? t('clientsPage.dialog.editTitle') : t('clientsPage.dialog.createTitle')}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditing
                        ? t('clientsPage.dialog.editDescription')
                        : t('clientsPage.dialog.createDescription')}
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={onSubmit}>
                    <ClientForm
                      form={form}
                      disabled={isSubmitting}
                      labels={{
                        nit: t('clientsPage.form.nit'),
                        verificationDigit: t('clientsPage.form.verificationDigit'),
                        companyName: t('clientsPage.form.companyName'),
                        commercialName: t('clientsPage.form.commercialName'),
                        taxRegime: t('clientsPage.form.taxRegime'),
                        taxRegimePlaceholder: t('clientsPage.form.taxRegime'),
                        economicActivityCode: t('clientsPage.form.economicActivityCode'),
                        address: t('clientsPage.form.address'),
                        departmentCode: t('clientsPage.form.departmentCode'),
                        departmentPlaceholder: t('clientsPage.form.departmentCode'),
                        municipalityCode: t('clientsPage.form.municipalityCode'),
                        municipalityPlaceholder: t('clientsPage.form.municipalityCode'),
                        municipalityDisabledPlaceholder: t('clientsPage.form.municipalityCode'),
                        phoneNumber: t('clientsPage.form.phoneNumber'),
                        email: t('clientsPage.form.email'),
                        typeOrganizationId: t('clientsPage.form.typeOrganizationId'),
                        typeOrganizationIdPlaceholder: t('clientsPage.form.selectOrganizationType'),
                        typeDocumentIdentificationId: t('clientsPage.form.typeDocumentIdentificationId'),
                        typeDocumentIdentificationIdPlaceholder: t('clientsPage.form.selectDocumentType'),
                        isActive: t('clientsPage.form.statusLabel'),
                        statusHint: t('clientsPage.form.statusHint'),
                      }}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        {t('clientsPage.dialog.cancel')}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t('clientsPage.dialog.saving') : t('clientsPage.dialog.submit')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/20 p-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {t('clientsPage.emptyState.title')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('clientsPage.emptyState.description')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('clientsPage.table.nit')}</TableHead>
                      <TableHead>{t('clientsPage.table.companyName')}</TableHead>
                      <TableHead>{t('clientsPage.table.commercialName')}</TableHead>
                      <TableHead>{t('clientsPage.table.taxRegime')}</TableHead>
                      <TableHead>{t('clientsPage.table.contact')}</TableHead>
                      <TableHead>{t('clientsPage.table.status')}</TableHead>
                      {hasAdminAccess ? <TableHead className="text-right">{t('clientsPage.table.actions')}</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.nit}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('clientsPage.table.verificationDigit', { digit: client.verificationDigit })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.companyName}</span>
                            <span className="text-xs text-muted-foreground">
                              {t('clientsPage.table.economicActivity', { code: client.economicActivityCode })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{client.commercialName}</TableCell>
                        <TableCell>{client.taxRegime}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{client.email}</span>
                            <span className="text-xs text-muted-foreground">{client.phoneNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={client.isActive ? 'default' : 'secondary'}>
                            {client.isActive ? t('clientsPage.statusActive') : t('clientsPage.statusInactive')}
                          </Badge>
                        </TableCell>
                        {hasAdminAccess ? (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => openEditDialog(client)}
                            >
                              <PencilLine className="h-4 w-4" />
                              {t('clientsPage.table.edit')}
                            </Button>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={
                            page === 1
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationLink isActive>{page}</PaginationLink>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            page === totalPages
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
