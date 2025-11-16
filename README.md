# Kite Manager

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
├── src/
│   ├── lib/
│   │   └── neon.js          # Neon database connection
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS imports
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## Using the Neon Database

Import the SQL client in your components:

```jsx
import sql from './lib/neon.js'

// Example query
const result = await sql`SELECT * FROM your_table`
```

## Security Note

⚠️ **Important**: In production, never expose your database connection string in client-side code. Consider using a backend API to handle database operations.

## License

MIT

