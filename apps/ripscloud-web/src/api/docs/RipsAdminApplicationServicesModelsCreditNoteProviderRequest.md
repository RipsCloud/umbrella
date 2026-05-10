# RipsAdminApplicationServicesModelsCreditNoteProviderRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**billing_reference** | [**RipsAdminApplicationServicesModelsBillingReference**](RipsAdminApplicationServicesModelsBillingReference.md) |  | [optional] [default to undefined]
**type_document_id** | **number** |  | [optional] [default to undefined]
**number** | **number** |  | [optional] [default to undefined]
**discrepancyresponsecode** | **number** |  | [optional] [default to undefined]
**discrepancyresponsedescription** | **string** |  | [optional] [default to undefined]
**notes** | **string** |  | [optional] [default to undefined]
**prefix** | **string** |  | [optional] [default to undefined]
**date** | **string** |  | [optional] [default to undefined]
**time** | **string** |  | [optional] [default to undefined]
**resolution_number** | **string** |  | [optional] [default to undefined]
**disable_confirmation_text** | **boolean** |  | [optional] [default to undefined]
**establishment_name** | **string** |  | [optional] [default to undefined]
**establishment_address** | **string** |  | [optional] [default to undefined]
**establishment_phone** | **string** |  | [optional] [default to undefined]
**establishment_municipality** | **number** |  | [optional] [default to undefined]
**establishment_email** | **string** |  | [optional] [default to undefined]
**sendmail** | **boolean** |  | [optional] [default to undefined]
**sendmailtome** | **boolean** |  | [optional] [default to undefined]
**send_customer_credentials** | **boolean** |  | [optional] [default to undefined]
**seze** | **string** |  | [optional] [default to undefined]
**email_cc_list** | [**Array&lt;RipsAdminApplicationServicesModelsEmailCcItem&gt;**](RipsAdminApplicationServicesModelsEmailCcItem.md) |  | [optional] [default to undefined]
**customer** | [**RipsAdminApplicationServicesModelsInvoiceProviderCustomer**](RipsAdminApplicationServicesModelsInvoiceProviderCustomer.md) |  | [optional] [default to undefined]
**payment_form** | [**RipsAdminApplicationServicesModelsCreditNotePaymentForm**](RipsAdminApplicationServicesModelsCreditNotePaymentForm.md) |  | [optional] [default to undefined]
**legal_monetary_totals** | [**RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals**](RipsAdminApplicationServicesModelsInvoiceLegalMonetaryTotals.md) |  | [optional] [default to undefined]
**tax_totals** | [**Array&lt;RipsAdminApplicationServicesModelsInvoiceTaxTotal&gt;**](RipsAdminApplicationServicesModelsInvoiceTaxTotal.md) |  | [optional] [default to undefined]
**health_fields** | [**RipsAdminApplicationServicesModelsInvoiceHealthFields**](RipsAdminApplicationServicesModelsInvoiceHealthFields.md) |  | [optional] [default to undefined]
**credit_note_lines** | [**Array&lt;RipsAdminApplicationServicesModelsCreditNoteLineItem&gt;**](RipsAdminApplicationServicesModelsCreditNoteLineItem.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationServicesModelsCreditNoteProviderRequest } from './api';

const instance: RipsAdminApplicationServicesModelsCreditNoteProviderRequest = {
    billing_reference,
    type_document_id,
    number,
    discrepancyresponsecode,
    discrepancyresponsedescription,
    notes,
    prefix,
    date,
    time,
    resolution_number,
    disable_confirmation_text,
    establishment_name,
    establishment_address,
    establishment_phone,
    establishment_municipality,
    establishment_email,
    sendmail,
    sendmailtome,
    send_customer_credentials,
    seze,
    email_cc_list,
    customer,
    payment_form,
    legal_monetary_totals,
    tax_totals,
    health_fields,
    credit_note_lines,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
