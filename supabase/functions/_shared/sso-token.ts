/**
 * Shared utilities for SSO token generation and validation
 */

// Helper function to create HMAC signature
export async function createHmacSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = new Uint8Array(signature);
  
  // Convert to base64url
  return btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper function to verify HMAC signature
export async function verifyHmacSignature(
  message: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await createHmacSignature(message, secret);
  return signature === expectedSignature;
}

// Create signed JWT-like token
export async function createSignedToken(payload: any, secret: string): Promise<string> {
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Base64url encode header and payload
  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Create signature
  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const signature = await createHmacSignature(dataToSign, secret);
  
  // Return complete token
  return `${dataToSign}.${signature}`;
}

// Verify and decode signed token
export async function verifyAndDecodeToken(token: string, secret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;
    
    // Verify signature
    const isValid = await verifyHmacSignature(dataToVerify, signature, secret);
    if (!isValid) {
      console.error('Invalid token signature');
      return null;
    }
    
    // Decode payload
    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('Token has expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
