# SSO Token System

## Overview

This system provides secure JWT-like token generation and validation for AmoCRM SSO integration using HMAC-SHA256 signatures.

## Architecture

### Token Structure

The tokens follow the JWT format with three parts separated by dots:

```
<header>.<payload>.<signature>
```

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDk4MTI4MDAsImV4cCI6MTcwOTgxNjQwMCwic3ViIjoiMTIzNDU2Nzg5MCIsImFjY2Vzc190b2tlbiI6Ii4uLiJ9.abc123def456...
```

### Payload Structure

```typescript
{
  // Standard JWT claims
  iat: number;           // Issued at (Unix timestamp)
  exp: number;           // Expires at (Unix timestamp)
  sub: string;           // Subject (Supabase user ID)
  
  // Supabase session data
  access_token: string;  // Supabase access token
  refresh_token: string; // Supabase refresh token
  expires_in: number;    // Token lifetime in seconds
  token_type: string;    // Usually "bearer"
  
  // AmoCRM metadata
  amocrm_account_id: string;  // AmoCRM account ID
  amocrm_user_id: string;     // AmoCRM user ID
  amocrm_subdomain: string | null; // AmoCRM subdomain
}
```

## Usage

### 1. Token Generation (amocrm-sso-login)

**Endpoint:** `POST /functions/v1/amocrm-sso-login`

**Request:**
```json
{
  "source": "amocrm",
  "account_id": "12345",
  "user_id": "67890",
  "subdomain": "example"
}
```

**Response:**
```json
{
  "token": "eyJhbGci...",
  "expires_at": 1709816400,
  "expires_in": 3600
}
```

### 2. Token Verification (amocrm-sso-verify)

**Endpoint:** `POST /functions/v1/amocrm-sso-verify`

**Request:**
```json
{
  "token": "eyJhbGci..."
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "payload": {
    "user_id": "...",
    "amocrm_account_id": "12345",
    "amocrm_user_id": "67890",
    "amocrm_subdomain": "example",
    "expires_at": 1709816400,
    "issued_at": 1709812800
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

## Security

### HMAC-SHA256 Signature

- Uses `AMOCRM_SSO_SECRET` environment variable as signing key
- Prevents token tampering
- Signature is verified on every token validation

### Token Expiration

- Tokens automatically expire based on Supabase session lifetime
- Default: 3600 seconds (1 hour)
- Expired tokens are rejected during verification

### Best Practices

1. **Keep secret secure**: Never expose `AMOCRM_SSO_SECRET`
2. **Use HTTPS**: Always transmit tokens over encrypted connections
3. **Validate on server**: Never trust client-side token validation
4. **Handle expiration**: Implement token refresh logic

## Implementation in Other Functions

```typescript
import { verifyAndDecodeToken } from '../_shared/sso-token.ts';

// Verify token
const amoSecret = Deno.env.get("AMOCRM_SSO_SECRET");
const payload = await verifyAndDecodeToken(token, amoSecret);

if (!payload) {
  // Token is invalid or expired
  return errorResponse("Invalid token");
}

// Token is valid, use payload data
const userId = payload.sub;
const amocrmAccountId = payload.amocrm_account_id;
```

## Error Handling

### Common Errors

1. **Invalid token format**
   - Token doesn't have 3 parts
   - Solution: Ensure token is properly formatted

2. **Invalid signature**
   - Token has been tampered with
   - Secret mismatch
   - Solution: Regenerate token

3. **Token expired**
   - `exp` claim is in the past
   - Solution: Request new token

4. **Missing configuration**
   - `AMOCRM_SSO_SECRET` not set
   - Solution: Set environment variable

## Testing

### Manual Testing

```bash
# Generate token
curl -X POST https://your-project.supabase.co/functions/v1/amocrm-sso-login \
  -H "Content-Type: application/json" \
  -d '{
    "source": "amocrm",
    "account_id": "12345",
    "user_id": "67890",
    "subdomain": "test"
  }'

# Verify token
curl -X POST https://your-project.supabase.co/functions/v1/amocrm-sso-verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGci..."
  }'
```

## Migration Notes

### From Old System (Base64)

The old system used simple base64 encoding:
```typescript
const token = btoa(JSON.stringify(payload));
```

### To New System (HMAC-SHA256)

The new system uses signed tokens:
```typescript
const token = await createSignedToken(payload, secret);
```

**Benefits:**
- Tamper-proof signatures
- Standard JWT format
- Better security
- Easier to integrate with third-party tools

## Environment Variables

```bash
# Required
AMOCRM_SSO_SECRET=your-secure-random-string-min-32-chars

# Recommended: Generate with
openssl rand -base64 32
```

## Related Files

- `_shared/sso-token.ts` - Core token utilities
- `amocrm-sso-login/index.ts` - Token generation
- `amocrm-sso-verify/index.ts` - Token verification
