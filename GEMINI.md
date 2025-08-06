# GEMINI.md

## Project Overview

This project is a Model Context Protocol (MCP) server for managing Netskope Network Private Access (NPA) infrastructure. It is written in TypeScript and uses the `@modelcontextprotocol/sdk` to interact with Large Language Models (LLMs). The server provides a set of tools for managing various aspects of the Netskope NPA environment, including publishers, private applications, policies, and more.

The project is structured with a `src` directory containing the source code, which is further divided into `commands`, `tools`, `types`, and `utils`. The `commands` directory defines the command-line interface, while the `tools` directory contains the logic for interacting with the Netskope API. The `types` directory defines the data structures used throughout the application, and the `utils` directory provides helper functions.

## Building and Running

### Building the project

To build the project, run the following command:

```bash
npm run build
```

This will compile the TypeScript code into JavaScript and place it in the `dist` directory.

### Running the server

To run the server, use the following command:

```bash
npm start
```

This will start the MCP server, which will listen for requests from LLMs.

### Running in development mode

To run the server in development mode, with automatic recompilation on file changes, use the following command:

```bash
npm run dev
```

### Running tests

To run the test suite, use the following command:

```bash
npm test
```

To run the tests in watch mode, use the following command:

```bash
npm run test:watch
```

To generate a test coverage report, use the following command:

```bash
npm run test:coverage
```

## Development Conventions

### Coding Style

The project uses TypeScript and follows standard coding conventions. The code is well-structured and organized into modules.

### Testing

The project uses `vitest` for testing. Tests are located in the `src` directory alongside the files they test, with a `.test.ts` extension.

### Contribution Guidelines

The `CONTRIBUTING.md` file provides guidelines for contributing to the project. It is recommended to read this file before making any contributions.
