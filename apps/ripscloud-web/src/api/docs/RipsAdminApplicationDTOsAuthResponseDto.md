# RipsAdminApplicationDTOsAuthResponseDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**success** | **boolean** |  | [optional] [default to undefined]
**message** | **string** |  | [optional] [default to undefined]
**token** | **string** |  | [optional] [default to undefined]
**refreshToken** | **string** |  | [optional] [default to undefined]
**expiresAt** | **string** |  | [optional] [default to undefined]
**user** | [**RipsAdminApplicationDTOsUserResponseDto**](RipsAdminApplicationDTOsUserResponseDto.md) |  | [optional] [default to undefined]
**workspaces** | [**Array&lt;RipsAdminApplicationDTOsWorkspaceClaimDto&gt;**](RipsAdminApplicationDTOsWorkspaceClaimDto.md) |  | [optional] [default to undefined]
**errors** | **Array&lt;string&gt;** |  | [optional] [default to undefined]

## Example

```typescript
import { RipsAdminApplicationDTOsAuthResponseDto } from './api';

const instance: RipsAdminApplicationDTOsAuthResponseDto = {
    success,
    message,
    token,
    refreshToken,
    expiresAt,
    user,
    workspaces,
    errors,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
