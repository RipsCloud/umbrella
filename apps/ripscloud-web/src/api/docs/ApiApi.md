# ApiApi

All URIs are relative to *http://localhost:5100*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**refreshInvoiceDraftRipsXml**](#refreshinvoicedraftripsxml) | **POST** /api/workspaces/{workspaceId}/invoice/drafts/{draftId}/rips/xml/refresh | |
|[**ripsAdminPresentationEndpointsAuthGetCurrentUserEndpoint**](#ripsadminpresentationendpointsauthgetcurrentuserendpoint) | **GET** /api/auth/user | |
|[**ripsAdminPresentationEndpointsAuthGoogleLoginEndpoint**](#ripsadminpresentationendpointsauthgoogleloginendpoint) | **POST** /api/auth/google | |
|[**ripsAdminPresentationEndpointsAuthLoginEndpoint**](#ripsadminpresentationendpointsauthloginendpoint) | **POST** /api/auth/login | |
|[**ripsAdminPresentationEndpointsAuthLogoutEndpoint**](#ripsadminpresentationendpointsauthlogoutendpoint) | **POST** /api/auth/logout | |
|[**ripsAdminPresentationEndpointsAuthRefreshTokenEndpoint**](#ripsadminpresentationendpointsauthrefreshtokenendpoint) | **POST** /api/auth/refresh | Refresh access token|
|[**ripsAdminPresentationEndpointsAuthRegisterEndpoint**](#ripsadminpresentationendpointsauthregisterendpoint) | **POST** /api/auth/register | |
|[**ripsAdminPresentationEndpointsClientsCreateClientEndpoint**](#ripsadminpresentationendpointsclientscreateclientendpoint) | **POST** /api/workspaces/{workspaceId}/clients | |
|[**ripsAdminPresentationEndpointsClientsGetClientEndpoint**](#ripsadminpresentationendpointsclientsgetclientendpoint) | **GET** /api/workspaces/{workspaceId}/clients/{clientId} | |
|[**ripsAdminPresentationEndpointsClientsListClientsEndpoint**](#ripsadminpresentationendpointsclientslistclientsendpoint) | **GET** /api/workspaces/{workspaceId}/clients | |
|[**ripsAdminPresentationEndpointsClientsUpdateClientEndpoint**](#ripsadminpresentationendpointsclientsupdateclientendpoint) | **PUT** /api/workspaces/{workspaceId}/clients/{clientId} | |
|[**ripsAdminPresentationEndpointsCompanyGetCompanyEndpoint**](#ripsadminpresentationendpointscompanygetcompanyendpoint) | **GET** /api/workspaces/{workspaceId}/company | |
|[**ripsAdminPresentationEndpointsCompanyUpdateCompanyEndpoint**](#ripsadminpresentationendpointscompanyupdatecompanyendpoint) | **PUT** /api/workspaces/{workspaceId}/company | |
|[**ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint**](#ripsadminpresentationendpointsconfiggetfrontendconfigendpoint) | **GET** /api/config/frontend | |
|[**ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteDraftEndpoint**](#ripsadminpresentationendpointscreditnotecreatecreditnotedraftendpoint) | **POST** /api/workspaces/{workspaceId}/credit-notes | |
|[**ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteResolutionEndpoint**](#ripsadminpresentationendpointscreditnotecreatecreditnoteresolutionendpoint) | **POST** /api/workspaces/{workspaceId}/credit-note-resolutions | |
|[**ripsAdminPresentationEndpointsCreditNoteDeleteCreditNoteResolutionEndpoint**](#ripsadminpresentationendpointscreditnotedeletecreditnoteresolutionendpoint) | **DELETE** /api/workspaces/{workspaceId}/credit-note-resolutions/{resolutionId} | |
|[**ripsAdminPresentationEndpointsCreditNoteDownloadCreditNoteDocumentEndpoint**](#ripsadminpresentationendpointscreditnotedownloadcreditnotedocumentendpoint) | **GET** /api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/download/{documentType} | |
|[**ripsAdminPresentationEndpointsCreditNoteGetCreditNoteDraftEndpoint**](#ripsadminpresentationendpointscreditnotegetcreditnotedraftendpoint) | **GET** /api/workspaces/{workspaceId}/credit-notes/{creditNoteId} | |
|[**ripsAdminPresentationEndpointsCreditNoteGetCreditNoteWizardContextEndpoint**](#ripsadminpresentationendpointscreditnotegetcreditnotewizardcontextendpoint) | **GET** /api/workspaces/{workspaceId}/invoices/{invoiceId}/credit-note-context | |
|[**ripsAdminPresentationEndpointsCreditNoteListCreditNoteDraftsEndpoint**](#ripsadminpresentationendpointscreditnotelistcreditnotedraftsendpoint) | **GET** /api/workspaces/{workspaceId}/credit-notes | |
|[**ripsAdminPresentationEndpointsCreditNoteListCreditNoteResolutionsEndpoint**](#ripsadminpresentationendpointscreditnotelistcreditnoteresolutionsendpoint) | **GET** /api/workspaces/{workspaceId}/credit-note-resolutions | |
|[**ripsAdminPresentationEndpointsCreditNoteResendCreditNoteEndpoint**](#ripsadminpresentationendpointscreditnoteresendcreditnoteendpoint) | **POST** /api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/resend | |
|[**ripsAdminPresentationEndpointsCreditNoteRetryCreditNoteDispatchEndpoint**](#ripsadminpresentationendpointscreditnoteretrycreditnotedispatchendpoint) | **POST** /api/workspaces/{workspaceId}/credit-notes/{creditNoteId}/retry | |
|[**ripsAdminPresentationEndpointsCreditNoteUpdateCreditNoteResolutionEndpoint**](#ripsadminpresentationendpointscreditnoteupdatecreditnoteresolutionendpoint) | **PUT** /api/workspaces/{workspaceId}/credit-note-resolutions/{resolutionId} | |
|[**ripsAdminPresentationEndpointsEnvironmentGetEnvironmentEndpoint**](#ripsadminpresentationendpointsenvironmentgetenvironmentendpoint) | **GET** /api/workspaces/{workspaceId}/environment | |
|[**ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentEndpoint**](#ripsadminpresentationendpointsenvironmentupdateenvironmentendpoint) | **PUT** /api/workspaces/{workspaceId}/environment | |
|[**ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint**](#ripsadminpresentationendpointsinvoicecreateinvoicedraftendpoint) | **POST** /api/workspaces/{workspaceId}/invoice/documents | |
|[**ripsAdminPresentationEndpointsInvoiceCreateInvoiceResolutionEndpoint**](#ripsadminpresentationendpointsinvoicecreateinvoiceresolutionendpoint) | **POST** /api/workspaces/{workspaceId}/resolutions | |
|[**ripsAdminPresentationEndpointsInvoiceDeleteInvoiceResolutionEndpoint**](#ripsadminpresentationendpointsinvoicedeleteinvoiceresolutionendpoint) | **DELETE** /api/workspaces/{workspaceId}/resolutions/{resolutionId} | |
|[**ripsAdminPresentationEndpointsInvoiceDownloadInvoiceDocumentEndpoint**](#ripsadminpresentationendpointsinvoicedownloadinvoicedocumentendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/documents/{draftId}/download/{documentType} | |
|[**ripsAdminPresentationEndpointsInvoiceExportInvoicePackageEndpoint**](#ripsadminpresentationendpointsinvoiceexportinvoicepackageendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/documents/{draftId}/export/{format} | |
|[**ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceEndpoint**](#ripsadminpresentationendpointsinvoicefullannulinvoiceendpoint) | **POST** /api/workspaces/{workspaceId}/invoice/documents/{invoiceDraftId}/full-annul | |
|[**ripsAdminPresentationEndpointsInvoiceGetInvoiceConfigurationEndpoint**](#ripsadminpresentationendpointsinvoicegetinvoiceconfigurationendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/settings | |
|[**ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint**](#ripsadminpresentationendpointsinvoicegetinvoicedraftendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/documents/{draftId} | |
|[**ripsAdminPresentationEndpointsInvoiceGetInvoiceWizardContextEndpoint**](#ripsadminpresentationendpointsinvoicegetinvoicewizardcontextendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/wizard/context | |
|[**ripsAdminPresentationEndpointsInvoiceListInvoiceDraftsEndpoint**](#ripsadminpresentationendpointsinvoicelistinvoicedraftsendpoint) | **GET** /api/workspaces/{workspaceId}/invoice/documents | |
|[**ripsAdminPresentationEndpointsInvoiceListInvoiceResolutionsEndpoint**](#ripsadminpresentationendpointsinvoicelistinvoiceresolutionsendpoint) | **GET** /api/workspaces/{workspaceId}/resolutions | |
|[**ripsAdminPresentationEndpointsInvoiceResendInvoiceEndpoint**](#ripsadminpresentationendpointsinvoiceresendinvoiceendpoint) | **POST** /api/workspaces/{workspaceId}/invoice/documents/{draftId}/resend | |
|[**ripsAdminPresentationEndpointsInvoiceRetryInvoiceDispatchEndpoint**](#ripsadminpresentationendpointsinvoiceretryinvoicedispatchendpoint) | **POST** /api/workspaces/{workspaceId}/invoice/documents/{draftId}/retry | |
|[**ripsAdminPresentationEndpointsInvoiceUpdateInvoiceConfigurationEndpoint**](#ripsadminpresentationendpointsinvoiceupdateinvoiceconfigurationendpoint) | **PUT** /api/workspaces/{workspaceId}/invoice/settings | |
|[**ripsAdminPresentationEndpointsInvoiceUpdateInvoiceResolutionEndpoint**](#ripsadminpresentationendpointsinvoiceupdateinvoiceresolutionendpoint) | **PUT** /api/workspaces/{workspaceId}/resolutions/{resolutionId} | |
|[**ripsAdminPresentationEndpointsPatientsConvertXlsxToCsvEndpoint**](#ripsadminpresentationendpointspatientsconvertxlsxtocsvendpoint) | **POST** /api/workspaces/{workspaceId}/patients/convert-xlsx-to-csv | |
|[**ripsAdminPresentationEndpointsPatientsCreatePatientEndpoint**](#ripsadminpresentationendpointspatientscreatepatientendpoint) | **POST** /api/workspaces/{workspaceId}/patients | |
|[**ripsAdminPresentationEndpointsPatientsDownloadCsvTemplateEndpoint**](#ripsadminpresentationendpointspatientsdownloadcsvtemplateendpoint) | **GET** /api/workspaces/{workspaceId}/patients/csv-template | |
|[**ripsAdminPresentationEndpointsPatientsDownloadXlsxTemplateEndpoint**](#ripsadminpresentationendpointspatientsdownloadxlsxtemplateendpoint) | **GET** /api/workspaces/{workspaceId}/patients/xlsx-template | |
|[**ripsAdminPresentationEndpointsPatientsGetPatientEndpoint**](#ripsadminpresentationendpointspatientsgetpatientendpoint) | **GET** /api/workspaces/{workspaceId}/patients/{patientId} | |
|[**ripsAdminPresentationEndpointsPatientsListPatientsEndpoint**](#ripsadminpresentationendpointspatientslistpatientsendpoint) | **GET** /api/workspaces/{workspaceId}/patients | |
|[**ripsAdminPresentationEndpointsPatientsUpdatePatientEndpoint**](#ripsadminpresentationendpointspatientsupdatepatientendpoint) | **PUT** /api/workspaces/{workspaceId}/patients/{patientId} | |
|[**ripsAdminPresentationEndpointsReportsDownloadClientAccountStatementCsvEndpoint**](#ripsadminpresentationendpointsreportsdownloadclientaccountstatementcsvendpoint) | **GET** /api/workspaces/{workspaceId}/reports/client-statement/csv | |
|[**ripsAdminPresentationEndpointsReportsDownloadResolutionUsageReportCsvEndpoint**](#ripsadminpresentationendpointsreportsdownloadresolutionusagereportcsvendpoint) | **GET** /api/workspaces/{workspaceId}/reports/resolution-usage/csv | |
|[**ripsAdminPresentationEndpointsReportsDownloadRipsDispatchReportCsvEndpoint**](#ripsadminpresentationendpointsreportsdownloadripsdispatchreportcsvendpoint) | **GET** /api/workspaces/{workspaceId}/reports/rips-dispatch/csv | |
|[**ripsAdminPresentationEndpointsReportsDownloadSalesReportCsvEndpoint**](#ripsadminpresentationendpointsreportsdownloadsalesreportcsvendpoint) | **GET** /api/workspaces/{workspaceId}/reports/sales/csv | |
|[**ripsAdminPresentationEndpointsReportsGetClientAccountStatementEndpoint**](#ripsadminpresentationendpointsreportsgetclientaccountstatementendpoint) | **GET** /api/workspaces/{workspaceId}/reports/client-statement | |
|[**ripsAdminPresentationEndpointsReportsGetDashboardSummaryEndpoint**](#ripsadminpresentationendpointsreportsgetdashboardsummaryendpoint) | **GET** /api/workspaces/{workspaceId}/dashboard/summary | |
|[**ripsAdminPresentationEndpointsReportsGetResolutionUsageReportEndpoint**](#ripsadminpresentationendpointsreportsgetresolutionusagereportendpoint) | **GET** /api/workspaces/{workspaceId}/reports/resolution-usage | |
|[**ripsAdminPresentationEndpointsReportsGetRipsDispatchReportEndpoint**](#ripsadminpresentationendpointsreportsgetripsdispatchreportendpoint) | **GET** /api/workspaces/{workspaceId}/reports/rips-dispatch | |
|[**ripsAdminPresentationEndpointsReportsGetSalesReportEndpoint**](#ripsadminpresentationendpointsreportsgetsalesreportendpoint) | **GET** /api/workspaces/{workspaceId}/reports/sales | |
|[**ripsAdminPresentationEndpointsServicesCreateTenantServiceEndpoint**](#ripsadminpresentationendpointsservicescreatetenantserviceendpoint) | **POST** /api/workspaces/{workspaceId}/services | |
|[**ripsAdminPresentationEndpointsServicesDeleteTenantServiceEndpoint**](#ripsadminpresentationendpointsservicesdeletetenantserviceendpoint) | **DELETE** /api/workspaces/{workspaceId}/services/{serviceId} | |
|[**ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint**](#ripsadminpresentationendpointsservicesgettenantserviceendpoint) | **GET** /api/workspaces/{workspaceId}/services/{serviceId} | |
|[**ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint**](#ripsadminpresentationendpointsserviceslisttenantservicesendpoint) | **GET** /api/workspaces/{workspaceId}/services | |
|[**ripsAdminPresentationEndpointsServicesUpdateTenantServiceEndpoint**](#ripsadminpresentationendpointsservicesupdatetenantserviceendpoint) | **PUT** /api/workspaces/{workspaceId}/services/{serviceId} | |
|[**ripsAdminPresentationEndpointsSisproGetSisproSettingsEndpoint**](#ripsadminpresentationendpointssisprogetsisprosettingsendpoint) | **GET** /api/workspaces/{workspaceId}/sispro/settings | |
|[**ripsAdminPresentationEndpointsSisproLoginSisproEndpoint**](#ripsadminpresentationendpointssisprologinsisproendpoint) | **POST** /api/workspaces/{workspaceId}/sispro/login | |
|[**ripsAdminPresentationEndpointsSpecialistsCreateSpecialistEndpoint**](#ripsadminpresentationendpointsspecialistscreatespecialistendpoint) | **POST** /api/workspaces/{workspaceId}/specialists | |
|[**ripsAdminPresentationEndpointsSpecialistsGetSpecialistEndpoint**](#ripsadminpresentationendpointsspecialistsgetspecialistendpoint) | **GET** /api/workspaces/{workspaceId}/specialists/{specialistId} | |
|[**ripsAdminPresentationEndpointsSpecialistsListSpecialistsEndpoint**](#ripsadminpresentationendpointsspecialistslistspecialistsendpoint) | **GET** /api/workspaces/{workspaceId}/specialists | |
|[**ripsAdminPresentationEndpointsSpecialistsUpdateSpecialistEndpoint**](#ripsadminpresentationendpointsspecialistsupdatespecialistendpoint) | **PUT** /api/workspaces/{workspaceId}/specialists/{specialistId} | |
|[**ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint**](#ripsadminpresentationendpointsworkspacesaddusertoworkspaceendpoint) | **POST** /api/workspaces/{workspaceId}/users | |
|[**ripsAdminPresentationEndpointsWorkspacesCreateWorkspaceEndpoint**](#ripsadminpresentationendpointsworkspacescreateworkspaceendpoint) | **POST** /api/workspaces | |
|[**ripsAdminPresentationEndpointsWorkspacesGetUserWorkspacesEndpoint**](#ripsadminpresentationendpointsworkspacesgetuserworkspacesendpoint) | **GET** /api/workspaces/user | |
|[**ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint**](#ripsadminpresentationendpointsworkspacesgetworkspacedetailsendpoint) | **GET** /api/workspaces/{workspaceId} | |
|[**ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint**](#ripsadminpresentationendpointsworkspacesgetworkspaceusersendpoint) | **GET** /api/workspaces/{workspaceId}/users | |
|[**ripsAdminPresentationEndpointsWorkspacesListWorkspacesEndpoint**](#ripsadminpresentationendpointsworkspaceslistworkspacesendpoint) | **GET** /api/workspaces | |
|[**updateInvoiceDraftRips**](#updateinvoicedraftrips) | **PUT** /api/workspaces/{workspaceId}/invoice/drafts/{draftId}/rips | |

# **refreshInvoiceDraftRipsXml**
> RipsAdminApplicationDTOsInvoiceDraftDetailsDto refreshInvoiceDraftRipsXml(ripsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)
let ripsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest: RipsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest; //

const { status, data } = await apiInstance.refreshInvoiceDraftRipsXml(
    workspaceId,
    draftId,
    ripsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest** | **RipsAdminPresentationEndpointsInvoiceRefreshInvoiceDraftRipsXmlRequest**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthGetCurrentUserEndpoint**
> RipsAdminApplicationQueriesAuthGetCurrentUserResponse ripsAdminPresentationEndpointsAuthGetCurrentUserEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthGetCurrentUserEndpoint();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**RipsAdminApplicationQueriesAuthGetCurrentUserResponse**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthGoogleLoginEndpoint**
> RipsAdminApplicationDTOsAuthResponseDto ripsAdminPresentationEndpointsAuthGoogleLoginEndpoint(ripsAdminPresentationEndpointsAuthGoogleLoginRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsAuthGoogleLoginRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let ripsAdminPresentationEndpointsAuthGoogleLoginRequestDto: RipsAdminPresentationEndpointsAuthGoogleLoginRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthGoogleLoginEndpoint(
    ripsAdminPresentationEndpointsAuthGoogleLoginRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsAuthGoogleLoginRequestDto** | **RipsAdminPresentationEndpointsAuthGoogleLoginRequestDto**|  | |


### Return type

**RipsAdminApplicationDTOsAuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthLoginEndpoint**
> RipsAdminApplicationDTOsAuthResponseDto ripsAdminPresentationEndpointsAuthLoginEndpoint(ripsAdminApplicationDTOsLoginRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsLoginRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let ripsAdminApplicationDTOsLoginRequestDto: RipsAdminApplicationDTOsLoginRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthLoginEndpoint(
    ripsAdminApplicationDTOsLoginRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsLoginRequestDto** | **RipsAdminApplicationDTOsLoginRequestDto**|  | |


### Return type

**RipsAdminApplicationDTOsAuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthLogoutEndpoint**
> ripsAdminPresentationEndpointsAuthLogoutEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthLogoutEndpoint();
```

### Parameters
This endpoint does not have any parameters.


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthRefreshTokenEndpoint**
> RipsAdminApplicationDTOsAuthResponseDto ripsAdminPresentationEndpointsAuthRefreshTokenEndpoint(ripsAdminApplicationDTOsRefreshTokenRequestDto)

Uses a refresh token to obtain a new access token and refresh token

### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsRefreshTokenRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let ripsAdminApplicationDTOsRefreshTokenRequestDto: RipsAdminApplicationDTOsRefreshTokenRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthRefreshTokenEndpoint(
    ripsAdminApplicationDTOsRefreshTokenRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsRefreshTokenRequestDto** | **RipsAdminApplicationDTOsRefreshTokenRequestDto**|  | |


### Return type

**RipsAdminApplicationDTOsAuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsAuthRegisterEndpoint**
> RipsAdminApplicationDTOsAuthResponseDto ripsAdminPresentationEndpointsAuthRegisterEndpoint(ripsAdminApplicationDTOsRegisterRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsRegisterRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let ripsAdminApplicationDTOsRegisterRequestDto: RipsAdminApplicationDTOsRegisterRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsAuthRegisterEndpoint(
    ripsAdminApplicationDTOsRegisterRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsRegisterRequestDto** | **RipsAdminApplicationDTOsRegisterRequestDto**|  | |


### Return type

**RipsAdminApplicationDTOsAuthResponseDto**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsClientsCreateClientEndpoint**
> RipsAdminApplicationDTOsClientDto ripsAdminPresentationEndpointsClientsCreateClientEndpoint(ripsAdminApplicationDTOsCreateClientRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateClientRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateClientRequestDto: RipsAdminApplicationDTOsCreateClientRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsClientsCreateClientEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateClientRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateClientRequestDto** | **RipsAdminApplicationDTOsCreateClientRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsClientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsClientsGetClientEndpoint**
> RipsAdminApplicationDTOsClientDto ripsAdminPresentationEndpointsClientsGetClientEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let clientId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsClientsGetClientEndpoint(
    workspaceId,
    clientId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **clientId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsClientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsClientsListClientsEndpoint**
> Array<RipsAdminApplicationDTOsClientDto> ripsAdminPresentationEndpointsClientsListClientsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsClientsListClientsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsClientDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsClientsUpdateClientEndpoint**
> RipsAdminApplicationDTOsClientDto ripsAdminPresentationEndpointsClientsUpdateClientEndpoint(ripsAdminApplicationDTOsUpdateClientRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateClientRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let clientId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateClientRequestDto: RipsAdminApplicationDTOsUpdateClientRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsClientsUpdateClientEndpoint(
    workspaceId,
    clientId,
    ripsAdminApplicationDTOsUpdateClientRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateClientRequestDto** | **RipsAdminApplicationDTOsUpdateClientRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **clientId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsClientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCompanyGetCompanyEndpoint**
> RipsAdminApplicationDTOsTenantDto ripsAdminPresentationEndpointsCompanyGetCompanyEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCompanyGetCompanyEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsTenantDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCompanyUpdateCompanyEndpoint**
> RipsAdminApplicationDTOsTenantDto ripsAdminPresentationEndpointsCompanyUpdateCompanyEndpoint(ripsAdminApplicationDTOsUpdateTenantRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateTenantRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateTenantRequestDto: RipsAdminApplicationDTOsUpdateTenantRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCompanyUpdateCompanyEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsUpdateTenantRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateTenantRequestDto** | **RipsAdminApplicationDTOsUpdateTenantRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsTenantDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint**
> RipsAdminPresentationEndpointsConfigFrontendConfigResponse ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**RipsAdminPresentationEndpointsConfigFrontendConfigResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteDraftEndpoint**
> RipsAdminApplicationDTOsCreditNoteDraftDetailsDto ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteDraftEndpoint(ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest: RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteDraftEndpoint(
    workspaceId,
    ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest** | **RipsAdminPresentationEndpointsCreditNoteCreateCreditNoteRequest**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteResolutionEndpoint**
> RipsAdminApplicationDTOsCreditNoteResolutionDto ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteResolutionEndpoint(ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto: RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteCreateCreditNoteResolutionEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto** | **RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteResolutionDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteDeleteCreditNoteResolutionEndpoint**
> ripsAdminPresentationEndpointsCreditNoteDeleteCreditNoteResolutionEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let resolutionId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteDeleteCreditNoteResolutionEndpoint(
    workspaceId,
    resolutionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **resolutionId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteDownloadCreditNoteDocumentEndpoint**
> ripsAdminPresentationEndpointsCreditNoteDownloadCreditNoteDocumentEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let creditNoteId: string; // (default to undefined)
let documentType: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteDownloadCreditNoteDocumentEndpoint(
    workspaceId,
    creditNoteId,
    documentType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **creditNoteId** | [**string**] |  | defaults to undefined|
| **documentType** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteGetCreditNoteDraftEndpoint**
> RipsAdminApplicationDTOsCreditNoteDraftDetailsDto ripsAdminPresentationEndpointsCreditNoteGetCreditNoteDraftEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let creditNoteId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteGetCreditNoteDraftEndpoint(
    workspaceId,
    creditNoteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **creditNoteId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteGetCreditNoteWizardContextEndpoint**
> RipsAdminApplicationDTOsCreditNoteWizardContextDto ripsAdminPresentationEndpointsCreditNoteGetCreditNoteWizardContextEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let invoiceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteGetCreditNoteWizardContextEndpoint(
    workspaceId,
    invoiceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **invoiceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteWizardContextDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteListCreditNoteDraftsEndpoint**
> RipsAdminApplicationQueriesHandlersCreditNoteDraftListResponseDto ripsAdminPresentationEndpointsCreditNoteListCreditNoteDraftsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let workspaceId2: string; // (default to undefined)
let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 20)
let sortBy: string; // (optional) (default to undefined)
let sortDirection: string; // (optional) (default to undefined)
let creditNoteNumber: string; // (optional) (default to undefined)
let originalInvoiceNumber: string; // (optional) (default to undefined)
let clientName: string; // (optional) (default to undefined)
let status: string; // (optional) (default to undefined)
let createdFrom: string; // (optional) (default to undefined)
let createdTo: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteListCreditNoteDraftsEndpoint(
    workspaceId,
    workspaceId2,
    page,
    pageSize,
    sortBy,
    sortDirection,
    creditNoteNumber,
    originalInvoiceNumber,
    clientName,
    status,
    createdFrom,
    createdTo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **workspaceId2** | [**string**] |  | defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 20|
| **sortBy** | [**string**] |  | (optional) defaults to undefined|
| **sortDirection** | [**string**] |  | (optional) defaults to undefined|
| **creditNoteNumber** | [**string**] |  | (optional) defaults to undefined|
| **originalInvoiceNumber** | [**string**] |  | (optional) defaults to undefined|
| **clientName** | [**string**] |  | (optional) defaults to undefined|
| **status** | [**string**] |  | (optional) defaults to undefined|
| **createdFrom** | [**string**] |  | (optional) defaults to undefined|
| **createdTo** | [**string**] |  | (optional) defaults to undefined|


### Return type

**RipsAdminApplicationQueriesHandlersCreditNoteDraftListResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteListCreditNoteResolutionsEndpoint**
> Array<RipsAdminApplicationDTOsCreditNoteResolutionDto> ripsAdminPresentationEndpointsCreditNoteListCreditNoteResolutionsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteListCreditNoteResolutionsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsCreditNoteResolutionDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteResendCreditNoteEndpoint**
> ripsAdminPresentationEndpointsCreditNoteResendCreditNoteEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let creditNoteId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteResendCreditNoteEndpoint(
    workspaceId,
    creditNoteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **creditNoteId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteRetryCreditNoteDispatchEndpoint**
> ripsAdminPresentationEndpointsCreditNoteRetryCreditNoteDispatchEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let creditNoteId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteRetryCreditNoteDispatchEndpoint(
    workspaceId,
    creditNoteId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **creditNoteId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsCreditNoteUpdateCreditNoteResolutionEndpoint**
> RipsAdminApplicationDTOsCreditNoteResolutionDto ripsAdminPresentationEndpointsCreditNoteUpdateCreditNoteResolutionEndpoint(ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let resolutionId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto: RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsCreditNoteUpdateCreditNoteResolutionEndpoint(
    workspaceId,
    resolutionId,
    ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto** | **RipsAdminApplicationDTOsCreateCreditNoteResolutionRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **resolutionId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteResolutionDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsEnvironmentGetEnvironmentEndpoint**
> RipsAdminPresentationEndpointsEnvironmentGetEnvironmentResponse ripsAdminPresentationEndpointsEnvironmentGetEnvironmentEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsEnvironmentGetEnvironmentEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminPresentationEndpointsEnvironmentGetEnvironmentResponse**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentEndpoint**
> RipsAdminPresentationEndpointsEnvironmentUpdateEnvironmentResponse ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentEndpoint(ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest: RipsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentEndpoint(
    workspaceId,
    ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest** | **RipsAdminPresentationEndpointsEnvironmentUpdateEnvironmentRequest**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminPresentationEndpointsEnvironmentUpdateEnvironmentResponse**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint**
> RipsAdminApplicationDTOsInvoiceDraftDetailsDto ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint(ripsAdminApplicationDTOsCreateInvoiceDraftRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateInvoiceDraftRequestDto: RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceCreateInvoiceDraftEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateInvoiceDraftRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateInvoiceDraftRequestDto** | **RipsAdminApplicationDTOsCreateInvoiceDraftRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceCreateInvoiceResolutionEndpoint**
> RipsAdminApplicationDTOsInvoiceResolutionDto ripsAdminPresentationEndpointsInvoiceCreateInvoiceResolutionEndpoint(ripsAdminApplicationDTOsCreateInvoiceResolutionRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateInvoiceResolutionRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateInvoiceResolutionRequestDto: RipsAdminApplicationDTOsCreateInvoiceResolutionRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceCreateInvoiceResolutionEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateInvoiceResolutionRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateInvoiceResolutionRequestDto** | **RipsAdminApplicationDTOsCreateInvoiceResolutionRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceResolutionDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceDeleteInvoiceResolutionEndpoint**
> ripsAdminPresentationEndpointsInvoiceDeleteInvoiceResolutionEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let resolutionId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceDeleteInvoiceResolutionEndpoint(
    workspaceId,
    resolutionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **resolutionId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceDownloadInvoiceDocumentEndpoint**
> ripsAdminPresentationEndpointsInvoiceDownloadInvoiceDocumentEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)
let documentType: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceDownloadInvoiceDocumentEndpoint(
    workspaceId,
    draftId,
    documentType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|
| **documentType** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceExportInvoicePackageEndpoint**
> ripsAdminPresentationEndpointsInvoiceExportInvoicePackageEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)
let format: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceExportInvoicePackageEndpoint(
    workspaceId,
    draftId,
    format
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|
| **format** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceEndpoint**
> RipsAdminApplicationDTOsCreditNoteDraftDetailsDto ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceEndpoint(ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let invoiceDraftId: string; // (default to undefined)
let ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest: RipsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceEndpoint(
    workspaceId,
    invoiceDraftId,
    ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest** | **RipsAdminPresentationEndpointsInvoiceFullAnnulInvoiceRequest**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **invoiceDraftId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsCreditNoteDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceGetInvoiceConfigurationEndpoint**
> RipsAdminApplicationDTOsInvoiceSettingsDto ripsAdminPresentationEndpointsInvoiceGetInvoiceConfigurationEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceGetInvoiceConfigurationEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceSettingsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint**
> RipsAdminApplicationDTOsInvoiceDraftDetailsDto ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceGetInvoiceDraftEndpoint(
    workspaceId,
    draftId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceGetInvoiceWizardContextEndpoint**
> RipsAdminApplicationDTOsInvoiceWizardContextDto ripsAdminPresentationEndpointsInvoiceGetInvoiceWizardContextEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceGetInvoiceWizardContextEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceWizardContextDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceListInvoiceDraftsEndpoint**
> RipsAdminApplicationDTOsInvoiceDraftListResponseDto ripsAdminPresentationEndpointsInvoiceListInvoiceDraftsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let page: number; // (default to undefined)
let pageSize: number; // (default to undefined)
let sortBy: string; // (optional) (default to undefined)
let sortDirection: string; // (optional) (default to undefined)
let invoiceNumber: string; // (optional) (default to undefined)
let clientName: string; // (optional) (default to undefined)
let status: string; // (optional) (default to undefined)
let submittedBy: string; // (optional) (default to undefined)
let createdFrom: string; // (optional) (default to undefined)
let createdTo: string; // (optional) (default to undefined)
let totalMin: number; // (optional) (default to undefined)
let totalMax: number; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceListInvoiceDraftsEndpoint(
    workspaceId,
    page,
    pageSize,
    sortBy,
    sortDirection,
    invoiceNumber,
    clientName,
    status,
    submittedBy,
    createdFrom,
    createdTo,
    totalMin,
    totalMax
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **page** | [**number**] |  | defaults to undefined|
| **pageSize** | [**number**] |  | defaults to undefined|
| **sortBy** | [**string**] |  | (optional) defaults to undefined|
| **sortDirection** | [**string**] |  | (optional) defaults to undefined|
| **invoiceNumber** | [**string**] |  | (optional) defaults to undefined|
| **clientName** | [**string**] |  | (optional) defaults to undefined|
| **status** | [**string**] |  | (optional) defaults to undefined|
| **submittedBy** | [**string**] |  | (optional) defaults to undefined|
| **createdFrom** | [**string**] |  | (optional) defaults to undefined|
| **createdTo** | [**string**] |  | (optional) defaults to undefined|
| **totalMin** | [**number**] |  | (optional) defaults to undefined|
| **totalMax** | [**number**] |  | (optional) defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceDraftListResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceListInvoiceResolutionsEndpoint**
> Array<RipsAdminApplicationDTOsInvoiceResolutionDto> ripsAdminPresentationEndpointsInvoiceListInvoiceResolutionsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceListInvoiceResolutionsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsInvoiceResolutionDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceResendInvoiceEndpoint**
> ripsAdminPresentationEndpointsInvoiceResendInvoiceEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceResendInvoiceEndpoint(
    workspaceId,
    draftId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceRetryInvoiceDispatchEndpoint**
> ripsAdminPresentationEndpointsInvoiceRetryInvoiceDispatchEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceRetryInvoiceDispatchEndpoint(
    workspaceId,
    draftId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceUpdateInvoiceConfigurationEndpoint**
> RipsAdminApplicationDTOsInvoiceSettingsDto ripsAdminPresentationEndpointsInvoiceUpdateInvoiceConfigurationEndpoint(ripsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto: RipsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceUpdateInvoiceConfigurationEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto** | **RipsAdminApplicationDTOsUpdateInvoiceSettingsRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceSettingsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsInvoiceUpdateInvoiceResolutionEndpoint**
> RipsAdminApplicationDTOsInvoiceResolutionDto ripsAdminPresentationEndpointsInvoiceUpdateInvoiceResolutionEndpoint(ripsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let resolutionId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto: RipsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsInvoiceUpdateInvoiceResolutionEndpoint(
    workspaceId,
    resolutionId,
    ripsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto** | **RipsAdminApplicationDTOsUpdateInvoiceResolutionRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **resolutionId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceResolutionDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsConvertXlsxToCsvEndpoint**
> ripsAdminPresentationEndpointsPatientsConvertXlsxToCsvEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let file: File; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsConvertXlsxToCsvEndpoint(
    workspaceId,
    file
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **file** | [**File**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsCreatePatientEndpoint**
> RipsAdminApplicationDTOsPatientDto ripsAdminPresentationEndpointsPatientsCreatePatientEndpoint(ripsAdminApplicationDTOsCreatePatientRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreatePatientRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreatePatientRequestDto: RipsAdminApplicationDTOsCreatePatientRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsCreatePatientEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreatePatientRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreatePatientRequestDto** | **RipsAdminApplicationDTOsCreatePatientRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsPatientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsDownloadCsvTemplateEndpoint**
> ripsAdminPresentationEndpointsPatientsDownloadCsvTemplateEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsDownloadCsvTemplateEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsDownloadXlsxTemplateEndpoint**
> ripsAdminPresentationEndpointsPatientsDownloadXlsxTemplateEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsDownloadXlsxTemplateEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsGetPatientEndpoint**
> RipsAdminApplicationDTOsPatientDto ripsAdminPresentationEndpointsPatientsGetPatientEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let patientId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsGetPatientEndpoint(
    workspaceId,
    patientId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **patientId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsPatientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsListPatientsEndpoint**
> Array<RipsAdminApplicationDTOsPatientDto> ripsAdminPresentationEndpointsPatientsListPatientsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsListPatientsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsPatientDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsPatientsUpdatePatientEndpoint**
> RipsAdminApplicationDTOsPatientDto ripsAdminPresentationEndpointsPatientsUpdatePatientEndpoint(ripsAdminApplicationDTOsUpdatePatientRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdatePatientRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let patientId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdatePatientRequestDto: RipsAdminApplicationDTOsUpdatePatientRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsPatientsUpdatePatientEndpoint(
    workspaceId,
    patientId,
    ripsAdminApplicationDTOsUpdatePatientRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdatePatientRequestDto** | **RipsAdminApplicationDTOsUpdatePatientRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **patientId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsPatientDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsDownloadClientAccountStatementCsvEndpoint**
> ripsAdminPresentationEndpointsReportsDownloadClientAccountStatementCsvEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsDownloadClientAccountStatementCsvEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**403** | Forbidden |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsDownloadResolutionUsageReportCsvEndpoint**
> ripsAdminPresentationEndpointsReportsDownloadResolutionUsageReportCsvEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsDownloadResolutionUsageReportCsvEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**403** | Forbidden |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsDownloadRipsDispatchReportCsvEndpoint**
> ripsAdminPresentationEndpointsReportsDownloadRipsDispatchReportCsvEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsDownloadRipsDispatchReportCsvEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsDownloadSalesReportCsvEndpoint**
> ripsAdminPresentationEndpointsReportsDownloadSalesReportCsvEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsDownloadSalesReportCsvEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsGetClientAccountStatementEndpoint**
> RipsAdminApplicationDTOsClientAccountStatementResponseDto ripsAdminPresentationEndpointsReportsGetClientAccountStatementEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let clientId: string; // (default to undefined)
let page: number; // (default to undefined)
let pageSize: number; // (default to undefined)
let dateFrom: string; // (optional) (default to undefined)
let dateTo: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsGetClientAccountStatementEndpoint(
    workspaceId,
    clientId,
    page,
    pageSize,
    dateFrom,
    dateTo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **clientId** | [**string**] |  | defaults to undefined|
| **page** | [**number**] |  | defaults to undefined|
| **pageSize** | [**number**] |  | defaults to undefined|
| **dateFrom** | [**string**] |  | (optional) defaults to undefined|
| **dateTo** | [**string**] |  | (optional) defaults to undefined|


### Return type

**RipsAdminApplicationDTOsClientAccountStatementResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsGetDashboardSummaryEndpoint**
> RipsAdminApplicationDTOsDashboardSummaryDto ripsAdminPresentationEndpointsReportsGetDashboardSummaryEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsGetDashboardSummaryEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsDashboardSummaryDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsGetResolutionUsageReportEndpoint**
> RipsAdminApplicationDTOsResolutionUsageReportResponseDto ripsAdminPresentationEndpointsReportsGetResolutionUsageReportEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsGetResolutionUsageReportEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsResolutionUsageReportResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsGetRipsDispatchReportEndpoint**
> RipsAdminApplicationDTOsRipsDispatchReportResponseDto ripsAdminPresentationEndpointsReportsGetRipsDispatchReportEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let page: number; // (default to undefined)
let pageSize: number; // (default to undefined)
let dateFrom: string; // (optional) (default to undefined)
let dateTo: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsGetRipsDispatchReportEndpoint(
    workspaceId,
    page,
    pageSize,
    dateFrom,
    dateTo
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **page** | [**number**] |  | defaults to undefined|
| **pageSize** | [**number**] |  | defaults to undefined|
| **dateFrom** | [**string**] |  | (optional) defaults to undefined|
| **dateTo** | [**string**] |  | (optional) defaults to undefined|


### Return type

**RipsAdminApplicationDTOsRipsDispatchReportResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsReportsGetSalesReportEndpoint**
> RipsAdminApplicationDTOsSalesReportResponseDto ripsAdminPresentationEndpointsReportsGetSalesReportEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let dateFrom: string; // (default to undefined)
let dateTo: string; // (default to undefined)
let page: number; // (default to undefined)
let pageSize: number; // (default to undefined)
let clientId: string; // (optional) (default to undefined)
let status: string; // (optional) (default to undefined)
let documentType: string; // (optional) (default to undefined)
let serviceCategory: string; // (optional) (default to undefined)
let serviceCode: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsReportsGetSalesReportEndpoint(
    workspaceId,
    dateFrom,
    dateTo,
    page,
    pageSize,
    clientId,
    status,
    documentType,
    serviceCategory,
    serviceCode
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **dateFrom** | [**string**] |  | defaults to undefined|
| **dateTo** | [**string**] |  | defaults to undefined|
| **page** | [**number**] |  | defaults to undefined|
| **pageSize** | [**number**] |  | defaults to undefined|
| **clientId** | [**string**] |  | (optional) defaults to undefined|
| **status** | [**string**] |  | (optional) defaults to undefined|
| **documentType** | [**string**] |  | (optional) defaults to undefined|
| **serviceCategory** | [**string**] |  | (optional) defaults to undefined|
| **serviceCode** | [**string**] |  | (optional) defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSalesReportResponseDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsServicesCreateTenantServiceEndpoint**
> RipsAdminApplicationDTOsTenantServiceDetailsDto ripsAdminPresentationEndpointsServicesCreateTenantServiceEndpoint(ripsAdminApplicationDTOsCreateTenantServiceRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateTenantServiceRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateTenantServiceRequestDto: RipsAdminApplicationDTOsCreateTenantServiceRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsServicesCreateTenantServiceEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateTenantServiceRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateTenantServiceRequestDto** | **RipsAdminApplicationDTOsCreateTenantServiceRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsTenantServiceDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsServicesDeleteTenantServiceEndpoint**
> ripsAdminPresentationEndpointsServicesDeleteTenantServiceEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let serviceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsServicesDeleteTenantServiceEndpoint(
    workspaceId,
    serviceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **serviceId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint**
> RipsAdminApplicationDTOsTenantServiceDetailsDto ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let serviceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsServicesGetTenantServiceEndpoint(
    workspaceId,
    serviceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **serviceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsTenantServiceDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint**
> Array<RipsAdminApplicationDTOsTenantServiceSummaryDto> ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsServicesListTenantServicesEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsTenantServiceSummaryDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsServicesUpdateTenantServiceEndpoint**
> RipsAdminApplicationDTOsTenantServiceDetailsDto ripsAdminPresentationEndpointsServicesUpdateTenantServiceEndpoint(ripsAdminApplicationDTOsUpdateTenantServiceRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateTenantServiceRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let serviceId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateTenantServiceRequestDto: RipsAdminApplicationDTOsUpdateTenantServiceRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsServicesUpdateTenantServiceEndpoint(
    workspaceId,
    serviceId,
    ripsAdminApplicationDTOsUpdateTenantServiceRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateTenantServiceRequestDto** | **RipsAdminApplicationDTOsUpdateTenantServiceRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **serviceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsTenantServiceDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSisproGetSisproSettingsEndpoint**
> RipsAdminApplicationDTOsSisproSettingsDto ripsAdminPresentationEndpointsSisproGetSisproSettingsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSisproGetSisproSettingsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSisproSettingsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSisproLoginSisproEndpoint**
> RipsAdminApplicationDTOsSisproLoginResultDto ripsAdminPresentationEndpointsSisproLoginSisproEndpoint(ripsAdminApplicationDTOsSisproLoginRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsSisproLoginRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsSisproLoginRequestDto: RipsAdminApplicationDTOsSisproLoginRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSisproLoginSisproEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsSisproLoginRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsSisproLoginRequestDto** | **RipsAdminApplicationDTOsSisproLoginRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSisproLoginResultDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSpecialistsCreateSpecialistEndpoint**
> RipsAdminApplicationDTOsSpecialistDto ripsAdminPresentationEndpointsSpecialistsCreateSpecialistEndpoint(ripsAdminApplicationDTOsCreateSpecialistRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateSpecialistRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsCreateSpecialistRequestDto: RipsAdminApplicationDTOsCreateSpecialistRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSpecialistsCreateSpecialistEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsCreateSpecialistRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateSpecialistRequestDto** | **RipsAdminApplicationDTOsCreateSpecialistRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSpecialistDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSpecialistsGetSpecialistEndpoint**
> RipsAdminApplicationDTOsSpecialistDto ripsAdminPresentationEndpointsSpecialistsGetSpecialistEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let specialistId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSpecialistsGetSpecialistEndpoint(
    workspaceId,
    specialistId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|
| **specialistId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSpecialistDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSpecialistsListSpecialistsEndpoint**
> Array<RipsAdminApplicationDTOsSpecialistDto> ripsAdminPresentationEndpointsSpecialistsListSpecialistsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSpecialistsListSpecialistsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsSpecialistDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsSpecialistsUpdateSpecialistEndpoint**
> RipsAdminApplicationDTOsSpecialistDto ripsAdminPresentationEndpointsSpecialistsUpdateSpecialistEndpoint(ripsAdminApplicationDTOsUpdateSpecialistRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsUpdateSpecialistRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let specialistId: string; // (default to undefined)
let ripsAdminApplicationDTOsUpdateSpecialistRequestDto: RipsAdminApplicationDTOsUpdateSpecialistRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsSpecialistsUpdateSpecialistEndpoint(
    workspaceId,
    specialistId,
    ripsAdminApplicationDTOsUpdateSpecialistRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsUpdateSpecialistRequestDto** | **RipsAdminApplicationDTOsUpdateSpecialistRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **specialistId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsSpecialistDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |
|**409** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint**
> RipsAdminApplicationDTOsUserWorkspaceDto ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint(ripsAdminApplicationDTOsAddUserToWorkspaceRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsAddUserToWorkspaceRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let ripsAdminApplicationDTOsAddUserToWorkspaceRequestDto: RipsAdminApplicationDTOsAddUserToWorkspaceRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesAddUserToWorkspaceEndpoint(
    workspaceId,
    ripsAdminApplicationDTOsAddUserToWorkspaceRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsAddUserToWorkspaceRequestDto** | **RipsAdminApplicationDTOsAddUserToWorkspaceRequestDto**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsUserWorkspaceDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesCreateWorkspaceEndpoint**
> RipsAdminApplicationDTOsTenantDto ripsAdminPresentationEndpointsWorkspacesCreateWorkspaceEndpoint(ripsAdminApplicationDTOsCreateTenantRequestDto)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminApplicationDTOsCreateTenantRequestDto
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let ripsAdminApplicationDTOsCreateTenantRequestDto: RipsAdminApplicationDTOsCreateTenantRequestDto; //

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesCreateWorkspaceEndpoint(
    ripsAdminApplicationDTOsCreateTenantRequestDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminApplicationDTOsCreateTenantRequestDto** | **RipsAdminApplicationDTOsCreateTenantRequestDto**|  | |


### Return type

**RipsAdminApplicationDTOsTenantDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesGetUserWorkspacesEndpoint**
> Array<RipsAdminApplicationDTOsUserWorkspaceDto> ripsAdminPresentationEndpointsWorkspacesGetUserWorkspacesEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesGetUserWorkspacesEndpoint();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<RipsAdminApplicationDTOsUserWorkspaceDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint**
> RipsAdminApplicationDTOsWorkspaceDetailsDto ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceDetailsEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsWorkspaceDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint**
> Array<RipsAdminApplicationDTOsWorkspaceUserDto> ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesGetWorkspaceUsersEndpoint(
    workspaceId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **workspaceId** | [**string**] |  | defaults to undefined|


### Return type

**Array<RipsAdminApplicationDTOsWorkspaceUserDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ripsAdminPresentationEndpointsWorkspacesListWorkspacesEndpoint**
> Array<RipsAdminApplicationDTOsTenantDto> ripsAdminPresentationEndpointsWorkspacesListWorkspacesEndpoint()


### Example

```typescript
import {
    ApiApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

const { status, data } = await apiInstance.ripsAdminPresentationEndpointsWorkspacesListWorkspacesEndpoint();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<RipsAdminApplicationDTOsTenantDto>**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateInvoiceDraftRips**
> RipsAdminApplicationDTOsInvoiceDraftDetailsDto updateInvoiceDraftRips(ripsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest)


### Example

```typescript
import {
    ApiApi,
    Configuration,
    RipsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ApiApi(configuration);

let workspaceId: string; // (default to undefined)
let draftId: string; // (default to undefined)
let ripsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest: RipsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest; //

const { status, data } = await apiInstance.updateInvoiceDraftRips(
    workspaceId,
    draftId,
    ripsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ripsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest** | **RipsAdminPresentationEndpointsInvoiceUpdateInvoiceDraftRipsRequest**|  | |
| **workspaceId** | [**string**] |  | defaults to undefined|
| **draftId** | [**string**] |  | defaults to undefined|


### Return type

**RipsAdminApplicationDTOsInvoiceDraftDetailsDto**

### Authorization

[JWTBearerAuth](../README.md#JWTBearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, application/problem+json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**403** | Forbidden |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

