import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Building2, Check, ChevronsUpDown } from 'lucide-react'
import type { AxiosError } from 'axios'
import type { ApiApi, RipsAdminApplicationDTOsClientDto } from '@/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClientForm } from '@/components/clients/ClientForm'
import {
  clientFormDefaultValues,
  clientFormSchema,
  type ClientFormValues,
} from '@/components/clients/clientForm.schema'

interface Client {
  id: string
  displayName: string
  nit?: string
  verificationDigit?: string
}

interface ClientSelectorProps {
  clients: Client[]
  selectedClientId: string
  onClientSelect: (clientId: string) => void
  onClientCreated: (client: RipsAdminApplicationDTOsClientDto) => void
  isLoading?: boolean
  workspaceId: string
  apiClient: ApiApi
}

export function ClientSelector({
  clients,
  selectedClientId,
  onClientSelect,
  onClientCreated,
  isLoading = false,
  workspaceId,
  apiClient,
}: ClientSelectorProps) {
  const { t } = useTranslation()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: clientFormDefaultValues,
  })

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null
    return clients.find((client) => client.id === selectedClientId) ?? null
  }, [clients, selectedClientId])

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase()
    if (!normalizedQuery) return clients
    return clients.filter((client) => {
      const searchText = `${client.displayName} ${client.nit ?? ''}`.toLowerCase()
      return searchText.includes(normalizedQuery)
    })
  }, [clients, searchTerm])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchTerm('')
    }
  }

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setError(null)
      form.reset(clientFormDefaultValues)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!workspaceId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...values,
        nit: values.nit.trim(),
        verificationDigit: values.verificationDigit.trim(),
        companyName: values.companyName.trim(),
        commercialName: values.commercialName.trim(),
        taxRegime: values.taxRegime.trim(),
        economicActivityCode: values.economicActivityCode.trim(),
        address: values.address.trim(),
        departmentCode: values.departmentCode.trim(),
        municipalityCode: values.municipalityCode.trim(),
        phoneNumber: values.phoneNumber.trim(),
        email: values.email.trim(),
      }

      const response = await apiClient.ripsAdminPresentationEndpointsClientsCreateClientEndpoint(
        workspaceId,
        payload,
      )

      const result = response.data as RipsAdminApplicationDTOsClientDto | undefined
      if (!result) throw new Error('Empty response from create client endpoint')

      onClientCreated(result)
      form.reset(clientFormDefaultValues)
      setIsDialogOpen(false)
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>
      const apiError = axiosError.response?.data?.error
      setError(apiError ?? t('errors.genericError'))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="client-select">{t('invoicesPage.wizard.client.label')}</Label>
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <Button
                id="client-select"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={isLoading}
                className="w-full justify-between font-normal h-9"
              >
                {selectedClient ? (
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{selectedClient.displayName}</span>
                    {selectedClient.nit && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({selectedClient.nit}-{selectedClient.verificationDigit})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {t('invoicesPage.wizard.client.placeholder')}
                  </span>
                )}
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  placeholder={t('invoicesPage.wizard.client.searchPlaceholder', 'Buscar cliente...')}
                />
                <CommandList className="max-h-60">
                  <CommandEmpty>
                    {t('invoicesPage.wizard.client.noResults', 'No se encontraron clientes')}
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredClients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => {
                          onClientSelect(client.id)
                          handleOpenChange(false)
                        }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span className="truncate">{client.displayName}</span>
                          {client.nit && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              ({client.nit}-{client.verificationDigit})
                            </span>
                          )}
                        </div>
                        <Check
                          className={cn(
                            'ml-auto h-4 w-4 shrink-0',
                            selectedClientId === client.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('invoicesPage.wizard.client.createButton')}
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{t('invoicesPage.wizard.client.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('invoicesPage.wizard.client.dialogDescription')}</DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ScrollArea className="max-h-[60vh] pr-4">
            <form id="create-client-form" onSubmit={handleSubmit} className="space-y-4">
              <ClientForm
                form={form}
                disabled={isSubmitting}
                labels={{
                  nit: t('clientsPage.form.nit'),
                  verificationDigit: t('clientsPage.form.verificationDigit'),
                  companyName: t('clientsPage.form.companyName'),
                  commercialName: t('clientsPage.form.commercialName'),
                  taxRegime: t('clientsPage.form.taxRegime'),
                  taxRegimePlaceholder: t('clientsPage.form.taxRegimePlaceholder'),
                  economicActivityCode: t('clientsPage.form.economicActivityCode'),
                  address: t('clientsPage.form.address'),
                  departmentCode: t('clientsPage.form.departmentCode'),
                  departmentPlaceholder: t('clientsPage.form.departmentPlaceholder'),
                  municipalityCode: t('clientsPage.form.municipalityCode'),
                  municipalityPlaceholder: t('clientsPage.form.municipalityPlaceholder'),
                  municipalityDisabledPlaceholder: t('clientsPage.form.municipalityDisabledPlaceholder'),
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
            </form>
          </ScrollArea>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="create-client-form" disabled={isSubmitting}>
              {isSubmitting ? t('invoicesPage.wizard.client.creating') : t('invoicesPage.wizard.client.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
