# Umami Recipe App - Setup Guide

## Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account (see SUPABASE_SETUP.md)

## Installation

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure Supabase:**
   - Follow instructions in `SUPABASE_SETUP.md`
   - Update `/utils/supabase/info.tsx` with your project credentials

3. **Start development server:**
   ```bash
   pnpm dev
   ```

4. **Build for production:**
   ```bash
   pnpm build
   ```

## Fixed Issues

### TypeScript Configuration
- ✅ Added `tsconfig.json` with proper React and TypeScript settings
- ✅ Added `tsconfig.node.json` for Vite configuration
- ✅ Configured path aliases (`@/*` → `./src/*`)

### Dependencies
- ✅ Moved React and React-DOM from peerDependencies to dependencies
- ✅ Added TypeScript type definitions (`@types/react`, `@types/react-dom`)
- ✅ Added TypeScript compiler

### Code Quality
- ✅ Fixed React Hooks dependency array in `useRecipes.ts`
- ✅ Added timer cleanup in `useDraft.ts` to prevent memory leaks
- ✅ Fixed TypeScript type annotations in `useDraft.ts`
- ✅ Added ErrorBoundary component for better error handling
- ✅ Wrapped App in ErrorBoundary for global error catching

### Project Configuration
- ✅ Created `.gitignore` for version control
- ✅ Created `.eslintrc.json` for code linting
- ✅ Configured ESLint with React and TypeScript support

## Project Structure

```
├── src/
│   ├── app/              # Main app component and routing
│   ├── components/       # Reusable components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and types
│   ├── pages/           # Page components
│   └── styles/          # Global styles
├── supabase/            # Supabase edge functions
├── utils/               # Utility functions
└── guidelines/          # Development guidelines
```

## Common Issues

### TypeScript Errors
If you see TypeScript errors about missing React types, run:
```bash
pnpm install
```

### Build Fails
Ensure all dependencies are installed:
```bash
rm -rf node_modules
pnpm install
```

### Supabase Connection Issues
Check that your Supabase credentials in `/utils/supabase/info.tsx` are correct.

## Development

- The app uses Vite for fast development and building
- React Router for client-side routing
- Supabase for authentication and database
- Tailwind CSS for styling
- shadcn/ui components for UI elements

## Next Steps

1. Install dependencies: `pnpm install`
2. Configure Supabase (see SUPABASE_SETUP.md)
3. Start development: `pnpm dev`
4. Visit http://localhost:5173