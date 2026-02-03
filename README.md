# Digital Enrollment System

A comprehensive HR Management and Employee Enrollment System built with React, TypeScript, Node.js, and Prisma.

## Overview

The Digital Enrollment System is a full-stack web application for managing employees, policies, and enrollment data. It features role-based access control (HR and Employee roles) with a modern, responsive UI.

## Features

- **Employee Management** - Add, edit, delete employees with detailed profiles
- **Policy Management** - Create and manage insurance policies
- **Enrollment Tracking** - Monitor policy enrollments and dependent information
- **Bulk Upload** - Import multiple employees via CSV/Excel files
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Role-Based Access** - Separate HR and Employee dashboards
- **Real-time Updates** - Dynamic data loading with error handling

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.3.1
- Tailwind CSS 4.1.18
- React Router v6
- Lucide React (Icons)
- Recharts (Data visualization)

### Backend
- Node.js
- Express.js
- tRPC (Type-safe APIs)
- Prisma ORM
- SQLite/PostgreSQL
- JWT Authentication
- bcrypt (Password hashing)

## Project Structure

```
digital-enrollment-system/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Route configuration
│   │   ├── utils/          # Helper functions
│   │   ├── api.ts          # API client
│   │   └── styles.css      # Global styles
│   ├── vite.config.ts
│   └── package.json
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── routers/        # tRPC routes
│   │   ├── middleware/     # Auth & role checking
│   │   └── utils/          # Utilities
│   ├── prisma/             # Database schema & migrations
│   └── package.json
├── .github/workflows/       # GitHub Actions CI/CD
└── README.md               # This file
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- (Optional) PostgreSQL or use SQLite

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/Digital-Enrollment-System.git
cd Digital-Enrollment-System
```

2. **Setup Backend**
```bash
cd backend
npm install
npx prisma migrate deploy
npm start
```

Backend runs on `http://localhost:3000`

3. **Setup Frontend** (in new terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Configuration

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=file:./dev.db
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
PORT=3000
```

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:3000/api
```

## Database

### Prisma Commands

```bash
cd backend

# View database UI
npx prisma studio

# Create a migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Seed database
node prisma/seed.js
```

### Database Schema
Located at `backend/prisma/schema.prisma`

## Development

### Running Tests
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test
```

### Building for Production

**Frontend**
```bash
cd frontend
npm run build  # Creates optimized dist/
npm run preview  # Test production build locally
```

**Backend**
```bash
cd backend
npm run build
npm start
```

## Deployment

### Deploy Frontend to GitHub Pages

1. **Push to GitHub**
```bash
git add .
git commit -m "Your message"
git push origin main
```

2. **Deploy**
```bash
cd frontend
npm run deploy
```

Or use automatic GitHub Actions (configured in `.github/workflows/deploy-frontend.yml`)

3. **Configure GitHub Pages**
- Go to Settings → Pages
- Source: Deploy from a branch
- Branch: `gh-pages`
- Path: `/ (root)`

Your site will be available at: `https://YOUR_USERNAME.github.io/Digital-Enrollment-System`

### Deploy Backend

Options for backend deployment:
- **Vercel** - Best for Node.js apps
- **Render** - Good free tier
- **Railway** - Simple deployment
- **AWS**, **Heroku**, or **DigitalOcean** - Full control

See [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) for detailed instructions.

## API Documentation

### Authentication
- POST `/auth/login` - Login with email/password
- POST `/auth/register` - Create new account

### Employees (HR only)
- GET `/employees` - List all employees
- POST `/employees` - Create employee
- GET `/employees/:id` - Get employee details
- PUT `/employees/:id` - Update employee
- DELETE `/employees/:id` - Delete employee

### Policies (HR only)
- GET `/policies` - List policies
- POST `/policies` - Create policy
- PUT `/policies/:id` - Update policy
- DELETE `/policies/:id` - Delete policy

### Enrollment
- POST `/enrollment` - Enroll in policy
- GET `/enrollment/:employeeId` - Get employee enrollments

Full API documentation available at `/api/docs` (when backend is running)

## Scripts

### Frontend
```bash
npm start      # Start dev server
npm run dev    # Same as start
npm run build  # Build for production
npm run preview # Preview production build
npm run deploy # Deploy to GitHub Pages
```

### Backend
```bash
npm start      # Start server
npm run dev    # Start with auto-reload
npm run build  # Build TypeScript
```

## Troubleshooting

### Common Issues

**"Port 5173 already in use"**
```bash
# Kill process using port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows
```

**"Database connection error"**
```bash
cd backend
npx prisma migrate reset
npm start
```

**"GitHub Pages not updating"**
- Wait 5 minutes for GitHub to build
- Check Actions tab for build errors
- Verify `gh-pages` branch exists

See [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) for more troubleshooting.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
1. Check [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)
2. Review the code comments
3. Check GitHub Issues
4. Create a new issue with details

## Repo Notes

This repository uses Prisma as the ORM for SQLite/PostgreSQL schema and migrations.

Key locations:
- **Prisma schema:** [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- **Migrations:** [backend/prisma/migrations](backend/prisma/migrations)
- **Prisma seed:** [backend/prisma/seed.ts](backend/prisma/seed.ts)

---

Built with ❤️ for efficient HR management and employee enrollment.

