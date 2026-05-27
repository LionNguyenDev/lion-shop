# Lion Shop - Warehouse Admin

A modern warehouse and inventory management system built with Next.js. This application provides an admin dashboard for managing warehouse operations, inventory tracking, and business analytics.

## About the Project

Lion Shop is a full-stack web application designed to streamline warehouse operations and inventory management. It features:

- **Admin Dashboard** — Real-time analytics and inventory overview
- **User Authentication** — Secure sign-in/sign-up with JWT token-based authentication
- **Inventory Management** — Track and manage warehouse stock
- **Analytics & Reports** — Visual data representation with charts and statistics
- **File Upload** — Support for product images and documents via Cloudinary integration
- **Dark Mode** — Seamless theme switching for better UX
- **Responsive Design** — Mobile-friendly interface

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org) — React-based full-stack framework
- **UI Library**: [React 19](https://react.dev) — Latest React with concurrent features
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) — Utility-first CSS framework
- **Components**: [shadcn/ui](https://ui.shadcn.com) & [Base UI](https://base-ui.com/) — High-quality component libraries
- **Icons**: [Lucide React](https://lucide.dev) — Modern icon set
- **Charts**: [Recharts](https://recharts.org) — Data visualization library
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) — Dark mode support
- **Notifications**: [Sonner](https://sonner.emilkowal.ski) — Toast notifications

### Backend & Database
- **Database**: [MongoDB](https://www.mongodb.com) — NoSQL document database
- **ODM**: [Mongoose](https://mongoosejs.com) — MongoDB object modeling
- **Image Storage**: [Cloudinary](https://cloudinary.com) — Image upload & optimization

### Authentication & Security
- **Password Hashing**: [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — Secure password encryption
- **JWT**: [jose](https://github.com/panva/jose) — JWT handling library

### Development Tools
- **Language**: [TypeScript](https://www.typescriptlang.org) — Type-safe JavaScript
- **Linting**: [ESLint](https://eslint.org) — Code quality
- **Code Formatting**: [Biome](https://biomejs.dev) — Fast formatter and linter
- **Utilities**: [clsx](https://github.com/lukeed/clsx) — Classname utility & [Class Variance Authority](https://cva.style/) — Component variant management

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
JWT_SECRET=your_jwt_secret_key
```

## Project Structure

```
app/
├── admin/              # Admin dashboard pages
├── home/              # Home page with sections (stats, reviews, about)
├── signin/            # Sign-in page
├── signup/            # Sign-up page
├── hook/              # Custom React hooks
├── layout.tsx         # Root layout component
└── page.tsx           # Home page
```

## Available Scripts

- `npm run dev` — Start the development server (runs on http://localhost:3000)
- `npm run build` — Build the production-optimized application
- `npm start` — Start the production server
- `npm run lint` — Run ESLint to check code quality

## Resources

- [Next.js Documentation](https://nextjs.org/docs) — Learn about Next.js features and API
- [MongoDB Documentation](https://docs.mongodb.com/) — Database reference
- [Tailwind CSS Docs](https://tailwindcss.com/docs) — Styling guide
- [Mongoose Guide](https://mongoosejs.com/docs/) — Schema and model management

## Deployment

This project can be deployed on:
- **[Vercel](https://vercel.com)** — Official Next.js hosting (recommended)
- **[Railway](https://railway.app)** — Modern cloud platform
- **[Heroku](https://www.heroku.com)** — Traditional PaaS platform
- **[AWS](https://aws.amazon.com)** — Flexible cloud infrastructure

For deployment instructions, refer to the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## License

This project is private and proprietary.
