export interface SisproCredentials {
  persona: {
    identificacion: {
      tipo: string;
      numero: string;
    };
  };
  clave: string;
  nit: string;
}

export interface CredentialsProvider {
  resolve(tenantKey: string): Promise<SisproCredentials>;
}

export function staticCredentials(creds: SisproCredentials): CredentialsProvider {
  return {
    resolve: () => Promise.resolve(creds),
  };
}
