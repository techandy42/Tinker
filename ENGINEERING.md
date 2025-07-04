# Engineering Plan

## Overview
This project implements a minimal Visual Studio Code extension. When the extension activates, it automatically shows a modal popup displaying the text **"Tinker"**.

## Architecture
- `src/extension.ts` – Contains the activation logic. It registers a command `tinker.showMessage`. Upon activation, the command is executed immediately, displaying a modal information message.
- `package.json` – Extension manifest defining activation events, commands, and build scripts.
- `tsconfig.json` – TypeScript compiler configuration.
- Compiled JavaScript is emitted to the `out` directory.

## Build Steps
1. `npm install` – Install dependencies.
2. `npm run compile` – Compile TypeScript sources into JavaScript in `out/`.
3. (Optional) `vsce package` – Package the extension into a `.vsix` file for installation.

## Design Notes
- Activation uses the wildcard `*` so the extension loads on VSCode startup.
- A command is registered so the panel can be displayed manually if desired, but activation automatically invokes it once.
- The extension uses VSCode's built-in modal message API to keep it lightweight and simple.
