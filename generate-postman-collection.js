import fs from 'fs';

const collection = {
  info: {
    name: "Voclio Complete API Collection 2026",
    description: "Complete API collection for Voclio - Voice Notes & Task Management System",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    version: "2.0.0"
  },
  variable: [
    {
      key: "baseUrl",
      value: "http://localhost:3001/api",
      type: "string"
    },
    {
      key: "token",
      value: "",
      type: "string"
    }
  ],
  item: [
    {
      name: "Health & Info",
      item: [
        {
          name: "Health Check",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/health",
              host: ["{{baseUrl}}"],
              path: ["health"]
            }
          }
        },
        {
          name: "API Info",
          request: {
            method: "GET",
            header: [],
            url: {
              raw: "{{baseUrl}}/",
              host: ["{{baseUrl}}"],
              path: [""]
            }
          }
        }
      ]
    },
    {
      name: "Authentication",
      item: [
        {
          name: "Register",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "if (pm.response.code === 201) {",
                  "    var jsonData = pm.response.json();",
                  "    pm.environment.set('token', jsonData.data.tokens.access_token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "user@example.com",
                password: "password123",
                name: "Test User",
                phone_number: "+1234567890"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/register",
              host: ["{{baseUrl}}"],
              path: ["auth", "register"]
            }
          }
        },
        {
          name: "Login",
          event: [
            {
              listen: "test",
              script: {
                exec: [
                  "if (pm.response.code === 200) {",
                  "    var jsonData = pm.response.json();",
                  "    pm.environment.set('token', jsonData.data.tokens.access_token);",
                  "    pm.environment.set('refresh_token', jsonData.data.tokens.refresh_token);",
                  "}"
                ]
              }
            }
          ],
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "user@example.com",
                password: "password123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/login",
              host: ["{{baseUrl}}"],
              path: ["auth", "login"]
            }
          }
        },
        {
          name: "Get Profile",
          request: {
            method: "GET",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: {
              raw: "{{baseUrl}}/auth/profile",
              host: ["{{baseUrl}}"],
              path: ["auth", "profile"]
            }
          }
        },
        {
          name: "Update Profile",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Updated Name",
                phone_number: "+9876543210"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/profile",
              host: ["{{baseUrl}}"],
              path: ["auth", "profile"]
            }
          }
        },
        {
          name: "Refresh Token",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                refresh_token: "{{refresh_token}}"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/refresh-token",
              host: ["{{baseUrl}}"],
              path: ["auth", "refresh-token"]
            }
          }
        },
        {
          name: "Send OTP",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "user@example.com",
                type: "login"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/send-otp",
              host: ["{{baseUrl}}"],
              path: ["auth", "send-otp"]
            }
          }
        },
        {
          name: "Verify OTP",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "user@example.com",
                otp_code: "123456",
                type: "login"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/verify-otp",
              host: ["{{baseUrl}}"],
              path: ["auth", "verify-otp"]
            }
          }
        },
        {
          name: "Forgot Password",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                email: "user@example.com"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/forgot-password",
              host: ["{{baseUrl}}"],
              path: ["auth", "forgot-password"]
            }
          }
        },
        {
          name: "Reset Password",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                token: "reset_token_here",
                new_password: "newpassword123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/reset-password",
              host: ["{{baseUrl}}"],
              path: ["auth", "reset-password"]
            }
          }
        },
        {
          name: "Change Password",
          request: {
            method: "PUT",
            header: [
              { key: "Authorization", value: "Bearer {{token}}" },
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                current_password: "password123",
                new_password: "newpassword123"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/change-password",
              host: ["{{baseUrl}}"],
              path: ["auth", "change-password"]
            }
          }
        },
        {
          name: "Google Login",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                id_token: "google_id_token_here"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/google",
              host: ["{{baseUrl}}"],
              path: ["auth", "google"]
            }
          }
        },
        {
          name: "Facebook Login",
          request: {
            method: "POST",
            header: [{ key: "Content-Type", value: "application/json" }],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                access_token: "facebook_access_token_here"
              }, null, 2)
            },
            url: {
              raw: "{{baseUrl}}/auth/facebook",
              host: ["{{baseUrl}}"],
              path: ["auth", "facebook"]
            }
          }
        },
        {
          name: "Logout",
          request: {
            method: "POST",
            header: [{ key: "Authorization", value: "Bearer {{token}}" }],
            url: {
              raw: "{{baseUrl}}/auth/logout",
              host: ["{{baseUrl}}"],
              path: ["auth", "logout"]
            }
          }
        }
      ]
    }
  ]
};

// Write to file
fs.writeFileSync(
  'Voclio_Complete_APIs_2026.postman_collection.json',
  JSON.stringify(collection, null, 2)
);

console.log('✅ Postman collection generated successfully!');
console.log('📁 File: Voclio_Complete_APIs_2026.postman_collection.json');
console.log('\n📝 Note: This is part 1 (Health & Auth). Run the script to generate full collection.');
