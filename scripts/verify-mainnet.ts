import * as anchor from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  Connection,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getMint,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// ============================================================
//  CONSTANTS (must match lib.rs exactly)
// ============================================================
const TOKEN_DECIMALS = 9;
const INITIAL_MINT_AMOUNT = new BN("1900000000000000000"); // 1.9B with 9 decimals
const MINT_AUTHORITY_SEED = Buffer.from("ogg_mint_authority");
const STATE_SEED = Buffer.from("ogg_state");
const MAINNET_RPC = "https://api.mainnet-beta.solana.com";
const PROGRAM_ID = new PublicKey("5VijcQv7Kykjg7LhvpbyA9e31zg7MA1e51K5s9Ht1ooh");

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

// ============================================================
//  MAIN VERIFICATION SCRIPT
// ============================================================

async function main() {
  console.log("\n🪨 Oggcoin ($OGG) — MAINNET Verification Script\n");

  const mintPubkey    = new PublicKey(requireEnv("OGG_MINT_ADDRESS"));
  const treasuryPubkey = new PublicKey(requireEnv("OGG_TREASURY_PUBKEY"));

  // Load wallet
  const walletPath = path.join(process.env.HOME || "~", ".config/solana/id.json");
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf8"));
  const admin = Keypair.fromSecretKey(new Uint8Array(secretKey));

  // Setup mainnet connection
  const connection = new Connection(MAINNET_RPC, "confirmed");
  const wallet = new anchor.Wallet(admin);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // Load program (Oggcoin) IDL
  const idl = JSON.parse(fs.readFileSync(path.join(__dirname, "../target/idl/oggcoin.json"), "utf8"));
  const program = new anchor.Program(idl as anchor.Idl, provider) as anchor.Program<anchor.Idl>;

  // Derive PDAs
  const [mintAuthority] = PublicKey.findProgramAddressSync([MINT_AUTHORITY_SEED], PROGRAM_ID);
  const [statePda]      = PublicKey.findProgramAddressSync([STATE_SEED], PROGRAM_ID);

  console.log(`  Network:            MAINNET ⚡`);
  console.log(`  Program ID:         ${PROGRAM_ID.toBase58()}`);
  console.log(`  Mint:               ${mintPubkey.toBase58()}`);
  console.log(`  Treasury:           ${treasuryPubkey.toBase58()}`);
  console.log(`  Mint Authority PDA: ${mintAuthority.toBase58()}`);
  console.log(`  State PDA:          ${statePda.toBase58()}`);
  console.log("");

  // Fetch on-chain data
  const mintInfo       = await getMint(connection, mintPubkey);
  const treasuryAta    = await getAssociatedTokenAddress(mintPubkey, treasuryPubkey);
  const treasuryAccount = await getAccount(connection, treasuryAta);
  const state          = await (program.account as any).oggState.fetch(statePda);

  const checks: { name: string; ok: boolean; details?: string }[] = [];

  // 1) Decimals
  checks.push({
    name: "Token decimals = 9",
    ok: mintInfo.decimals === TOKEN_DECIMALS,
    details: `on-chain: ${mintInfo.decimals}`,
  });

  // 2) Freeze authority null
  checks.push({
    name: "Freeze authority is NULL (revoked — anti-honeypot)",
    ok: mintInfo.freezeAuthority === null,
    details: mintInfo.freezeAuthority
      ? `on-chain: ${mintInfo.freezeAuthority.toBase58()}`
      : "on-chain: null",
  });

  // 3) Mint authority is PDA
  const mintAuthorityMatches =
    !!mintInfo.mintAuthority &&
    mintInfo.mintAuthority.toBase58() === mintAuthority.toBase58();
  checks.push({
    name: "Mint authority is PDA (no wallet can mint directly)",
    ok: mintAuthorityMatches,
    details: mintInfo.mintAuthority
      ? `on-chain: ${mintInfo.mintAuthority.toBase58()}`
      : "on-chain: null",
  });

  // 4) Treasury matches state
  checks.push({
    name: "Treasury address stored in program state",
    ok: state.treasury.toBase58() === treasuryPubkey.toBase58(),
    details: `state.treasury: ${state.treasury.toBase58()}`,
  });

  // 5) Supply and treasury balance = 1.9B
  const expectedSupply = BigInt(INITIAL_MINT_AMOUNT.toString());
  checks.push({
    name: "Initial supply (1.9B OGG) minted to treasury",
    ok: mintInfo.supply === expectedSupply && treasuryAccount.amount === expectedSupply,
    details: `mint.supply: ${mintInfo.supply.toString()}, treasury ATA: ${treasuryAccount.amount.toString()}`,
  });

  // 6) State.total_minted = 1.9B
  checks.push({
    name: "State.total_minted = 1.9B OGG",
    ok: state.totalMinted.toString() === INITIAL_MINT_AMOUNT.toString(),
    details: `state.totalMinted: ${state.totalMinted.toString()}`,
  });

  // 7) Admin stored in state
  checks.push({
    name: "Admin address stored in program state",
    ok: !!state.admin,
    details: `state.admin: ${state.admin.toBase58()}`,
  });

  // 8) Program is initialized
  checks.push({
    name: "Program is initialized",
    ok: state.isInitialized === true,
    details: `state.isInitialized: ${state.isInitialized}`,
  });

  // 9) Human readable supply check
  const humanSupply = Number(mintInfo.supply) / Math.pow(10, TOKEN_DECIMALS);
  checks.push({
    name: "Human readable supply = 1,900,000,000 OGG",
    ok: humanSupply === 1_900_000_000,
    details: `supply: ${humanSupply.toLocaleString()} OGG`,
  });

  // Print results
  console.log("Verification Results:\n");
  console.log("  ═══════════════════════════════════════════════════");
  let allOk = true;
  for (const check of checks) {
    const status = check.ok ? "✅" : "❌";
    console.log(`  ${status} ${check.name}`);
    if (check.details) console.log(`       ${check.details}`);
    if (!check.ok) allOk = false;
  }
  console.log("  ═══════════════════════════════════════════════════");

  console.log("");
  if (allOk) {
    console.log("🎉 ALL MAINNET VERIFICATION CHECKS PASSED.");
    console.log("");
    console.log("   ══════════════════════════════════════════════════");
    console.log(`   Program:      https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}`);
    console.log(`   Token:        https://explorer.solana.com/address/${mintPubkey.toBase58()}`);
    console.log(`   Treasury ATA: https://explorer.solana.com/address/${treasuryAta.toBase58()}`);
    console.log("   ══════════════════════════════════════════════════");
    console.log("");
    console.log("   ✅ Token is live on Solana Mainnet.");
    console.log("   ✅ 1.9B OGG confirmed in client treasury.");
    console.log("   ✅ Mint authority is program-controlled (PDA).");
    console.log("   ✅ Freeze authority revoked — anti-honeypot confirmed.");
    console.log("");
    console.log("   ⚠️  NEXT STEP: Transfer upgrade authority to client wallet:");
    console.log("   anchor upgrade --program-id 5VijcQv7Kykjg7LhvpbyA9e31zg7MA1e51K5s9Ht1ooh \\");
    console.log("     --upgrade-authority YJ8FRSSX3w1RUnVStAQSMwhfdw5mGF6uXC7gEh18HLa");
    console.log("");
  } else {
    console.log("⚠️  One or more checks FAILED. See details above.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("\n❌ Mainnet verification failed:");
  console.error(err);
  process.exit(1);
});