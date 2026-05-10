import { useState, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Download, Upload, Loader2, AlertCircle, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { axiosInstance } from '@/lib/api'
import { CATEGORY_CONFIG } from '@/lib/rips/serviceCategories'
import type { CategorySlug, ServiceCategoryValue } from '@/lib/rips/serviceCategories'

export interface SavedServiceOption {
  id: string
  name: string
  category: ServiceCategoryValue
  slug: CategorySlug
}

export interface ParsedCsvRow {
  // Patient fields
  tipoDocumentoIdentificacion: string
  numDocumentoIdentificacion: string
  firstName: string
  middleName: string
  lastName: string
  secondLastName: string
  tipoUsuario: string
  fechaNacimiento: string
  codSexo: string
  codPaisResidencia: string
  codPaisOrigen: string
  codMunicipioResidencia: string
  codZonaTerritorialResidencia: string
  incapacidad: string
  // Service fields
  serviceCategory: string
  servicePayload: Record<string, unknown>
}

export interface CsvImportResult {
  totalRows: number
  successCount: number
  errorCount: number
  errors: string[]
  parsedRows: ParsedCsvRow[]
}

interface MassOperationsPanelProps {
  workspaceId: string
  savedServices: Partial<Record<ServiceCategoryValue, SavedServiceOption[]>>
  servicesLoading?: boolean
  onImportComplete?: (result: CsvImportResult) => void
}

export function MassOperationsPanel({ 
  workspaceId, 
  savedServices,
  servicesLoading = false,
  onImportComplete 
}: MassOperationsPanelProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  // Flatten all saved services into a single list grouped by category
  const allServices = useMemo(() => {
    const result: SavedServiceOption[] = []
    Object.entries(CATEGORY_CONFIG).forEach(([, config]) => {
      const categoryServices = savedServices[config.value] ?? []
      result.push(...categoryServices)
    })
    return result
  }, [savedServices])

  // Get the selected service details
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null
    return allServices.find(s => s.id === selectedServiceId) ?? null
  }, [selectedServiceId, allServices])

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (!workspaceId) return

    try {
      setDownloadLoading(true)
      setError(null)

      // Build URL with serviceId parameter to pre-populate the template
      const endpoint = format === 'xlsx' ? 'xlsx-template' : 'csv-template'
      let url = `/api/workspaces/${workspaceId}/patients/${endpoint}`
      if (selectedServiceId) {
        url += `?serviceId=${selectedServiceId}`
      }

      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      })

      // Create download link
      const mimeType = format === 'xlsx' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'text/csv'
      const blob = new Blob([response.data], { type: mimeType })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Get filename from header or generate one
      const contentDisposition = response.headers?.['content-disposition']
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/)
      const filename = filenameMatch?.[1] ?? `patients_template_${new Date().toISOString().slice(0, 10)}.${format}`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error(`Failed to download ${format.toUpperCase()} template:`, err)
      setError(t('ripsWizard.csvUploadError'))
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  // Parse CSV line handling quoted values
  const parseCsvLine = (line: string): string[] => {
    const values: string[] = []
    let currentValue = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
          currentValue += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (c === ',' && !insideQuotes) {
        values.push(currentValue)
        currentValue = ''
      } else {
        currentValue += c
      }
    }
    values.push(currentValue)
    return values
  }

  // Parse CSV content string and extract rows
  const parseCsvContent = async (csvText: string): Promise<ParsedCsvRow[]> => {
    const lines = csvText.split('\n').filter(line => line.trim().length > 0)
    
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row')
    }

    const headers = parseCsvLine(lines[0])
    const serviceCategoryIndex = headers.findIndex(h => h === 'ServiceCategory')
    
    if (serviceCategoryIndex === -1) {
      throw new Error('CSV must contain ServiceCategory column')
    }

    // Find all service indices by looking for headers like "0_*", "1_*", etc.
    const serviceIndices = new Set<number>()
    for (let j = serviceCategoryIndex + 1; j < headers.length; j++) {
      const match = headers[j].match(/^(\d+)_/)
      if (match) {
        serviceIndices.add(parseInt(match[1], 10))
      }
    }
    const sortedServiceIndices = Array.from(serviceIndices).sort((a, b) => a - b)

    const rows: ParsedCsvRow[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i])
      if (values.length < serviceCategoryIndex + 1) continue
      
      // Extract patient fields by index (patient fields are before ServiceCategory)
      const getPatientValue = (header: string): string => {
        for (let idx = 0; idx < serviceCategoryIndex; idx++) {
          if (headers[idx] === header) {
            return idx < values.length ? values[idx] : ''
          }
        }
        return ''
      }

      // Extract services - each service index (0_, 1_, etc.) becomes a separate service
      const services: Array<{ category: string; payload: Record<string, unknown> }> = []
      
      for (const serviceIdx of sortedServiceIndices) {
        const prefix = `${serviceIdx}_`
        const servicePayload: Record<string, unknown> = {}
        
        for (let j = serviceCategoryIndex + 1; j < headers.length && j < values.length; j++) {
          const header = headers[j]
          if (!header.startsWith(prefix)) continue
          
          // Remove the index prefix to get the field name
          const fieldName = header.substring(prefix.length)
          const value = values[j]
          
          if (value !== undefined && value !== null) {
            // Convert header to camelCase for payload
            const camelKey = fieldName.charAt(0).toLowerCase() + fieldName.slice(1)
            const trimmedValue = value.trim()
            
            if (trimmedValue === '') continue
            
            // Fields that should be converted to numbers (monetary values, quantities, etc.)
            const numericFields = new Set([
              'vrServicio',
              'valorServicio',
              'valorPagoModerador',
              'valorCuotaModeradora',
              'valorNetoPagar',
              'valorUnitarioMedicamento',
              'valorUnitarioServicio',
              'cantidadMedicamento',
              'cantidadServicio',
              'diasTratamiento',
              'peso',
            ])
            
            if (numericFields.has(camelKey)) {
              // Convert to number for monetary/quantity fields
              const numericValue = Number(trimmedValue)
              servicePayload[camelKey] = Number.isNaN(numericValue) ? trimmedValue : numericValue
            } else {
              // Keep everything else as string (codes, identifiers, etc.)
              servicePayload[camelKey] = trimmedValue
            }
          }
        }
        
        // Only add service if it has payload data
        if (Object.keys(servicePayload).length > 0) {
          services.push({
            category: values[serviceCategoryIndex] || '',
            payload: servicePayload,
          })
        }
      }

      // Use first service for the row's servicePayload (for backward compatibility)
      // Additional services will be handled by the wizard
      const firstService = services[0] || { category: '', payload: {} }

      rows.push({
        tipoDocumentoIdentificacion: getPatientValue('TipoDocumentoIdentificacion'),
        numDocumentoIdentificacion: getPatientValue('NumDocumentoIdentificacion'),
        firstName: getPatientValue('FirstName'),
        middleName: getPatientValue('MiddleName'),
        lastName: getPatientValue('LastName'),
        secondLastName: getPatientValue('SecondLastName'),
        tipoUsuario: getPatientValue('TipoUsuario'),
        fechaNacimiento: getPatientValue('FechaNacimiento'),
        codSexo: getPatientValue('CodSexo'),
        codPaisResidencia: getPatientValue('CodPaisResidencia') || '170',
        codPaisOrigen: getPatientValue('CodPaisOrigen') || '170',
        codMunicipioResidencia: getPatientValue('CodMunicipioResidencia'),
        codZonaTerritorialResidencia: getPatientValue('CodZonaTerritorialResidencia'),
        incapacidad: getPatientValue('Incapacidad'),
        serviceCategory: firstService.category,
        servicePayload: firstService.payload,
      })
    }

    return rows
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadLoading(true)
      setError(null)
      setImportResult(null)

      let csvText: string

      // Check if file is XLSX and convert to CSV first
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Convert XLSX to CSV via backend
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axiosInstance.post(
          `/api/workspaces/${workspaceId}/patients/convert-xlsx-to-csv`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            responseType: 'blob',
          }
        )
        
        csvText = await response.data.text()
      } else {
        // Parse CSV directly
        csvText = await file.text()
      }

      // Parse the CSV content
      const parsedRows = await parseCsvContent(csvText)

      const result: CsvImportResult = {
        totalRows: parsedRows.length,
        successCount: parsedRows.length,
        errorCount: 0,
        errors: [],
        parsedRows,
      }

      setImportResult(result)
      
      if (onImportComplete) {
        onImportComplete(result)
      }
    } catch (err) {
      console.error('Failed to parse file:', err)
      setError(err instanceof Error ? err.message : t('ripsWizard.csvUploadError'))
    } finally {
      setUploadLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const hasErrors = importResult && (importResult.errorCount ?? 0) > 0
  const hasSuccess = importResult && (importResult.successCount ?? 0) > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('ripsWizard.massOperations')}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Service selection */}
            <div className="space-y-2">
              <Label>{t('ripsWizard.selectService')}</Label>
              <Select 
                value={selectedServiceId} 
                onValueChange={setSelectedServiceId}
                disabled={servicesLoading || allServices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={servicesLoading ? t('ripsWizard.savedServicesLoading') : t('ripsWizard.selectOption')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([slug, config]) => {
                    const categoryServices = savedServices[config.value] ?? []
                    if (categoryServices.length === 0) return null
                    return (
                      <div key={slug}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {t(config.labelKey)}
                        </div>
                        {categoryServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
              {!servicesLoading && allServices.length === 0 && (
                <p className="text-sm text-muted-foreground">{t('ripsWizard.noSavedServices')}</p>
              )}
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  {t(CATEGORY_CONFIG[selectedService.slug].labelKey)}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('ripsWizard.downloadingTemplate')}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {t('ripsWizard.downloadTemplate')}
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('xlsx')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {t('ripsWizard.downloadXlsx')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadTemplate('csv')}>
                    <FileText className="mr-2 h-4 w-4" />
                    {t('ripsWizard.downloadCsv')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleFileSelect}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('ripsWizard.uploadingFile')}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t('ripsWizard.uploadFile')}
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Error message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Import results */}
            {importResult && (
              <div className="space-y-2">
                {hasSuccess && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      {t('ripsWizard.csvUploadSuccess')} - {t('ripsWizard.importedPatients', { count: importResult.successCount })}
                    </AlertDescription>
                  </Alert>
                )}

                {hasErrors && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('ripsWizard.importErrors', { count: importResult.errorCount })}
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2 h-auto p-0 text-destructive-foreground underline"
                        onClick={() => setShowErrors(!showErrors)}
                      >
                        {showErrors ? t('ripsWizard.hideErrors') : t('ripsWizard.viewErrors')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {showErrors && importResult.errors && importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded border bg-muted/50 p-3">
                    <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
