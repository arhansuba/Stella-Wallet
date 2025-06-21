import { useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface SendPaymentParams {
  destination: string;
  amount: string;
  assetCode: "XLM" | "USDC";
  signer: any; // Your existing signer type
}

export const useSendPayment = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const sendPayment = async (params: SendPaymentParams) => {
    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate destination address format
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(params.destination)) {
        throw new Error("Invalid destination address. Must be a regular Stellar account (starts with G...)");
      }

      // Check if source is a contract address (which can't send classic payments)
      if (StellarSdk.StrKey.isValidContract(params.signer.addressId)) {
        throw new Error("❌ Cannot send payments from smart contract address. This SEP wallet account is a smart contract (starts with C...). Classic payments require a regular Stellar account (starts with G...).");
      }

      // Validate source address format
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(params.signer.addressId)) {
        throw new Error("Source account is not a valid Stellar account format");
      }

      // Initialize Horizon server for testnet
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      
      // Check destination account exists
      try {
        await server.loadAccount(params.destination);
      } catch (error) {
        throw new Error("Destination account does not exist on Stellar network");
      }

      // Load source account
      let sourceAccount: StellarSdk.Account;
      try {
        sourceAccount = await server.loadAccount(params.signer.addressId);
      } catch (error) {
        throw new Error("Source account does not exist on Stellar network");
      }

      // Determine asset
      let asset;
      if (params.assetCode === "XLM") {
        asset = StellarSdk.Asset.native();
      } else {
        asset = new StellarSdk.Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
      }

      // Build transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: params.destination,
            asset: asset,
            amount: params.amount,
          })
        )
        .addMemo(StellarSdk.Memo.text("Stella Wallet Payment"))
        .setTimeout(180)
        .build();

      // Sign transaction
      await params.signer.method.sign(transaction);

      // Submit transaction
      const result = await server.submitTransaction(transaction);
      console.log("Payment successful:", result);
      setSuccess(true);
      return result;

    } catch (err) {
      console.error("Payment failed:", err);
      setError(err as Error);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    sendPayment,
    isPending,
    error,
    success,
    reset,
  };
};