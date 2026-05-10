# ConfigurationApi

All URIs are relative to *http://localhost:5100*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint**](#ripsadminpresentationendpointsconfiggetfrontendconfigendpoint) | **GET** /api/config/frontend | |

# **ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint**
> RipsAdminPresentationEndpointsConfigFrontendConfigResponse ripsAdminPresentationEndpointsConfigGetFrontendConfigEndpoint()


### Example

```typescript
import {
    ConfigurationApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ConfigurationApi(configuration);

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

