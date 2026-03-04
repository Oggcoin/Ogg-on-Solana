# 🪨 Oggcoin 🪨 ($OGG) — Solana Program

Welcome to the Ogg Solana Magic World! 🌍

## Introduction

In this cave, the tribe discovers the Oggcoin program and token deployment on **Solana**.

### Immutable Mint Authority

* **Mint authority** no longer belongs to human hands. The minting power has been transferred to a **program-controlled PDA**.
* No wallet can mint tokens directly. The **maximum supply** is **hard-coded in stone** (10 billion OGG).

### Upgradeable Program

* The program is **upgradeable** — the tribe is smart. Once the Ogg **EVM chain** awakens, the tribe will build a bridge to allow Ogg to travel between chains.

### Token Properties & Security

* **Freeze authority** is **permanently revoked**. No one can freeze wallets or funds.
* **Transfer restrictions** are **removed**. All transfers between wallets are unrestricted.
* **No trap**. **No honeypot**. Just a clean, secure token built with best practices, akin to fire in the cave.

### The True Nature of Oggcoin

* Ogg says, **"This is no simple meme rock. This is a bridge token."**
* Ogg moves across chains. Ogg is powered by **Proof-of-Work fire** 🔥.

Below, the tribe can see the **token details**.



## Token Details & Properties

| Property                  | Value                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Token Name**            | Oggcoin                                                                                                                                 |
| **Symbol**                | OGG                                                                                                                                     |
| **Decimals**              | 9                                                                                                                                       |
| **Maximum Supply**        | 10,000,000,000 OGG (10 Billion — hardcoded in program)                                                                                  |
| **Initial Supply Minted** | 1,900,000,000 OGG (19% of max supply)                                                                                                   |
| **Current Supply**        | 1,900,000,000 OGG                                                                                                                       |
| **Freeze Authority**      | NULL — permanently revoked. Nobody can freeze any wallet.                                                                               |
| **Mint Authority**        | PDA (program-controlled) — no wallet can mint directly                                                                                  |
| **Transfer Restrictions** | NONE — fully unrestricted transfers between all wallets                                                                                 |
| **Metadata Standard**     | Metaplex Token Metadata Standard (on-chain)                                                                                             |
| **Metadata Mutable**      | Logo and description can be updated via YJ8F... wallet                                                                                  |
| **Network**               | Solana Mainnet-Beta                                                                                                                     |
| **Token Standard**        | SPL Token (Solana Program Library)                                                                                                      |
| **Logo URI**              | [Oggcoin Logo](https://salmon-changing-termite-215.mypinata.cloud/ipfs/bafybeihq24b63kdjz3wp6am2gkoo62tkzwvzo5gpissd2vyvqlhpgzrid4)     |
| **Metadata URI**          | [Oggcoin Metadata](https://salmon-changing-termite-215.mypinata.cloud/ipfs/bafkreibg6irdseps4idpt5dm3m4m77zys4ozxcd26bxp56utirngnezoh4) |

---


## Quick Ogg reference

# to get Ogg keypair id of your program
solana address -k target/deploy/calci-keypair.json

# to build Ogg program
anchor build

# to test Ogg program
anchor test

# to deploy Ogg program
anchor deploy

# to run local validator
solana-test-validator

# to make sure Ogg program id is same everywhere
anchor keys sync

---

## Mainnet binary verification (manual)

To prove the deployed mainnet program binary matches this source code exactly:

```bash
# 1) Build the program locally (from repo root)
anchor build

# 2) Dump the on-chain program binary from mainnet
solana program dump 5VijcQv7Kykjg7LhvpbyA9e31zg7MA1e51K5s9Ht1ooh deployed.so --url mainnet-beta

# 3) Compare hashes of on-chain vs local .so
sha256sum deployed.so
sha256sum target/deploy/calci.so
```

If the two `sha256sum` lines are **identical**, the on-chain program is **bit‑for‑bit the same** as the locally compiled `calci` program in this repository (no tampering).

---

## Devnet deployment and verification

### 1. Configure Solana for devnet

```bash
solana config set --url https://api.devnet.solana.com
solana config get
```

Ensure your default keypair exists and has devnet SOL:

```bash
solana address
solana airdrop 2   # if needed
```

### 2. Build and deploy Ogg program

```bash
anchor build
anchor deploy
```

### 3. Run the deploy script (creates mint, transfers auth to PDA, mints 19%)

Set Anchor env vars (optional: `OGG_TREASURY_PUBKEY` and `OGG_MINT_ADDRESS`):

```bash
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=~/.config/solana/id.json

# optional: use a dedicated treasury wallet instead of admin
# export OGG_TREASURY_PUBKEY=<YOUR_TREASURY_PUBKEY>
```

Then run:

```bash
yarn install
yarn deploy:devnet
```

Save the printed **Mint** and **Treasury ATA** addresses.

### 4. Verify deployment on devnet

```bash
export OGG_MINT_ADDRESS=<MINT_FROM_DEPLOY_OUTPUT>
export OGG_TREASURY_PUBKEY=<TREASURY_PUBKEY_USED>

yarn verify:devnet
```

This checks decimals, supply, freeze authority, mint authority, and treasury balance.

### 5. Phantom / MetaMask integration

- Add the token in Phantom (devnet): paste the **mint address** when adding a custom token.
- The token is safe to add (no freeze authority, PDA mint control, unrestricted transfers).