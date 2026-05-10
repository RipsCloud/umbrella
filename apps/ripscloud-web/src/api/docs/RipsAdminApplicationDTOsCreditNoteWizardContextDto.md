# RipsAdminApplicationDTOsCreditNoteWizardContextDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**invoice** | [**RipsAdminApplicationDTOsInvoiceForCreditNoteDto**](RipsAdminApplicationDTOsInvoiceForCreditNoteDto.md) |  | [optional] [default to undefined]
**patients** | [**Array&lt;RipsAdminApplicationDTOsCreditNotePatientDto&gt;**](RipsAdminApplicationDTOsCreditNotePatientDto.md) |  | [optional] [default to undefined]
**availableResolutions** | [**Array&lt;RipsAdminApplicationDTOsCreditNoteResolutionDto&gt;**](RipsAdminApplicationDTOsCreditNoteResolutionDto.md) |  | [optional] [default to undefined]
**canCreateCreditNote** | **boolean** |  | [optional] [default to undefined]
**validationMessage** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationDTOsCreditNoteWizardContextDto } from './api';

const instance: RipsAdminApplicationDTOsCreditNoteWizardContextDto = {
    invoice,
    patients,
    availableResolutions,
    canCreateCreditNote,
    validationMessage,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
