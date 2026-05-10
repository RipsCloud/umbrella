# RipsAdminApplicationServicesModelsInvoiceProviderRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**prefix** | **string** |  | [optional] [default to undefined]
**number** | **string** |  | [optional] [default to undefined]
**type_document_id** | **number** |  | [optional] [default to undefined]
**date** | **string** |  | [optional] [default to undefined]
**time** | **string** |  | [optional] [default to undefined]
**resolution_number** | **string** |  | [optional] [default to undefined]
**customer** | [**RipsAdminApplicationServicesModelsInvoiceProviderCustomer**](RipsAdminApplicationServicesModelsInvoiceProviderCustomer.md) |  | [optional] [default to undefined]
**legal_monetary_totals** | [**RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals**](RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals.md) |  | [optional] [default to undefined]
**invoice_lines** | [**Array&lt;RipsAdminApplicationServicesModelsInvoiceLineItem&gt;**](RipsAdminApplicationServicesModelsInvoiceLineItem.md) |  | [optional] [default to undefined]
**tax_totals** | [**Array&lt;RipsAdminApplicationServicesModelsInvoiceTaxTotal&gt;**](RipsAdminApplicationServicesModelsInvoiceTaxTotal.md) |  | [optional] [default to undefined]
**payment_form** | [**RipsAdminApplicationServicesModelsInvoicePaymentForm**](RipsAdminApplicationServicesModelsInvoicePaymentForm.md) |  | [optional] [default to undefined]
**health_fields** | [**RipsAdminApplicationServicesModelsInvoiceHealthFields**](RipsAdminApplicationServicesModelsInvoiceHealthFields.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationServicesModelsInvoiceProviderRequest } from './api';

const instance: RipsAdminApplicationServicesModelsInvoiceProviderRequest = {
    prefix,
    number,
    type_document_id,
    date,
    time,
    resolution_number,
    customer,
    legal_monetary_totals,
    invoice_lines,
    tax_totals,
    payment_form,
    health_fields,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
