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

### Step 4: Configure Custom Domain

If you've purchased a domain through Vercel or elsewhere, you can configure it to point to your project:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain** and enter your domain name (e.g., `example.com` or `www.example.com`)
5. Follow the DNS configuration instructions:
   - **For root domain** (`example.com`): Add an A record pointing to Vercel's IP addresses (shown in the dashboard)
   - **For www subdomain** (`www.example.com`): Add a CNAME record pointing to `cname.vercel-dns.com`
6. If you purchased the domain on Vercel, DNS may be automatically configured
7. Wait for DNS propagation (can take a few minutes to 48 hours)
8. Vercel will automatically provision an SSL certificate once DNS is configured

**Note**: You can add both the root domain and www subdomain. Vercel will handle redirects automatically.

### Step 5: Verify Deployment

After deployment, your app will be available at your Vercel URL and your custom domain (once configured). The Neon database connection will work automatically using the integrated connection string.

**Important**: Make sure to run the database schema (`database/schema.sql`) in your Neon database before deploying, or the authentication will not work.

## Subdomain Deployment (Multi-Tenant Setup)

This guide explains how to deploy the app to a subdomain like `nssvb.kitemanager.com` for a specific school/client.

### Step 1: Set Up Subdomain in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or create a new project for this subdomain)
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your subdomain: `nssvb.kitemanager.com`
6. Vercel will show you DNS configuration instructions

### Step 2: Configure DNS Records

You need to add a DNS record at your domain registrar (where you manage `kitemanager.com`):

1. Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Navigate to DNS management for `kitemanager.com`
3. Add a **CNAME record**:
   - **Name/Subdomain**: `nssvb`
   - **Value/Target**: `cname.vercel-dns.com`
   - **TTL**: 3600 (or use default)
4. Save the DNS record

**Alternative**: If your registrar doesn't support CNAME for subdomains, you can use an A record:
- **Name/Subdomain**: `nssvb`
- **Value/Target**: Vercel's IP addresses (shown in Vercel dashboard)
- **TTL**: 3600

### Step 3: Wait for DNS Propagation

- DNS changes typically take 5 minutes to 48 hours to propagate
- You can check propagation status using tools like [whatsmydns.net](https://www.whatsmydns.net)
- Vercel will automatically provision an SSL certificate once DNS is configured correctly

### Step 4: Verify Subdomain

Once DNS has propagated:
1. Visit `https://nssvb.kitemanager.com` in your browser
2. You should see your deployed app
3. The SSL certificate should be automatically configured (HTTPS)

## Frequent Updates & CI/CD Setup

For frequent updates over the next 2-3 months, we recommend the following setup:

### Option 1: Automatic Deployments from Git (Recommended)

This is the easiest setup for frequent updates:

1. **Connect GitHub Repository to Vercel**:
   - In Vercel Dashboard, go to your project
   - Navigate to **Settings** → **Git**
   - Connect your GitHub repository if not already connected
   - Select the branch you want to deploy (usually `main` or `master`)

2. **Enable Automatic Deployments**:
   - Vercel automatically deploys on every push to the connected branch
   - Every commit will trigger a new deployment
   - You can see deployment status in the Vercel dashboard

3. **Workflow for Updates**:
   ```bash
   # Make your changes locally
   git add .
   git commit -m "Your update message"
   git push origin main
   # Vercel will automatically deploy in ~2-3 minutes
   ```

### Option 2: Preview Deployments for Testing

Before pushing to production, test changes using preview deployments:

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # Make your changes
   git add .
   git commit -m "Add new feature"
   git push origin feature/your-feature-name
   ```

2. **Vercel Creates Preview URLs**:
   - Vercel automatically creates a preview deployment for each branch/PR
   - You'll get a unique URL like `your-project-git-feature-branch.vercel.app`
   - Test your changes on this preview URL
   - Once verified, merge to main branch for production deployment

### Option 3: Manual Deployments (If Needed)

If you need more control:

1. In Vercel Dashboard, go to **Deployments**
2. Click **Redeploy** on any previous deployment
3. Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

### Best Practices for Frequent Updates

1. **Use Git Branches**:
   - Keep `main` branch stable
   - Create feature branches for new work
   - Test on preview deployments before merging

2. **Monitor Deployments**:
   - Check Vercel dashboard after each deployment
   - Review build logs if deployment fails
   - Test the live site after each update

3. **Environment Variables**:
   - All environment variables are automatically included in deployments
   - Update them in **Settings** → **Environment Variables** if needed
   - Changes take effect on the next deployment

4. **Database Migrations**:
   - Run database migrations manually in Neon dashboard before deploying code changes
   - Keep migration scripts in `database/migrations/` folder

5. **Rollback if Needed**:
   - In Vercel Dashboard → **Deployments**
   - Find a previous working deployment
   - Click the three dots (⋯) → **Promote to Production**

### Quick Update Checklist

Before pushing updates:
- [ ] Test changes locally (`npm run dev`)
- [ ] Build successfully (`npm run build`)
- [ ] Check for console errors
- [ ] Update database schema if needed (in Neon dashboard)
- [ ] Commit and push to Git
- [ ] Monitor Vercel deployment status
- [ ] Test live site after deployment

## Security Note

⚠️ **Important**: In production, never expose your database connection string in client-side code. Consider using a backend API to handle database operations. However, Neon's serverless driver is designed to work securely from the client side.

## License

MIT
