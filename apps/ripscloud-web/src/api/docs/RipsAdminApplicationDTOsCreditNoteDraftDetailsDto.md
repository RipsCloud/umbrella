# RipsAdminApplicationDTOsCreditNoteDraftDetailsDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**tenantId** | **string** |  | [optional] [default to undefined]
**invoiceDraftId** | **string** |  | [optional] [default to undefined]
**originalInvoiceNumber** | **string** |  | [optional] [default to undefined]
**originalInvoiceCufe** | **string** |  | [optional] [default to undefined]
**clientId** | **string** |  | [optional] [default to undefined]
**clientName** | **string** |  | [optional] [default to undefined]
**totalAmount** | **number** |  | [optional] [default to undefined]
**status** | **string** |  | [optional] [default to undefined]
**statusMessage** | **string** |  | [optional] [default to undefined]
**submittedByUserId** | **string** |  | [optional] [default to undefined]
**submittedByDisplayName** | **string** |  | [optional] [default to undefined]
**assignedCreditNoteNumber** | **string** |  | [optional] [default to undefined]
**cude** | **string** |  | [optional] [default to undefined]
**dianStatusCode** | **string** |  | [optional] [default to undefined]
**dianStatusDescription** | **string** |  | [optional] [default to undefined]
**discrepancyResponseCode** | **number** |  | [optional] [default to undefined]
**discrepancyResponseDescription** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** |  | [optional] [default to undefined]
**updatedAt** | **string** |  | [optional] [default to undefined]
**dispatchHistory** | [**Array&lt;RipsAdminApplicationDTOsDispatchAttemptDto&gt;**](RipsAdminApplicationDTOsDispatchAttemptDto.md) |  | [optional] [default to undefined]
**ripsDispatchHistory** | [**Array&lt;RipsAdminApplicationDTOsDispatchAttemptDto&gt;**](RipsAdminApplicationDTOsDispatchAttemptDto.md) |  | [optional] [default to undefined]
**documentAvailability** | [**Array&lt;RipsAdminApplicationDTOsDocumentAvailabilityDto&gt;**](RipsAdminApplicationDTOsDocumentAvailabilityDto.md) |  | [optional] [default to undefined]
**kind** | [**RipsAdminDomainEntitiesInvoiceKind**](RipsAdminDomainEntitiesInvoiceKind.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationDTOsCreditNoteDraftDetailsDto } from './api';

const instance: RipsAdminApplicationDTOsCreditNoteDraftDetailsDto = {
    id,
    tenantId,
    invoiceDraftId,
    originalInvoiceNumber,
    originalInvoiceCufe,
    clientId,
    clientName,
    totalAmount,
    status,
    statusMessage,
    submittedByUserId,
    submittedByDisplayName,
    assignedCreditNoteNumber,
    cude,
    dianStatusCode,
    dianStatusDescription,
    discrepancyResponseCode,
    discrepancyResponseDescription,
    createdAt,
    updatedAt,
    dispatchHistory,
    ripsDispatchHistory,
    documentAvailability,
    kind,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
