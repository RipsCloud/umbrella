# RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**clientId** | **string** |  | [optional] [default to undefined]
**locationId** | **string** |  | [optional] [default to undefined]
**invoiceResolutionId** | **string** |  | [optional] [default to undefined]
**totalAmount** | **number** |  | [optional] [default to undefined]
**metadata** | [**RipsAdminApplicationDTOsInvoiceDraftMetadataDto**](RipsAdminApplicationDTOsInvoiceDraftMetadataDto.md) |  | [optional] [default to undefined]
**kind** | [**RipsAdminDomainEntitiesInvoiceKind**](RipsAdminDomainEntitiesInvoiceKind.md) |  | [optional] [default to undefined]
**ripsPayload** | [**RipsAdminApplicationDTOsFevRipsApiLocalDto**](RipsAdminApplicationDTOsFevRipsApiLocalDto.md) |  | [optional] [default to undefined]
**invoicePayload** | [**RipsAdminApplicationServicesModelsInvoiceProviderRequest**](RipsAdminApplicationServicesModelsInvoiceProviderRequest.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto } from './api';

const instance: RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto = {
    clientId,
    locationId,
    invoiceResolutionId,
    totalAmount,
    metadata,
    kind,
    ripsPayload,
    invoicePayload,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
