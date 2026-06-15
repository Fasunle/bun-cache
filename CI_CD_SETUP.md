# CI/CD Setup & Deployment Guide

This project uses GitHub Actions to automatically test and publish to npm registry as `@fasunle/orca`.

## 🚀 Quick Start

### 1. Prerequisites

- GitHub repository set up with this code
- npm account at https://www.npmjs.com
- npm token generated

### 2. Generate NPM Token

1. Go to https://www.npmjs.com/settings/~/tokens
2. Click **"Create New Token"**
3. Select **"Automation"** (recommended for CI/CD)
4. Copy the token

### 3. Add NPM Token to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **"Add secret"**

## 📋 Workflows

### Test Workflow (`.github/workflows/test.yml`)

Automatically runs on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

Tests with:

- Node.js 18.x and 20.x
- Runs full test suite
- Builds the package
- Verifies build output

### Publish Workflow (`.github/workflows/publish.yml`)

Automatically runs on:

- GitHub Release creation (recommended)
- Manual trigger via workflow dispatch

Process:

1. Checkout code
2. Install dependencies via Bun
3. Run full test suite
4. Build package
5. Authenticate with npm
6. Publish to npm registry
7. Create GitHub release comment (if PR context)

### Release Workflow (`.github/workflows/release.yml`)

Triggered on commits to `main` with changes to:

- `src/**` files
- `package.json`
- `test/**` files
- `.github/workflows/**` files

**Note**: This workflow is optional and requires Changesets. See below for configuration.

## 📦 Publishing to NPM

### Method 1: GitHub Releases (Recommended)

1. Update version in `package.json` manually or using:

   ```bash
   npm version patch  # 0.1.0 → 0.1.1
   npm version minor  # 0.1.0 → 0.2.0
   npm version major  # 0.1.0 → 1.0.0
   ```

2. Push changes:

   ```bash
   git add package.json
   git commit -m "chore: bump version to x.y.z"
   git push origin main
   ```

3. Create release on GitHub:
   - Go to your repository
   - Click **Releases** → **Draft a new release**
   - Tag version: `v0.1.x`
   - Release title: `Release v0.1.x`
   - Description: Add release notes
   - Click **Publish release**

4. GitHub Actions automatically publishes to npm!

### Method 2: Manual npm Publish

If GitHub Actions workflow fails or you need to publish manually:

```bash
# Setup npm authentication
npm login

# Build and publish
bun run build
npm publish --access public

# Or with npm token:
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
npm publish --access public
```

### Method 3: Using Changesets (Optional)

For automatic versioning and release management:

1. Install Changesets:

   ```bash
   bun add -d @changesets/cli @changesets/changelog-github
   ```

2. Initialize:

   ```bash
   bunx changesets init
   ```

3. Create changeset:

   ```bash
   bunx changesets add
   ```

4. Version and publish:
   ```bash
   bunx changesets version
   bunx changesets publish
   ```

## 🔐 Security Best Practices

1. **Never commit `.npmrc` with tokens** - Use `.npmrc.template` as reference
2. **Use Automation tokens** - Created with "Automation" type in npm
3. **Rotate tokens regularly** - Delete old tokens from npm account
4. **Use branch protection** - Require PR reviews before merging to `main`
5. **Limited permissions** - Only publish scope for @fasunle packages

## ✅ Verification

### Check if package is published:

```bash
npm view @fasunle/orca
```

### Install the package locally:

```bash
npm install @fasunle/orca
```

Or globally:

```bash
npm install -g @fasunle/orca
```

### Run the CLI:

```bash
orca run build
```

## 🐛 Troubleshooting

### "Publish failed: 403 Forbidden"

- Verify NPM token is valid and hasn't expired
- Check token has publish permissions
- Ensure `publishConfig.access` is set to `public` in package.json

### "No files included in package"

- Run `bun run build` to generate dist files
- Add `dist/` to your repository if needed
- Check `package.json` main/exports fields are correct

### "Registry authentication failed"

- Verify `NPM_TOKEN` secret is set in GitHub repository
- Check token value is correct and not truncated
- Token should be created as "Automation" type, not "Classic"

### Tests failing in CI but passing locally

- Run tests with: `bun run test:run`
- Check Node.js version compatibility
- Ensure `.git` directory exists in checkout

## 📖 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm CLI Documentation](https://docs.npmjs.com/cli)
- [npm Scoped Packages](https://docs.npmjs.com/cli/v8/using-npm/scope)
- [Changesets Documentation](https://github.com/changesets/changesets)

## 📝 Release Checklist

Before releasing a new version:

- [ ] All tests passing: `bun run test:run`
- [ ] Build succeeds: `bun run build`
- [ ] Update CHANGELOG or release notes
- [ ] Version bump: `npm version patch/minor/major`
- [ ] Git push with new tag
- [ ] Create GitHub Release
- [ ] Verify npm package published
- [ ] Announce release to users

## 🎯 Next Steps

1. ✅ Set up NPM_TOKEN secret in GitHub
2. ✅ Test workflow runs on next PR/push
3. ✅ Create first release and publish
4. ✅ Verify package on npm registry
5. ✅ Share installation instructions with users
