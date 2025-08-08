# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 6.x.x   | :white_check_mark: |
| < 6.0   | :x:                |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to security@netskope.com. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all still-supported versions.
4. Release new versions of all supported packages.
5. Announce the problem on our security mailing list.

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a pull request.

## Security Best Practices

### API Key Management

1. Never commit API keys to source control
2. Rotate API keys regularly
3. Use environment variables for sensitive data
4. Implement key expiration
5. Monitor key usage

Example:
```typescript
// Bad
const API_KEY = "sk_live_123...";

// Good
const API_KEY = process.env.NETSKOPE_API_KEY;
if (!API_KEY) {
  throw new Error("NETSKOPE_API_KEY environment variable is required");
}
```

### Input Validation

1. Validate all input parameters
2. Use TypeScript types and Zod schemas
3. Sanitize user input
4. Implement request rate limiting
5. Add request size limits

Example:
```typescript
import { z } from "zod";

const PublisherSchema = z.object({
  name: z.string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9-_]+$/),
  description: z.string().optional(),
  enabled: z.boolean().default(true)
});

type Publisher = z.infer<typeof PublisherSchema>;
```

### Error Handling

1. Don't expose internal errors
2. Log security events
3. Implement proper error responses
4. Use custom error types
5. Add error tracking

Example:
```typescript
class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

try {
  // Operation that might fail
} catch (error) {
  if (error instanceof SecurityError) {
    logger.error("Security violation", {
      code: error.code,
      message: error.message
    });
    // Handle security error
  }
  // Handle other errors
}
```

### Authentication & Authorization

1. Use secure session management
2. Implement proper access controls
3. Add request signing
4. Use secure headers
5. Enable audit logging

Example:
```typescript
async function validateRequest(req: Request) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    throw new SecurityError(
      "Missing API key",
      "MISSING_API_KEY"
    );
  }

  const signature = req.headers["x-signature"];
  if (!signature) {
    throw new SecurityError(
      "Missing request signature",
      "MISSING_SIGNATURE"
    );
  }

  if (!validateSignature(req.body, signature)) {
    throw new SecurityError(
      "Invalid request signature",
      "INVALID_SIGNATURE"
    );
  }
}
```

### Data Protection

1. Use HTTPS for all requests
2. Implement proper data encryption
3. Add secure headers
4. Enable audit logging
5. Implement data retention policies

Example:
```typescript
import { createHash } from "crypto";

function hashSensitiveData(data: string): string {
  return createHash("sha256")
    .update(data)
    .digest("hex");
}

const sensitiveData = "user-data";
const hashedData = hashSensitiveData(sensitiveData);
```

### Network Security

1. Use HTTPS
2. Enable CORS properly
3. Set secure headers
4. Implement rate limiting
5. Add IP filtering

Example:
```typescript
import helmet from "helmet";
import rateLimit from "express-rate-limit";

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### Dependency Security

1. Keep dependencies updated
2. Use dependency scanning
3. Implement lockfiles
4. Review security advisories
5. Use trusted packages

Example:
```json
{
  "scripts": {
    "audit": "npm audit",
    "outdated": "npm outdated",
    "update": "npm update",
    "security-check": "npm run audit && npm run outdated"
  }
}
```

## Security Checklist

### Development

- [ ] Use TypeScript with strict mode
- [ ] Implement proper error handling
- [ ] Add input validation
- [ ] Use secure dependencies
- [ ] Enable linting rules

### API Security

- [ ] Validate API keys
- [ ] Implement rate limiting
- [ ] Add request signing
- [ ] Use HTTPS
- [ ] Enable CORS properly

### Data Protection

- [ ] Encrypt sensitive data
- [ ] Implement access controls
- [ ] Add audit logging
- [ ] Use secure headers
- [ ] Set up monitoring

### Testing

- [ ] Add security tests
- [ ] Test error cases
- [ ] Validate input handling
- [ ] Check rate limiting
- [ ] Test authentication

## Contact

Please contact us at security@netskope.com for any security-related questions or concerns.
