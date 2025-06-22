# ✨ Stella Wallet ✨

![Stella Wallet](docs-images/stella-banner.png)

[![Hackathon Project](https://img.shields.io/badge/Hackathon-Project-blueviolet)](https://stellar.org)
[![Made with Soroban](https://img.shields.io/badge/Made%20with-Soroban-orange)](https://soroban.stellar.org)
[![Uses WebAuthn](https://img.shields.io/badge/Uses-WebAuthn-blue)](https://webauthn.guide)

> **IMPORTANT NOTICE**
> This is a Hackathon project. Not recommended for storing real assets or handling live transactions.

## 🚀 The Next Evolution in Stellar Wallets

**Stella Wallet** revolutionizes blockchain interactions on Stellar by combining cutting-edge passkey technology with smart contract functionality. Say goodbye to seed phrases and hello to the future of web3 authentication!

### 🔒 Why Stella Wallet?

Our hackathon project addresses a key pain point in crypto: **complex, insecure authentication**. By leveraging WebAuthn (the same tech powering passwordless login on major platforms), we've created a wallet that's both more secure AND easier to use.

## 🌟 Key Features

- **Passwordless Security**: Authenticate with fingerprints, face recognition or security keys
- **Smart Contract Integration**: Built natively on Soroban, Stellar's powerful smart contract platform
- **Cross-Platform Compatibility**: Seamlessly works across devices that support WebAuthn
- **SEP Protocol Support**: First-class integration with Stellar Ecosystem Proposals for frictionless anchor interactions
- **Enhanced User Experience**: Intuitive interface designed for both crypto veterans and newcomers

## Quick Start

### Requirements

- Node.js 20+
- Stellar CLI (for contract interactions)
- Docker (optional, for local anchor testing)

### Development Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

### Testing with an Anchor

For a complete testing environment with SEP-10c and SEP-24:

1. Set up the test anchor:
```sh
# Clone the anchor SDK (use the feature branch for demo)
git clone -b feature/m24-demo https://github.com/stellar/java-stellar-anchor-sdk.git

# Build and run with Docker
cd java-stellar-anchor-sdk
docker build --build-arg BASE_IMAGE=gradle:7.6.4-jdk17 -t anchor-platform:local ./
docker compose -f service-runner/src/main/resources/docker-compose.yaml up -d
```

### After Testnet Reset

To redeploy the necessary contracts:

1. Follow instructions in the [soroban directory](./soroban/README.md)
2. Update your environment variables:
   - Set `VITE_PASSKEY_CONTRACT_FACTORY` to your new `WEBAUTHN_FACTORY` value
   - Set `VITE_PASSKEY_CONTRACT_WALLET_WASM` to your new `WEBAUTHN_WASM` value

See [.env.example](./.env.example) for reference.

---

## Learn More

- [Soroban Documentation](./soroban/README.md)
- [Stellar Developer Portal](https://developers.stellar.org)
- [WebAuthn Standard](https://www.w3.org/TR/webauthn-2/)

## 🏆 Hackathon Vision

Stella Wallet represents our vision for the future of crypto wallets: secure by default, easy to use, and built on open standards. We believe that mainstream adoption of blockchain technology requires removing friction points like seed phrases while enhancing security through modern authentication standards.

By combining WebAuthn with Stellar's powerful smart contract platform, we're demonstrating how the next generation of wallets can provide both better security and improved user experience.

## 🙏 Acknowledgements

Special thanks to the Stellar Development Foundation for creating the ecosystem that makes this innovation possible, and to the WebAuthn standard creators for pushing forward passwordless authentication technology.
