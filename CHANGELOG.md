# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial GitHub Actions CI/CD setup
- Automated testing on PR/push
- Automated npm publishing on release
- Test suite with 53 comprehensive tests
- Dynamic task orchestration engine
- Orca-inspired configuration system
- Local caching for monorepo tasks
- Hasher for consistent cache keys
- Cache manager with persistence

### Fixed

- CLI argument parsing and validation
- Cross-workspace dependency resolution
- Topological sorting for task execution

## [0.1.0] - 2024-01-XX

### Added

- Initial public release on npm
- `orca` CLI with global installation support
- Scoped package: `@fasunle/orca`
- Complete documentation and guides
- GitHub Actions workflows (test & publish)

### Features

- Zero-config caching for monorepos
- Support for multiple workspaces (apps/_, packages/_)
- Dependency management between tasks
- Parallel task execution with dependency ordering
- Cache validation with file change detection
- CLI commands: `run`, `clean`

---

## Release Notes Template

Use this for GitHub releases:

````markdown
## v0.1.x - Release Title

### 🎉 Features

- List major new features

### 🐛 Bug Fixes

- List bug fixes

### 📦 Dependencies

- List dependency updates

### 📝 Documentation

- List documentation improvements

### 🚀 Performance

- List performance improvements

### 🙏 Thanks

Thank you to all contributors!

### Installation

```bash
npm install -g @fasunle/orca
```
````

Or for a specific version:

```bash
npm install -g @fasunle/orca@0.1.x
```

````

---

## Semantic Versioning

This project uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible API changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Bumping

```bash
# Patch release (0.1.0 → 0.1.1)
npm version patch

# Minor release (0.1.0 → 0.2.0)
npm version minor

# Major release (0.1.0 → 1.0.0)
npm version major
````

---

## Publication History

| Version | Date | Published | Status          |
| ------- | ---- | --------- | --------------- |
| 0.1.0   | TBD  | ✅ npm    | Initial release |

---

## Unreleased Changes

See [Unreleased](#unreleased) section above for features in development.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing changes and reporting issues.
