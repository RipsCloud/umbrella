# RipsAdminApplicationDTOsInvoiceDraftDetailsDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**tenantId** | **string** |  | [optional] [default to undefined]
**clientId** | **string** |  | [optional] [default to undefined]
**clientName** | **string** |  | [optional] [default to undefined]
**totalAmount** | **number** |  | [optional] [default to undefined]
**status** | **string** |  | [optional] [default to undefined]
**statusMessage** | **string** |  | [optional] [default to undefined]
**metadata** | [**RipsAdminApplicationDTOsInvoiceDraftMetadataDto**](RipsAdminApplicationDTOsInvoiceDraftMetadataDto.md) |  | [optional] [default to undefined]
**submittedByUserId** | **string** |  | [optional] [default to undefined]
**submittedByDisplayName** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** |  | [optional] [default to undefined]
**updatedAt** | **string** |  | [optional] [default to undefined]
**assignedInvoiceNumber** | **string** |  | [optional] [default to undefined]
**cufe** | **string** |  | [optional] [default to undefined]
**dianStatusCode** | **string** |  | [optional] [default to undefined]
**dianStatusDescription** | **string** |  | [optional] [default to undefined]
**invoiceDispatchHistory** | [**Array&lt;RipsAdminApplicationDTOsDispatchAttemptDto&gt;**](RipsAdminApplicationDTOsDispatchAttemptDto.md) |  | [optional] [default to undefined]
**ripsDispatchHistory** | [**Array&lt;RipsAdminApplicationDTOsDispatchAttemptDto&gt;**](RipsAdminApplicationDTOsDispatchAttemptDto.md) |  | [optional] [default to undefined]
**documentAvailability** | [**Array&lt;RipsAdminApplicationDTOsDocumentAvailabilityDto&gt;**](RipsAdminApplicationDTOsDocumentAvailabilityDto.md) |  | [optional] [default to undefined]
**ripsPayloadJson** | **string** |  | [optional] [default to undefined]
**kind** | [**RipsAdminDomainEntitiesInvoiceKind**](RipsAdminDomainEntitiesInvoiceKind.md) |  | [optional] [default to undefined]
**cuv** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationDTOsInvoiceDraftDetailsDto } from './api';

const instance: RipsAdminApplicationDTOsInvoiceDraftDetailsDto = {
    id,
    tenantId,
    clientId,
    clientName,
    totalAmount,
    status,
    statusMessage,
    metadata,
    submittedByUserId,
    submittedByDisplayName,
    createdAt,
    updatedAt,
    assignedInvoiceNumber,
    cufe,
    dianStatusCode,
    dianStatusDescription,
    invoiceDispatchHistory,
    ripsDispatchHistory,
    documentAvailability,
    ripsPayloadJson,
    kind,
    cuv,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
