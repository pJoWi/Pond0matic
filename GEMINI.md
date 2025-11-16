# Project: PondX Auto-Swapper

This is a Next.js web application that provides an auto-swapping interface for the Solana Jupiter platform. It features a custom, futuristic "cyberpunk" theme with holographic elements and neon colors.

## Project Overview

* **Purpose:** A tool for automatically swapping cryptocurrencies on the Solana blockchain using the Jupiter aggregator.
* **Framework:** [Next.js](https://nextjs.org/) 15
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom cyberpunk/holographic theme.
* **Blockchain Interaction:** [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/) for interacting with the Solana network.
* **Testing:** [Vitest](https://vitest.dev/) for unit and component testing.

## Key Technologies

* **Next.js:** A React framework for building server-side rendered and statically generated web applications.
* **React:** A JavaScript library for building user interfaces.
* **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
* **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
* **Solana Web3.js:** The Solana JavaScript API for interacting with the Solana blockchain.
* **Vitest:** A fast and simple testing framework for Vite projects.

## Project Structure

* `app/`: Contains the main application pages and layouts.
* `components/`: Contains reusable React components.
* `styles/`: Contains global and theme-specific CSS files.
* `lib/`: Contains utility functions.
* `public/`: Contains static assets like images and fonts.
* `tests/`: Contains test files.

## Building and Running

### Development

To run the development server:

```bash
npm run dev
```

This will start the application on [http://localhost:3000](http://localhost:3000).

### Production

To build and run the application in production:

```bash
npm run build
npm run start
```

### Testing

To run the test suite:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Styling and Theme

The project uses a custom "cyberpunk" theme with holographic and neon elements. The theme is defined in `tailwind.config.ts` and `styles/theme-cyberpunk.css`.

* **Colors:** The color palette consists of neon pinks, reds, and dark backgrounds.
* **Animations:** The theme includes several custom animations, such as `neon-pulse`, `gradient-shift`, and `border-flow`.
* **CSS Guide:** A detailed guide to the custom holographic CSS classes is available in `HOLOGRAPHIC_CSS_GUIDE.md`.

## Development Conventions

* **Components:** Reusable UI components are located in the `components` directory.
* **Styling:** The project uses Tailwind CSS with a custom theme. Utility classes are preferred over custom CSS.
* **State Management:** Component-level state is managed with React hooks (`useState`, `useEffect`).
* **Linting:** Code quality is enforced with `next lint`.
* **Paths:** The project uses path aliases `@/*` for easier imports.
