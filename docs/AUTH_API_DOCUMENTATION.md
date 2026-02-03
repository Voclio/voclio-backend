# Authentication API Documentation

This document provides comprehensive documentation for all authentication-related APIs in the Voclio application.

## Base URL
```
https://voclio-backend.build8.dev/api/auth
```

## Response Format

All API responses follow a standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": null
  }
}
```

## Authentication Endpoints

### 1. User Registration

**Endpoint:** `POST /register`

**Description:** Register a new user account. Sends OTP for email verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone_number": "+1234567890" // Optional
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required
- `name`: Non-empty string, required
- `phone_number`: Valid mobile phone format, optional

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration initiated. Please verify your email.",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "email_verified": false
    },
    "message": "Please verify your email with the OTP sent to complete registration."
  }
}
```

**Error Responses:**
- `409 Conflict`: Email already registered
- `400 Bad Request`: Validation errors

---

### 2. User Login

**Endpoint:** `POST /login`

**Description:** Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `password`: Non-empty, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_jwt_token",
      "expires_in": 86400
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Validation errors

---

### 3. Google OAuth Login

**Endpoint:** `POST /google`

**Description:** Authenticate user with Google ID token.

**Request Body:**
```json
{
  "id_token": "google_id_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "oauth_provider": "google"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_jwt_token",
      "expires_in": 86400
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid Google token
- `400 Bad Request`: Missing ID token

---

### 4. Facebook OAuth Login

**Endpoint:** `POST /facebook`

**Description:** Authenticate user with Facebook access token.

**Request Body:**
```json
{
  "access_token": "facebook_access_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Facebook login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "oauth_provider": "facebook"
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_jwt_token",
      "expires_in": 86400
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid Facebook token or email permission required
- `400 Bad Request`: Missing access token

---

### 5. Refresh Token

**Endpoint:** `POST /refresh-token`

**Description:** Generate new access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "refresh_jwt_token"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "new_jwt_token",
    "refresh_token": "new_refresh_jwt_token",
    "expires_in": 86400
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired refresh token
- `400 Bad Request`: Missing refresh token

---

### 6. Send OTP

**Endpoint:** `POST /send-otp`

**Description:** Send OTP for various purposes (registration, password reset, etc.).

**Request Body:**
```json
{
  "email": "user@example.com",
  "type": "registration" // or "password_reset", "login", "phone_verification"
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `type`: Must be one of: "login", "registration", "password_reset", "phone_verification"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "otp_id": "otp_uuid",
    "message": "OTP sent successfully. Please check your email.",
    "expires_in": 600,
    "otp_code": "123456" // Only in development mode
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Email service failure

---

### 7. Verify OTP

**Endpoint:** `POST /verify-otp`

**Description:** Verify OTP code for various purposes.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp_code": "123456",
  "type": "registration"
}
```

**Validation Rules:**
- `email`: Valid email format, required
- `otp_code`: 6-digit code, required
- `type`: Must be one of: "login", "registration", "password_reset", "phone_verification"

**Success Response for Registration (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "verified": true,
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "email_verified": true
    },
    "tokens": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_jwt_token",
      "expires_in": 86400
    },
    "message": "Email verified successfully. Welcome to Voclio!"
  }
}
```

**Success Response for Password Reset (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "verified": true,
    "reset_token": "reset_jwt_token",
    "message": "OTP verified successfully"
  }
}
```

**Success Response for Other Types (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "verified": true,
    "message": "OTP verified successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired OTP
- `404 Not Found`: User not found
- `400 Bad Request`: Validation errors

---

### 8. Resend OTP

**Endpoint:** `POST /resend-otp`

**Description:** Resend OTP code (invalidates previous codes).

**Request Body:**
```json
{
  "email": "user@example.com",
  "type": "registration"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "otp_id": "new_otp_uuid",
    "message": "New OTP sent successfully. Previous codes have been invalidated.",
    "expires_in": 600,
    "otp_code": "654321" // Only in development mode
  }
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `500 Internal Server Error`: Email service failure

---

### 9. Forgot Password

**Endpoint:** `POST /forgot-password`

**Description:** Initiate password reset process by sending OTP.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "data": null
}
```

**Note:** Always returns success message for security (doesn't reveal if email exists).

---

### 10. Reset Password

**Endpoint:** `POST /reset-password`

**Description:** Reset password using reset token from verified OTP.

**Request Body:**
```json
{
  "token": "reset_jwt_token",
  "new_password": "newpassword123"
}
```

**Validation Rules:**
- `token`: Reset token from OTP verification, required
- `new_password`: Minimum 8 characters, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password.",
  "data": null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or expired reset token, or token already used
- `404 Not Found`: User not found
- `400 Bad Request`: Validation errors

---

## Protected Endpoints (Require Authentication)

### 11. Get Profile

**Endpoint:** `GET /profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "is_active": true,
      "oauth_provider": "google",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

### 12. Update Profile

**Endpoint:** `PUT /profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Jane Doe", // Optional
  "phone_number": "+0987654321" // Optional
}
```

**Validation Rules:**
- `name`: Non-empty string, optional
- `phone_number`: Valid mobile phone format, optional

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "Jane Doe",
      "phone_number": "+0987654321"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token
- `400 Bad Request`: Validation errors

---

### 13. Change Password

**Endpoint:** `PUT /change-password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

**Validation Rules:**
- `current_password`: Required
- `new_password`: Minimum 8 characters, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid token or incorrect current password
- `400 Bad Request`: Validation errors or OAuth account (no password)

---

### 14. Logout

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

---

## Security Features

### Token Management
- **Access Token**: JWT with 24-hour expiration
- **Refresh Token**: JWT with 7-day expiration, stored in database sessions
- **Reset Token**: Single-use JWT with 1-hour expiration for password reset

### OTP Security
- **6-digit codes**: Cryptographically secure random generation
- **10-minute expiration**: Automatic expiry for security
- **Single use**: OTPs are marked as verified after use
- **Invalidation**: Previous OTPs are invalidated when new ones are sent

### Password Security
- **bcrypt hashing**: Industry-standard password hashing
- **Minimum 8 characters**: Password complexity requirement
- **Session invalidation**: All sessions destroyed on password reset

### OAuth Integration
- **Google OAuth**: ID token verification
- **Facebook OAuth**: Access token verification
- **Account linking**: Existing accounts can be linked with OAuth providers

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED_ERROR` | Authentication failed |
| `NOT_FOUND_ERROR` | Resource not found |
| `CONFLICT_ERROR` | Resource already exists |
| `INTERNAL_ERROR` | Server error |

## Rate Limiting

- OTP endpoints have built-in protection against spam
- Previous OTPs are invalidated when new ones are requested
- Sessions are managed to prevent token abuse

## Development Notes

- In development mode, OTP codes are included in responses for testing
- Email service failures are logged but don't block registration in development
- All sensitive operations are logged for debugging