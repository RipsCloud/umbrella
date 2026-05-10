import { z } from 'zod'

export const clientFormSchema = z.object({
  nit: z.string().trim().min(1),
  verificationDigit: z.string().trim(),
  companyName: z.string().trim().min(1),
  commercialName: z.string().trim().min(1),
  taxRegime: z.string().trim().min(1),
  economicActivityCode: z.string().trim().min(1),
  address: z.string().trim().min(1),
  departmentCode: z.string().trim().min(1),
  municipalityCode: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(1),
  email: z.string().trim().email(),
  typeOrganizationId: z.number().int().min(1),
  typeDocumentIdentificationId: z.number().int().min(1),
  isActive: z.boolean().default(true),
})

export type ClientFormValues = z.infer<typeof clientFormSchema>

export const clientFormDefaultValues: ClientFormValues = {
  nit: '',
  verificationDigit: '',
  companyName: '',
  commercialName: '',
  taxRegime: '',
  economicActivityCode: '',
  address: '',
  departmentCode: '',
  municipalityCode: '',
  phoneNumber: '',
  email: '',
  typeOrganizationId: 2,
  typeDocumentIdentificationId: 3,
  isActive: true,
}
