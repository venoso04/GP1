# GP1 – Educational Mobile App Backend

A Node.js/Express REST API backend for an educational mobile app. Students can sign up, verify their email, sign in, manage tasks with coin rewards, and summarize audio files using an AI-powered API.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Email:** Nodemailer (Gmail)
- **Audio Summarization:** Hugging Face Space API

---

## Project Structure

```
GP1/
├── db/
│   ├── connection.js          # MongoDB connection setup
│   └── models/
│       └── user.model.js      # User Mongoose model
├── modules/
│   └── auth/
│       ├── auth.controllers.js  # Signup, signin, verify account logic
│       └── auth.routes.js       # Auth route definitions
├── utils/
│   └── sendEmail.js           # Nodemailer email utility
├── middlewares/
│   └── auth.middleware.js     # JWT authentication & role guard
└── index.js                   # App entry point
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GMAIL_USER=your_gmail_address
GMAIL_PASSWORD=your_gmail_app_password
```

> **Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the server
node index.js
# Server runs on http://localhost:3001
```

---

## API Reference

### Base URL
```
http://localhost:3001
```

---

### Auth Routes — `/auth`

#### `POST /auth/sign-up`
Register a new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Responses:**
| Status | Meaning |
|--------|---------|
| `201` | Signed up successfully. Verification email sent. |
| `400` | Email already exists. |
| `500` | Email could not be sent. |

---

#### `POST /auth/sign-in`
Sign in with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Responses:**
| Status | Meaning |
|--------|---------|
| `200` | Returns a JWT token. |
| `400` | Invalid credentials, or email not verified yet. |

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5..."
}
```

---

#### `GET /auth/verify-account?token=<token>`
Verify a student's email address using the token sent in the verification email.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `token` | string | JWT token from the verification email |

**Responses:**
| Status | Meaning |
|--------|---------|
| `200` | Account verified successfully. |
| `400` | Token missing, expired, invalid, or account already verified. |
| `404` | User not found. |

---

### Authentication Middleware

Protected routes use the `auth` middleware. Pass the JWT token in the request headers:

```
Headers:
  token: <your_jwt_token>
```

**Error Responses:**
| Status | Meaning |
|--------|---------|
| `499` | No token provided — please sign in. |
| `498` | Invalid or expired token. |
| `403` | Insufficient privileges for this role. |

The middleware also attaches the decoded user (`id`, `name`, `email`, `role`) to `req.user` for use in downstream route handlers.

---

### Audio Summarization — Hugging Face API

The backend proxies audio files to the external Hugging Face Space for summarization.

**External API Base URL:**
```
https://fiby-ehab26-audio-summarizer-api.hf.space
```

#### `POST /Upload_Audio`
Upload an audio file and receive a text summary.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `file` | binary | The audio file to summarize |

**Success Response `200`:**
```json
"string"  // The generated summary text
```

**Error Response `422`:**
```json
{
  "detail": [
    {
      "loc": ["string", 0],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

---

## User Model

The `User` model includes the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Student's full name |
| `email` | String | Unique email address |
| `password` | String | Bcrypt-hashed password |
| `emailConfirmed` | Boolean | Whether email has been verified (default: `false`) |
| `role` | String | User role (default: `student`) |
| `coins` | Number | Coin balance earned from completed tasks |

---

## Email Flow

1. Student signs up → verification email is sent automatically via Gmail/Nodemailer.
2. The email contains a link: `GET /auth/verify-account?token=<jwt>`
3. The token is valid for **1 day**.
4. After clicking the link, `emailConfirmed` is set to `true`.
5. Student can now sign in successfully.

---

## Notes

- JWT tokens issued on sign-in are valid for **7 days**.
- Passwords are hashed with **bcrypt** (salt rounds: 5).
- The app currently supports one role: **student**.
