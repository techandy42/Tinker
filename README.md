# Tinker VSCode Extension

This repository contains a minimal VSCode extension that displays a popup window with the text **"Tinker"** when the extension is activated.

## Installation

1. Install [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/).
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Package the extension using [vsce](https://github.com/microsoft/vsce):
   ```bash
   npm install -g vsce
   vsce package
   ```
   This will generate a `.vsix` file.
5. Install the generated package in VSCode:
   ```bash
   code --install-extension "/Users/andylee/Desktop/Tinker/tinker-extension-0.0.1.vsix"
   ```

During development you can also run the extension by opening this folder in VSCode and pressing `F5` to launch the Extension Development Host.
