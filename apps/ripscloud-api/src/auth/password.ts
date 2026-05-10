const PASSWORD_ITERATIONS = 210_000;
const textEncoder = new TextEncoder();
type PbkdfHash = "SHA-1" | "SHA-256" | "SHA-512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2-sha256$${PASSWORD_ITERATIONS}$${base64UrlEncode(salt)}$${base64UrlEncode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith("pbkdf2-sha256$")) return verifyAspNetIdentityPassword(password, stored);

  const [algorithm, iterationsValue, saltValue, hashValue] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || !iterationsValue || !saltValue || !hashValue) return false;
  const iterations = Number.parseInt(iterationsValue, 10);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;
  const salt = base64UrlDecode(saltValue);
  const expected = base64UrlDecode(hashValue);
  const actual = await pbkdf2(password, salt, iterations);
  return constantTimeBytesEqual(actual, expected);
}

async function verifyAspNetIdentityPassword(password: string, stored: string): Promise<boolean> {
  const bytes = base64Decode(stored);
  if (!bytes || bytes.length < 49) return false;

  if (bytes[0] === 0) {
    const salt = bytes.slice(1, 17);
    const expected = bytes.slice(17);
    const actual = await pbkdf2(password, salt, 1_000, "SHA-1", expected.length * 8);
    return constantTimeBytesEqual(actual, expected);
  }

  if (bytes[0] !== 1 || bytes.length < 14) return false;

  const prf = readNetworkByteOrder(bytes, 1);
  const iterations = readNetworkByteOrder(bytes, 5);
  const saltLength = readNetworkByteOrder(bytes, 9);
  const saltStart = 13;
  const saltEnd = saltStart + saltLength;
  if (!Number.isFinite(iterations) || iterations < 1 || saltLength < 16 || bytes.length <= saltEnd) {
    return false;
  }

  const hash = aspNetPrfHash(prf);
  if (!hash) return false;

  const salt = bytes.slice(saltStart, saltEnd);
  const expected = bytes.slice(saltEnd);
  const actual = await pbkdf2(password, salt, iterations, hash, expected.length * 8);
  return constantTimeBytesEqual(actual, expected);
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
  hash: PbkdfHash = "SHA-256",
  length = 256,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash, salt, iterations },
    key,
    length,
  );
  return new Uint8Array(bits);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Decode(value: string): Uint8Array | null {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function readNetworkByteOrder(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  ) >>> 0;
}

function aspNetPrfHash(prf: number): PbkdfHash | null {
  if (prf === 0) return "SHA-1";
  if (prf === 1) return "SHA-256";
  if (prf === 2) return "SHA-512";
  return null;
}

function constantTimeBytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}
