# Publishing Guide

This guide covers how to publish both the NPM package and VS Code extension.

> **⚠️ Important**: This project includes disclaimers about AI generation and limited maintenance. Ensure you're comfortable with these before publishing.

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **VS Code Publisher**: Create a publisher account at [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
3. **Authentication**:
   - Login to NPM: `npm login`
   - Get VS Code PAT: Create a Personal Access Token in Azure DevOps

## Publishing the NPM Package

1. **Build the project**:

   ```bash
   pnpm run build
   ```

2. **Test the package locally**:

   ```bash
   pnpm pack
   npm install -g ./dav3-mcp-dynamics365-server-1.0.0.tgz
   ```

3. **Publish to NPM**:
   ```bash
   pnpm run publish:npm
   ```

## Publishing the VS Code Extension

1. **Install vsce** (VS Code Extension CLI):

   ```bash
   npm install -g vsce
   ```

2. **Create a publisher** (one-time setup):

   ```bash
   vsce create-publisher dav3
   ```

3. **Login with your Personal Access Token**:

   ```bash
   vsce login dav3
   ```

4. **Package and publish the extension**:

   ```bash
   pnpm run publish:vscode
   ```

   Or manually:

   ```bash
   cd vscode-extension
   pnpm install
   pnpm run compile
   vsce package
   vsce publish
   ```

## Version Management

To publish a new version:

1. **Update version** in both `package.json` files:

   ```bash
   pnpm version patch  # or minor, major
   cd vscode-extension
   pnpm version patch
   ```

2. **Rebuild and republish**:
   ```bash
   pnpm run build
   pnpm run publish:npm
   pnpm run publish:vscode
   ```

## Testing Before Publishing

1. **Test NPM package**:

   ```bash
   pnpm run test
   pnpm pack
   # Test the packed version
   ```

2. **Test VS Code extension**:
   ```bash
   cd vscode-extension
   pnpm run compile
   # Test in VS Code development host (F5)
   ```

## Marketplace Links

- **NPM Package**: https://www.npmjs.com/package/@dav3/mcp-dynamics365-server
- **VS Code Extension**: https://marketplace.visualstudio.com/items?itemName=dav3.mcp-dynamics365-extension

## Common Issues

1. **NPM Authentication**: Make sure you're logged in with `npm whoami`
2. **VS Code Publisher**: Ensure your publisher name matches in package.json
3. **Version Conflicts**: Always bump version numbers before publishing
4. **Build Errors**: Run `pnpm run clean && pnpm run build` to ensure clean build
