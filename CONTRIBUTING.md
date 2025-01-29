# Contributing to Netskope MCP Server

Thank you for your interest in contributing to the Netskope MCP Server! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- Git

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/netskope/mcp-server.git
   cd mcp-server
   ```

2. Run the setup script:
   - On Windows:
     ```powershell
     .\scripts\setup.ps1
     ```
   - On Unix-like systems:
     ```bash
     ./scripts/setup.sh
     ```

   This will:
   - Create necessary directories
   - Install dependencies
   - Install MCP Inspector globally
   - Build the project

### Running Tests

The project uses the MCP Inspector for testing. To run the tests:

```bash
# Run the automated test suite
node examples/inspector-demo.js
```

Test reports will be generated in the `test-reports` directory:
- HTML report: `test-reports/test-report-{timestamp}.html`
- Markdown report: `test-reports/test-report-{timestamp}.md`
- Test data: `test-reports/test-data.json`

## Project Structure

```
src/
├── cli.ts                 # CLI entry point
├── server/
│   ├── index.ts          # Main server setup
│   ├── tools/            # MCP tool implementations
│   │   ├── infrastructure.ts
│   │   ├── policy.ts
│   │   └── steering.ts
│   └── types/
│       └── schemas.ts    # Zod schemas for validation
examples/                 # Example usage and tests
scripts/                 # Setup and utility scripts
test-reports/           # Generated test reports
```

## Adding New Features

1. **Tools**: To add a new tool:
   - Create a new function in the appropriate file under `src/server/tools/`
   - Add the tool's schema to `src/server/types/schemas.ts`
   - Register the tool in `src/server/index.ts`
   - Add tests in `examples/automated-inspector-test.ts`

2. **Resources**: To add a new resource:
   - Define the resource schema in `src/server/types/schemas.ts`
   - Add the resource handler in `src/server/index.ts`
   - Add tests in `examples/automated-inspector-test.ts`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions focused and concise

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes:
   - Write clear commit messages
   - Add tests for new functionality
   - Update documentation as needed

3. Run tests and linting:
   ```bash
   npm test
   npm run lint
   ```

4. Push your changes:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request:
   - Provide a clear description of the changes
   - Link any related issues
   - Ensure all checks pass

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a release PR
4. After merging, tag the release:
   ```bash
   git tag -a v1.x.x -m "Release v1.x.x"
   git push origin v1.x.x
   ```

## Getting Help

- Open an issue for bugs or feature requests
- Join our community discussions
- Check the [MCP documentation](https://modelcontextprotocol.io)

## License

By contributing to this project, you agree that your contributions will be licensed under its MIT License.
