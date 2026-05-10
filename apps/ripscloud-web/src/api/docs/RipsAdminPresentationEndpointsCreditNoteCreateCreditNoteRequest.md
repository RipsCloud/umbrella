# RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**invoiceDraftId** | **string** |  | [optional] [default to undefined]
**creditNoteResolutionId** | **string** |  | [optional] [default to undefined]
**locationId** | **string** |  | [optional] [default to undefined]
**discrepancyResponseCode** | **number** |  | [optional] [default to undefined]
**discrepancyResponseDescription** | **string** |  | [optional] [default to undefined]
**selectedItems** | [**Array&lt;RipsAdminApplicationDTOsSelectedCreditNoteItemDto&gt;**](RipsAdminApplicationDTOsSelectedCreditNoteItemDto.md) |  | [optional] [default to undefined]
**notes** | **string** |  | [optional] [default to undefined]
**creditNotePayload** | [**RipsAdminApplicationServicesModelsCreditNoteProviderRequest**](RipsAdminApplicationServicesModelsCreditNoteProviderRequest.md) |  | [optional] [default to undefined]
**ripsPayload** | [**RipsAdminApplicationDTOsFevRipsApiLocalDto**](RipsAdminApplicationDTOsFevRipsApiLocalDto.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest } from './api';

const instance: RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest = {
    invoiceDraftId,
    creditNoteResolutionId,
    locationId,
    discrepancyResponseCode,
    discrepancyResponseDescription,
    selectedItems,
    notes,
    creditNotePayload,
    ripsPayload,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
