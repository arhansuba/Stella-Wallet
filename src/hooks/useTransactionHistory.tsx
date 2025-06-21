import { useState, useEffect } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface Transaction {
  id: string;
  type: "sent" | "received";
  amount: string;
  assetCode: string;
  from: string;
  to: string;
  createdAt: string;
  hash: string;
}

export const useTransactionHistory = (accountId: string) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = async () => {
    if (!accountId) return;
    
    // Validate account ID format
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(accountId)) {
      setError(new Error("Invalid account ID format"));
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Initialize Horizon server (following official docs)
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      
      // First check if account exists
      try {
        await server.loadAccount(accountId);
      } catch (err) {
        throw new Error("Account does not exist");
      }
      
      // Create an API call to query payments involving the account (following official docs)
      const payments = await server
        .payments()
        .forAccount(accountId)
        .order("desc")
        .limit(20)
        .call();

      // Process payments (following official docs structure)
      const formattedTransactions: Transaction[] = payments.records
        .filter((payment: any) => payment.type === "payment")
        .map((payment: any) => {
          const isReceived = payment.to === accountId;
          // In Stellar's API, Lumens are referred to as the "native" type (from docs)
          let assetCode;
          if (payment.asset_type === "native") {
            assetCode = "XLM";
          } else {
            assetCode = payment.asset_code || "Unknown";
          }
          
          return {
            id: payment.id,
            type: isReceived ? "received" : "sent",
            amount: payment.amount,
            assetCode,
            from: payment.from,
            to: payment.to,
            createdAt: payment.created_at,
            hash: payment.transaction_hash,
          };
        });

      setTransactions(formattedTransactions);
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [accountId]);

  const refetch = () => {
    fetchTransactions();
  };

  return {
    transactions,
    isLoading,
    error,
    refetch,
  };
};