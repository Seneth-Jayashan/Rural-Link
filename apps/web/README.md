# Rural Link - Web Frontend

This is the web frontend for the Rural Link application, built with React + Vite.

## Environment Variables

Create a `.env.local` file in the root of this directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Hugging Face API Configuration
VITE_HUGGING_FACE_API_KEY=your_hugging_face_api_key_here
```

### Getting a Hugging Face API Key

1. Go to [Hugging Face](https://huggingface.co/)
2. Create an account or sign in
3. Go to your profile settings
4. Navigate to "Access Tokens"
5. Create a new token with read permissions
6. Copy the token and add it to your `.env.local` file

## Features

- **AI-Powered Review Suggestions**: Uses Hugging Face API to generate helpful review suggestions as users type
- **Real-time Order Tracking**: Track orders with live status updates
- **Interactive Chat**: Chat with delivery drivers during transit
- **Responsive Design**: Works on desktop and mobile devices

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
