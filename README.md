# KSMANAGER

A modern web application built with Vite, React, Tailwind CSS, and Neon Database.

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Neon Database** - Serverless Postgres database

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Neon database account (get one at [neon.tech](https://neon.tech))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Add your Neon database connection string to `.env`:
```
VITE_NEON_DATABASE_URL=your_neon_connection_string_here
```

You can find your connection string in the Neon dashboard under your project settings.

### Database Setup

Before running the app, you need to create the database tables. Run the SQL schema file in your Neon database:

1. Go to your Neon dashboard
2. Open the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL to create the `users` and `sessions` tables

The schema includes:
- `users` table: Stores user accounts with hashed passwords
- `sessions` table: Manages user sessions with expiration

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
KITEMANAGER/
├── database/
│   └── schema.sql          # Database schema for users and sessions
├── src/
│   ├── lib/
│   │   ├── neon.js        # Neon database connection
│   │   ├── auth.js        # Authentication functions
│   │   └── password.js    # Password hashing utilities
│   ├── components/
│   │   └── Sidebar.jsx   # Sidebar navigation component
│   ├── pages/
│   │   ├── Dashboard.jsx  # Dashboard page
│   │   ├── Login.jsx      # Login page
│   │   └── Signup.jsx     # Signup page
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # React entry point
│   └── index.css          # Tailwind CSS imports
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Authentication

The app uses database-backed authentication with sessions:

- **User Registration**: Users can create accounts with email and password
- **Password Security**: Passwords are hashed using PBKDF2 with SHA-256
- **Sessions**: User sessions are stored in the database with 30-day expiration
- **Protected Routes**: Users must be authenticated to access the app

## Using the Neon Database

Import the SQL client in your components:

```jsx
import sql from './lib/neon.js'

// Example query
const result = await sql`SELECT * FROM your_table`
```

## Deployment to Vercel with Neon Integration

This project is configured for deployment on Vercel with Neon database integration.

### Step 1: Connect Neon to Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project settings
3. Go to the **Integrations** tab
4. Search for **Neon** and click **Add Integration**
5. Follow the prompts to connect your Neon account
6. Select your Neon project and branch

This will automatically create a `DATABASE_URL` environment variable in Vercel.

### Step 2: Configure Environment Variable for Vite

Since Vite only exposes environment variables with the `VITE_` prefix to the client-side code, you need to create a client-accessible variable:

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. You should see `DATABASE_URL` automatically created by the Neon integration
3. Add a new environment variable:
   - **Name**: `VITE_NEON_DATABASE_URL`
   - **Value**: Copy the exact value from `DATABASE_URL` (click on it to view/copy)
   - **Environment**: Production, Preview, and Development (select all)

**Note**: You need to manually copy the `DATABASE_URL` value to `VITE_NEON_DATABASE_URL` because Vite requires the `VITE_` prefix for client-side access.

### Step 3: Deploy

1. Push your code to GitHub (if not already done)
2. Import your repository in Vercel
3. Vercel will automatically detect the Vite framework
4. The deployment will use the environment variables you configured

### Step 4: Verify Deployment

After deployment, your app will be available at your Vercel URL. The Neon database connection will work automatically using the integrated connection string.

**Important**: Make sure to run the database schema (`database/schema.sql`) in your Neon database before deploying, or the authentication will not work.

## Security Note

⚠️ **Important**: In production, never expose your database connection string in client-side code. Consider using a backend API to handle database operations. However, Neon's serverless driver is designed to work securely from the client side.

## License

MIT
