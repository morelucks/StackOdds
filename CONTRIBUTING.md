# Contributing to StackOdds

First off, thank you for considering contributing to StackOdds! It's people like you that make StackOdds such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and professional in all interactions.

## How Can I Contribute?

### Reporting Bugs

- **Check for duplicates**: Search the issue tracker before opening a new one.
- **Be descriptive**: Include steps to reproduce, expected behavior, and actual results.
- **Environment**: Specify your browser, Stacks wallet version, and network (Mainnet/Testnet).

### Suggesting Enhancements

- **Explain the "Why"**: Describe the problem this enhancement solves.
- **Design details**: If it's a UI change, provide mockups or a detailed description.

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Environment Setup**:
    - Build the project: `npm install`
    - Run tests: `npm test`
3.  **Code Style**:
    - Follow the existing code style (Prettier/ESLint configs).
    - For Clarity: Use descriptive variable names and document your functions.
4.  **Licensing**: Ensure your contributions are licensed under the MIT License.
5.  **Submit the PR**: Provide a clear description of the changes and link to any relevant issues.

## Technical Stack

- **Contracts**: Clarity 2.1
- **Tooling**: Clarinet
- **Frontend**: Next.js, React, TypeScript
- **Wallet**: `@stacks/connect`

## Development Workflow

### Smart Contract Development

To test contracts locally:
```bash
clarinet test
```

### Frontend Development

To run the frontend dev server:
```bash
cd frontend
npm run dev
```

## Community

Join our Discord or follow us on Twitter for updates and discussions!
