# FastEndpointsErrorResponse

the dto used to send an error response to the client

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**statusCode** | **number** | the http status code sent to the client. default is 400. | [optional] [default to 400]
**message** | **string** | the message for the error response | [optional] [default to 'One or more errors occurred!']
**errors** | **{ [key: string]: Array&lt;string&gt;; }** | the collection of errors for the current context | [optional] [default to undefined]

## Example

```typescript
import { FastEndpointsErrorResponse } from './api';

const instance: FastEndpointsErrorResponse = {
    statusCode,
    message,
    errors,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
