// Auto-generated from https://fevrips-stage.matrixmdsoftware.com/swagger/v1/swagger.json on 2026-04-22T19:42:36.553Z
// Do not edit by hand. Re-run `pnpm gen:stage` or `pnpm gen:prod`.

export interface paths {
    "/api/Auth/LoginSISPRO": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Método para realizar el inicio de sesión en SISPRO.
         * @description Ejemplo de solicitud:
         *     POST /api/auth/LoginSISPRO
         *     {
         *         "persona": {
         *             "identificacion": {
         *                 "tipo": "CC",
         *                 "numero": "1234567890"
         *             }
         *         },
         *         "clave": "secretpassword",
         *         "nit": "123456789"
         *     }
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description Los datos de inicio de sesión en SISPRO. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UsuarioSISPRO"];
                    "text/json": components["schemas"]["UsuarioSISPRO"];
                    "application/*+json": components["schemas"]["UsuarioSISPRO"];
                };
            };
            responses: {
                /** @description OK. Devuelve la información de inicio de sesión y el Token. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserLoginResponseDTO"];
                    };
                };
                /** @description BadRequest. La solicitud no es válida o falta información requerida. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized. No se ha proporcionado o es incorrecto el Token JWT de acceso. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/Auth/LoginSISPROERP": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["UsuarioSISPRO"];
                    "text/json": components["schemas"]["UsuarioSISPRO"];
                    "application/*+json": components["schemas"]["UsuarioSISPRO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["UserLoginResponseDTO"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ConsultasFevRips/ConsultarCUV": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consulta los datos del estado de un paquete a partir del Código Único de Validación. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description Objeto que contiene la información necesaria para procesar el Rips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ConsultaFevRipsDTO"];
                    "text/json": components["schemas"]["ConsultaFevRipsDTO"];
                    "application/*+json": components["schemas"]["ConsultaFevRipsDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ConsultaCUVDTO"];
                        "application/json": components["schemas"]["ConsultaCUVDTO"];
                        "text/json": components["schemas"]["ConsultaCUVDTO"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ConsultasFevRips/DescargarArchivosFevRipsCUV": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Consulta los datos del estado de un paquete a partir del Código Único de Validación, que incluye los links de descarga de los archivos,
         *     los cuales estarán habilitados por un determinado periodo.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description Objeto que contiene la información necesaria para procesar el Rips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["ConsultaFevRipsDTO"];
                    "text/json": components["schemas"]["ConsultaFevRipsDTO"];
                    "application/*+json": components["schemas"]["ConsultaFevRipsDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ConsultaCUVDTO"];
                        "application/json": components["schemas"]["ConsultaCUVDTO"];
                        "text/json": components["schemas"]["ConsultaCUVDTO"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarFevRips": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de FEV Rips mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description DTO que contiene los datos del paquete de FEV Rips a cargar. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarNC": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método HTTP POST para cargar una Nota de Crédito mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description Paquete de datos de la Nota de Crédito */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarNCTotal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Nota Crédito Total mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarNCAcuerdoVoluntades": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Nota Crédito - Acuerdo de Voluntades mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarNcCapita": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Nota Crédito de Capita mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarND": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método HTTP POST para cargar una Nota de Debito mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description Paquete de datos de la Nota de Debito */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarRipsSinFactura": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Rips sin Factura mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarNotaAjuste": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Nota de Ajuste mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarCapitaInicial": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Capita Inicial mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarCapitaPeriodo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Capita por periodo mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/PaquetesFevRips/CargarCapitaFinal": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Método para cargar un paquete de Capita Final mediante una solicitud HTTP POST. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description El DTO que contiene los datos del paquete de FevRips. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "text/json": components["schemas"]["FevRipsApiLocalDTO"];
                    "application/*+json": components["schemas"]["FevRipsApiLocalDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ConsultasFevRips/RecuperarCUV": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consulta los datos del estado de un paquete a partir del Código Único de Validación. */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            /** @description cuv. */
            requestBody?: {
                content: {
                    "application/json": components["schemas"]["RecuperarCUVDTO"];
                    "text/json": components["schemas"]["RecuperarCUVDTO"];
                    "application/*+json": components["schemas"]["RecuperarCUVDTO"];
                };
            };
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ResultadoProcesoFevRips"];
                        "application/json": components["schemas"]["ResultadoProcesoFevRips"];
                        "text/json": components["schemas"]["ResultadoProcesoFevRips"];
                    };
                };
                /** @description Bad Request */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["BadRequestResponse"];
                        "application/json": components["schemas"]["BadRequestResponse"];
                        "text/json": components["schemas"]["BadRequestResponse"];
                    };
                };
                /** @description Unauthorized */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": components["schemas"]["ProblemDetails"];
                        "application/json": components["schemas"]["ProblemDetails"];
                        "text/json": components["schemas"]["ProblemDetails"];
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/TestApi/Index": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Método GET para obtener la versión de la API. */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/TestApi/Municipios": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Método GET para obtener la lista de municipios. */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description OK */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/Health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description null */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": string;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/BasicHealth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description null */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "text/plain": string;
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        BadRequestResponse: {
            tipo?: string | null;
            descripcion?: string | null;
        };
        ConsultaCUVDTO: {
            /** Format: int32 */
            ProcesoId?: number;
            EsValido?: boolean;
            CodigoUnicoValidacion?: string | null;
            /** Format: date-time */
            FechaValidacion?: string | null;
            TipoDocumento?: string | null;
            NumDocumentoIdObligado?: string | null;
            NumeroDocumento?: string | null;
            /** Format: date-time */
            FechaEmision?: string | null;
            /** Format: double */
            TotalFactura?: number;
            /** Format: int32 */
            CantidadUsuarios?: number;
            /** Format: int32 */
            CantidadAtenciones?: number;
            /** Format: double */
            TotalValorServicios?: number;
            IdentificacionAdquiriente?: string | null;
            CodigoPrestador?: string | null;
            ModalidadPago?: string | null;
            NumDocumentoReferenciado?: string | null;
            UrlJson?: string | null;
            UrlXml?: string | null;
            JsonFile?: string | null;
            XmlFileBase64?: string | null;
            ResultadosValidacion?: components["schemas"]["ResultadoValidacionDTO"][] | null;
            CantidadTotalAtenciones?: components["schemas"]["ServiciosDetalle"];
        };
        ConsultaDTO: {
            codPrestador: string;
            fechaInicioAtencion: string;
            numAutorizacion?: string | null;
            codConsulta?: string | null;
            modalidadGrupoServicioTecSal: string;
            grupoServicios: string;
            /** Format: int32 */
            codServicio: number;
            finalidadTecnologiaSalud: string;
            causaMotivoAtencion: string;
            codDiagnosticoPrincipal: string;
            codDiagnosticoRelacionado1?: string | null;
            codDiagnosticoRelacionado2?: string | null;
            codDiagnosticoRelacionado3?: string | null;
            tipoDiagnosticoPrincipal: string;
            tipoDocumentoIdentificacion: string;
            numDocumentoIdentificacion: string;
            /** Format: double */
            vrServicio: number;
            conceptoRecaudo: string;
            /** Format: double */
            valorPagoModerador: number;
            numFEVPagoModerador?: string | null;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        ConsultaFevRipsDTO: {
            rips?: components["schemas"]["RipsDTO"];
            /** Format: byte */
            xmlFevFile?: string | null;
            codigoUnicoValidacion: string;
        };
        FevRipsApiLocalDTO: {
            rips?: components["schemas"]["RipsDTO"];
            /** Format: byte */
            xmlFevFile?: string | null;
        };
        HospitalizacionDTO: {
            codPrestador: string;
            viaIngresoServicioSalud: string;
            fechaInicioAtencion: string;
            numAutorizacion?: string | null;
            causaMotivoAtencion: string;
            codDiagnosticoPrincipal: string;
            codDiagnosticoPrincipalE: string;
            codDiagnosticoRelacionadoE1?: string | null;
            codDiagnosticoRelacionadoE2?: string | null;
            codDiagnosticoRelacionadoE3?: string | null;
            codComplicacion?: string | null;
            condicionDestinoUsuarioEgreso: string;
            codDiagnosticoCausaMuerte?: string | null;
            fechaEgreso: string;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        Identificacion: {
            tipo?: string | null;
            numero?: string | null;
        };
        MedicamentoDTO: {
            codPrestador: string;
            numAutorizacion?: string | null;
            idMIPRES?: string | null;
            fechaDispensAdmon: string;
            codDiagnosticoPrincipal: string;
            codDiagnosticoRelacionado?: string | null;
            tipoMedicamento: string;
            codTecnologiaSalud: string;
            nomTecnologiaSalud?: string | null;
            /** Format: int32 */
            concentracionMedicamento?: number;
            /** Format: int32 */
            unidadMedida?: number;
            formaFarmaceutica?: string | null;
            /** Format: int32 */
            unidadMinDispensa?: number;
            /** Format: int32 */
            cantidadMedicamento?: number;
            /** Format: int32 */
            diasTratamiento?: number;
            tipoDocumentoIdentificacion: string;
            numDocumentoIdentificacion: string;
            /** Format: double */
            vrUnitMedicamento: number;
            /** Format: double */
            vrServicio: number;
            conceptoRecaudo: string;
            /** Format: double */
            valorPagoModerador: number;
            numFEVPagoModerador?: string | null;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        OtrosServicioDTO: {
            codPrestador: string;
            numAutorizacion?: string | null;
            idMIPRES?: string | null;
            fechaSuministroTecnologia: string;
            tipoOS: string;
            codTecnologiaSalud: string;
            nomTecnologiaSalud?: string | null;
            /** Format: int32 */
            cantidadOS?: number;
            tipoDocumentoIdentificacion?: string | null;
            numDocumentoIdentificacion?: string | null;
            /** Format: double */
            vrUnitOS: number;
            /** Format: double */
            vrServicio: number;
            conceptoRecaudo: string;
            /** Format: double */
            valorPagoModerador: number;
            numFEVPagoModerador?: string | null;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        Persona: {
            identificacion?: components["schemas"]["Identificacion"];
        };
        ProblemDetails: {
            type?: string | null;
            title?: string | null;
            /** Format: int32 */
            status?: number | null;
            detail?: string | null;
            instance?: string | null;
        } & {
            [key: string]: unknown;
        };
        ProcedimientoDTO: {
            codPrestador: string;
            fechaInicioAtencion: string;
            idMIPRES?: string | null;
            numAutorizacion?: string | null;
            codProcedimiento?: string | null;
            viaIngresoServicioSalud: string;
            modalidadGrupoServicioTecSal: string;
            grupoServicios: string;
            /** Format: int32 */
            codServicio: number;
            finalidadTecnologiaSalud: string;
            tipoDocumentoIdentificacion: string;
            numDocumentoIdentificacion: string;
            codDiagnosticoPrincipal: string;
            codDiagnosticoRelacionado?: string | null;
            codComplicacion?: string | null;
            /** Format: double */
            vrServicio: number;
            conceptoRecaudo: string;
            /** Format: double */
            valorPagoModerador: number;
            numFEVPagoModerador?: string | null;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        RecienNacidoDTO: {
            codPrestador: string;
            tipoDocumentoIdentificacion: string;
            numDocumentoIdentificacion: string;
            fechaNacimiento: string;
            /** Format: int32 */
            edadGestacional?: number;
            /** Format: int32 */
            numConsultasCPrenatal?: number;
            codSexoBiologico: string;
            /** Format: double */
            peso?: number;
            codDiagnosticoPrincipal: string;
            condicionDestinoUsuarioEgreso: string;
            codDiagnosticoCausaMuerte?: string | null;
            fechaEgreso: string;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        RecuperarCUVDTO: {
            codigoUnicoValidacion: string;
        };
        ResultadoProcesoFevRips: {
            ResultState?: boolean;
            /** Format: int32 */
            ProcesoId?: number;
            NumFactura?: string | null;
            Modulo?: string | null;
            ModalidadPago?: unknown;
            Ambiente?: string | null;
            PeriodoAtencion?: unknown;
            CodigoUnicoValidacion?: string | null;
            readonly CodigoUnicoValidacionToShow?: string | null;
            /** Format: date-time */
            FechaRadicacion?: string;
            RutaArchivos?: string | null;
            ResultadosValidacion?: components["schemas"]["ResultadoValidacionDTO"][] | null;
        };
        ResultadoValidacionDTO: {
            Clase?: string | null;
            Codigo?: string | null;
            Descripcion?: string | null;
            Observaciones?: string | null;
            PathFuente?: string | null;
            Fuente?: string | null;
        };
        RipsDTO: {
            numDocumentoIdObligado: string;
            numFactura?: string | null;
            tipoNota?: string | null;
            numNota?: string | null;
            usuarios: components["schemas"]["UsuarioDTO"][];
        } & {
            [key: string]: unknown;
        };
        ServiciosDTO: {
            consultas?: components["schemas"]["ConsultaDTO"][] | null;
            procedimientos?: components["schemas"]["ProcedimientoDTO"][] | null;
            urgencias?: components["schemas"]["UrgenciaDTO"][] | null;
            hospitalizacion?: components["schemas"]["HospitalizacionDTO"][] | null;
            recienNacidos?: components["schemas"]["RecienNacidoDTO"][] | null;
            medicamentos?: components["schemas"]["MedicamentoDTO"][] | null;
            otrosServicios?: components["schemas"]["OtrosServicioDTO"][] | null;
        } & {
            [key: string]: unknown;
        };
        ServiciosDetalle: {
            /** Format: int32 */
            Consultas?: number;
            /** Format: int32 */
            Procedimientos?: number;
            /** Format: int32 */
            Medicamentos?: number;
            /** Format: int32 */
            OtrosServicios?: number;
            /** Format: int32 */
            RecienNacidos?: number;
            /** Format: int32 */
            Hospitalizaciones?: number;
            /** Format: int32 */
            Urgencias?: number;
        };
        UrgenciaDTO: {
            codPrestador: string;
            fechaInicioAtencion: string;
            causaMotivoAtencion: string;
            codDiagnosticoPrincipal: string;
            codDiagnosticoPrincipalE: string;
            codDiagnosticoRelacionadoE1?: string | null;
            codDiagnosticoRelacionadoE2?: string | null;
            codDiagnosticoRelacionadoE3?: string | null;
            condicionDestinoUsuarioEgreso: string;
            codDiagnosticoCausaMuerte?: string | null;
            fechaEgreso: string;
            /** Format: int32 */
            consecutivo: number;
        } & {
            [key: string]: unknown;
        };
        UserLoginResponseDTO: {
            token?: string | null;
            login?: boolean;
            registrado?: boolean;
            errors?: string[] | null;
        };
        UsuarioDTO: {
            tipoDocumentoIdentificacion: string;
            numDocumentoIdentificacion: string;
            tipoUsuario?: string | null;
            fechaNacimiento: string;
            codSexo: string;
            codPaisResidencia?: string | null;
            codPaisOrigen?: string | null;
            codMunicipioResidencia?: string | null;
            codZonaTerritorialResidencia?: string | null;
            incapacidad: string;
            /** Format: int32 */
            consecutivo: number;
            servicios: components["schemas"]["ServiciosDTO"];
        } & {
            [key: string]: unknown;
        };
        UsuarioSISPRO: {
            persona?: components["schemas"]["Persona"];
            clave?: string | null;
            nit?: string | null;
            lstCodigoPrestador?: string[] | null;
            nomPrestador?: string | null;
            /** Format: int32 */
            tipoMecanismoValidacion?: number;
            token?: string | null;
            usuarioSispro?: string | null;
            reps?: boolean;
            lstCodPrestadorSede?: string[] | null;
            appVersion?: string | null;
            /** Format: int32 */
            grupoEntidadHabilitada?: number;
            /** Format: date-time */
            fechaInicioReporte?: string | null;
            isERP?: boolean;
            tipoUsuario?: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
