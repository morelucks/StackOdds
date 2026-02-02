# StackOdds System Architecture

This document describes the high-level architecture of StackOdds, a decentralized prediction market platform built on the Stacks blockchain.

## Overview

StackOdds leverages the Stacks blockchain's smart contract capabilities (Clarity) to provide a trustless environment for prediction markets. The system is designed to be highly scalable, gas-efficient, and secure.

### Core Components

1.  **Smart Contracts (Clarity 2.1)**:
    - **Market Contract**: The central logic for market creation, pricing (LMSR), and collateral management.
    - **Token Contract**: Manages the binary outcome tokens (YES/NO) for each market.
2.  **Frontend (Next.js)**:
    - Built with React, Tailwind CSS, and Radix UI.
    - Integrates with Stacks wallets using `@stacks/connect`.
3.  **Data Layer**:
    - **Stacks API**: For on-chain data and transaction monitoring.
    - **IPFS**: For decentralized storage of market metadata (question, description, images).

## Domain Model

### Market Lifecycle

1.  **Creation**: An administrator creates a market by providing initial liquidity in USDCx or STX.
2.  **Trading**: Users buy YES or NO shares. The price is determined by the Logarithmic Market Scoring Rule (LMSR).
3.  **Resolution**: An authorized moderator resolves the market outcome based on real-world event data.
4.  **Claiming**: Users who held shares of the winning outcome claim their collateral tokens.

### Pricing Mechanism (LMSR)

The Logarithmic Market Scoring Rule (LMSR) provides continuous liquidity and automatic price discovery. The cost to buy `q` shares is given by:

`C(q) = b * ln(sum(e^(qi/b)))`

Where:
- `b` is the liquidity parameter.
- `qi` is the number of shares for outcome `i`.

## Security Considerations

- **Post-Conditions**: All transactions are protected by Stacks post-conditions to ensure only authorized amounts of tokens are transferred.
- **Role-Based Access**: Critical functions like market resolution are restricted to specific authorized principals.
- **Fail-Safe Mechanisms**: The contract includes checks for market expiration and valid outcome resolutions.

## Future Roadmap

- **Decentralized Oracles**: Integrating with cross-chain oracles for automated market resolution.
- **Advanced AMMs**: Exploring hybrid pricing models for better capital efficiency.
