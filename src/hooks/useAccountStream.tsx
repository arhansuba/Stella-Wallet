import { useEffect, useRef } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

export const useAccountStream = (accountId: string, onUpdate?: () => void) => {
  const streamRef = useRef<any>(null);

  useEffect(() => {
    if (!accountId || !StellarSdk.StrKey.isValidEd25519PublicKey(accountId)) return;

    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

    // First verify account exists before streaming
    server.loadAccount(accountId)
      .then(() => {
        // Start streaming account updates only if account exists
        streamRef.current = server
          .accounts()
          .accountId(accountId)
          .stream({
            onmessage: (account) => {
              console.log("Account updated:", account);
              // Trigger callback to refresh data
              onUpdate?.();
            },
            onerror: (error) => {
              console.warn("Account stream error (this is normal if account doesn't exist):", error);
              // Don't spam console with CORS errors
            },
          });
      })
      .catch((error) => {
        console.warn("Cannot stream account - account may not exist:", error.message);
      });

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current();
        streamRef.current = null;
      }
    };
  }, [accountId, onUpdate]);

  // Function to stop streaming manually
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current();
      streamRef.current = null;
    }
  };

  return { stopStream };
};