# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Global CSS usage

The shared Midnight Guild design system lives in `src/styles/global.css` and is imported once from `src/main.jsx`.

- Change customer theme colours, spacing, radius, fonts and shadows in `:root`.
- Admin and employee pages use the light theme overrides through `admin-theme` and `employee-theme`.
- Reuse shared classes such as `btn`, `card`, `form-control`, `data-table`, `status-badge`, `auth-card` and `account-layout` before creating new page-specific styles.
- Keep page-specific CSS in files such as `admin.css`, `customer.css` and `employee.css` only for local layout or module-specific rules.
