# NetSuite SuiteScript with TypeScript 7 Scaffold

This project is a scaffold and boilerplate for building NetSuite SuiteScript 2.1 code using modern **TypeScript 7**. 

## Purpose & Why it's Needed

Historically, NetSuite developers relied directly on TypeScript's compiler (`tsc`) to transpile TypeScript down to the `AMD` module format (Asynchronous Module Definition), which is required by NetSuite's `define([], function() {})` loader. 

However, **TypeScript 7 has removed the ability to target the AMD module system** natively. 

To bridge this gap, this scaffold introduces a two-step build process:
1. **TypeScript (`tsc`)**: Compiles TypeScript source files from the `TypeScripts/` directory into modern JavaScript (ESNext/ES2021) in an intermediate `build/` directory.
2. **Rollup**: Takes the compiled modern JavaScript and bundles/transpiles it into the NetSuite-compatible AMD format, outputting the final files into the `dist/FileCabinet/SuiteScripts/` directory.

## Features

### 1-to-1 File Output
A typical bundler merges all your source code into a single file. For NetSuite, this is an anti-pattern because NetSuite requires distinct entry point files for different script types (User Events, Client Scripts, Scheduled Scripts, etc.). 

This scaffold configures Rollup to output files **1-to-1** with your original source structure using the `preserveModules: true` option. A file at `TypeScripts/UserEvent.ts` becomes `dist/FileCabinet/SuiteScripts/UserEvent.js`.

### Third-Party NPM Modules
A massive advantage of utilizing Rollup in this build chain is the ability to easily include third-party NPM modules in your SuiteScripts. 
Thanks to Rollup's Node resolution plugins (`@rollup/plugin-node-resolve` and `@rollup/plugin-commonjs`), when you import a library like `lodash` or `moment`, Rollup will automatically transpile it to AMD and place it inside a `dist/FileCabinet/SuiteScripts/node_modules/` directory. Your SuiteScripts will seamlessly reference these local dependencies.

### JSDoc Tag Hoisting
NetSuite's parser expects `@NApiVersion` and `@NScriptType` JSDoc tags to be at the very top of the script. Rollup sometimes places these tags inside the `define()` wrapper during conversion. This scaffold includes a custom Rollup plugin (`hoistNetSuiteJSDoc`) to ensure these tags are hoisted back to the top of the file.

## How to Use This Project

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Write your Code:**
   Place your `.ts` SuiteScript files inside the `TypeScripts/` folder.

3. **Build the Project:**
   ```bash
   npm run build
   ```
   *This command runs the `clean`, `tsc`, and `rollup` steps automatically.*

4. **Deploy:**
   The output is generated inside `dist/FileCabinet/SuiteScripts/`. You can use the SuiteCloud CLI or VS Code extension to push the `dist/` directory directly to your NetSuite environment.

---

## Creating This Project From Scratch

If you want to understand how this is built or recreate it in your own environment, run the following terminal commands:

### 1. Initialize the project
```bash
# Create a new directory and initialize npm
mkdir my-suitescript-ts7
cd my-suitescript-ts7
npm init -y
```

### 2. Install Development Dependencies
```bash
# Install TypeScript 7, Rollup, and required plugins
npm install --save-dev typescript@latest rollup glob rimraf
npm install --save-dev @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-alias

# Install NetSuite type definitions and testing framework (optional)
npm install --save-dev @hitc/netsuite-types @oracle/suitecloud-unit-testing jest @types/jest
```

### 3. Setup Project Structure
```bash
# Create necessary directories
mkdir TypeScripts
```

### 4. Create `tsconfig.json`
Create a `tsconfig.json` to compile to modern JS modules instead of AMD. Notice the `"module": "ESNext"` and the `"outDir": "build"`:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2021",
    "moduleResolution": "bundler",
    "sourceMap": false,
    "strict": true,
    "allowJs": true,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "rootDir": "TypeScripts",
    "outDir": "build",
    "paths": {
      "N": ["./node_modules/@hitc/netsuite-types/N"],
      "N/*": ["./node_modules/@hitc/netsuite-types/N/*"],
      "SuiteScripts/*": ["./TypeScripts/*"]
    }
  },
  "include": ["TypeScripts/**/*"]
}
```

### 5. Create `rollup.config.mjs`
This is where the magic happens to convert the intermediate JS files into AMD while preserving the directory structure.

```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import { globSync } from 'glob';
import path from 'path';

// Custom plugin to hoist NetSuite JSDoc tags to the top of the file
function hoistNetSuiteJSDoc() {
    return {
        name: 'hoist-netsuite-jsdoc',
        renderChunk(code) {
            const jsdocRegex = /([ \t]*\/\*\*[\s\S]*?@NApiVersion[\s\S]*?\*\/)/;
            const match = code.match(jsdocRegex);

            if (match) {
                let jsdoc = match[0].trim().replace(/^[ \t]+\*/gm, ' *');
                const newCode = code.replace(match[0], '');
                return jsdoc + '\n\n' + newCode;
            }
            return null;
        }
    };
}

export default {
    input: globSync('build/**/*.js').map(file => file.replace(/\\/g, '/')),
    external: [/^[N]\//], // Keep NetSuite N/ modules external
    output: {
        dir: 'dist/FileCabinet/SuiteScripts',
        format: 'amd',
        preserveModules: true,
        preserveModulesRoot: 'build',
        exports: 'auto',
        interop: (id) => (id && id.startsWith('N/')) ? 'defaultOnly' : 'auto'
    },
    plugins: [
        alias({
            entries: [{ find: 'SuiteScripts', replacement: path.resolve('build') }]
        }),
        resolve(),
        commonjs(),
        hoistNetSuiteJSDoc()
    ]
};
```

### 6. Add Build Scripts to `package.json`
Update the `scripts` block in your `package.json`:
```json
"scripts": {
  "clean": "rimraf dist/FileCabinet/SuiteScripts build",
  "build": "npm run clean && tsc && rollup -c"
}
```

You are now ready to build SuiteScript using TypeScript 7!

This readme was generated by Gemini.
