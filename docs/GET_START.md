# Vulppi - IntREST

## Getting Started

1. [Prerequisites](#prerequisites)
2. [Automatic Installation](#automatic-installation)
3. [Manual Installation](#manual-installation)

### Prerequisites

Before you begin, ensure that your system meets the following requirements:

- [Node.js 18.0.0](https://nodejs.org/) or a later version.
- Supported operating systems include macOS, Windows (including WSL), and Linux.

### Automatic Installation

Follow the steps below to set up a IntREST project using your preferred package manager:

#### 1. Create a Directory

Create a directory for your project and navigate into it:

```bash
mkdir <your-project-folder>
cd <your-project-folder>
```

#### 2. Initialize the Project

Use your chosen package manager to initialize a new IntREST project:

With npm:

```bash
npx @vulppi/intrest create
```

With pnpm:

```bash
pnpx @vulppi/intrest create
```

With yarn:

```bash
npx @vulppi/intrest create --yarn
```

This command sets up the necessary project structure and installs the required dependencies.

#### 3. Run the Development Server

Start the development server by running the `dev` script with your package manager:

With npm:

```bash
npm run dev
```

With pnpm:

```bash
pnpm dev
```

With yarn:

```bash
yarn dev
```

The development server will spin up, and you can now start building your IntREST application.

By following these steps, you'll have a IntREST project up and running, ready for you to begin developing your RESTful APIs with ease.

---

### Manual Installation

To manually install `@vulppi/intrest`, follow these steps:

#### 1. Create a New Project

Start by creating a new Node.js project using the following terminal commands:

```bash
mkdir <your-project-folder>
cd <your-project-folder>
npm init -y
```

This will create a new directory for your project and initialize a `package.json` file.

#### 2. Install TypeScript

Next, install TypeScript and the TypeScript types for Node.js using your preferred package manager. Run one of the following commands:

With npm:

```bash
npm install -D typescript @types/node
```

With pnpm:

```bash
pnpm install -D typescript @types/node
```

With yarn:

```bash
yarn add -D typescript @types/node
```

This will install TypeScript as a development dependency and ensure that you have the necessary types for Node.js.

#### 3. Configure TypeScript

In the root of your project, create a `tsconfig.json` file by running the following command:

```bash
touch tsconfig.json
```

Open the `tsconfig.json` file and add the following configuration:

```json
{
  "include": ["**/*.ts"],
  "exclude": ["node_modules", ".intrest"],
  "compilerOptions": {
    "module": "ESNext",
    "target": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "emitDeclarationOnly": true,
    "allowJs": true,
    "checkJs": false,
    // optional
    "baseUrl": "src",
    "paths": {
      "@/*": ["*"]
    }
  }
}
```

This configuration ensures that TypeScript is set up correctly for your project.

#### 4. Install IntREST

Install `@vulppi/intrest` using your chosen package manager:

With npm:

```bash
npm install @vulppi/intrest
```

With pnpm:

```bash
pnpm install @vulppi/intrest
```

With yarn:

```bash
yarn add @vulppi/intrest
```

This will install IntREST as a dependency in your project.

#### 5. Add Scripts

Open your `package.json` file and add the `"type": "module"` field to enable ES modules. Then, add the following scripts to the `"scripts"` section:

```json
{
  // ...
  "type": "module",
  "scripts": {
    "dev": "irest dev",
    "build": "irest build",
    "start": "irest start"
  }
  // ...
}
```

These scripts will enable you to run the development server, build your project, and start the server.

#### 6. Create Your First Route

Create a file called `route.ts` inside a folder named `src/routes` or `routes` in your project directory:

```
src
└── routes
    └── route.ts
package.json
tsconfig.json
```

Open the `route.ts` file and add the following content:

```ts
// src/routes/route.ts

import type { IntRequest, IntResponse } from '@vulppi/intrest'

export async function GET(ctx: IntRequest): Promise<IntResponse> {
  return {
    status: 200,
    body: 'Hello World!',
  }
}
```

This code defines a basic route handler that responds with a "Hello World!" message.

#### 7. Run the Development Server

Start the development server by running the `dev` script using your package manager of choice:

With npm:

```bash
npm run dev
```

With pnpm:

```bash
pnpm dev
```

With yarn:

```bash
yarn dev
```

The development server will start, and you can access your application at the specified port.

With these steps, you've manually installed IntREST, configured TypeScript, and set up your first route. You can now start building your IntREST application and explore the framework's capabilities.

## Next Steps

[Core Concepts](./CORE_CONCEPTS.md)
