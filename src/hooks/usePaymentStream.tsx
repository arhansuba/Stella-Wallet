import { useEffect, useRef } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";

interface PaymentStreamProps {
  accountId: string;
  onPaymentReceived?: (payment: any) => void;
}

export const usePaymentStream = ({ accountId, onPaymentReceived }: PaymentStreamProps) => {
  const streamRef = useRef<any>(null);
  const lastTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!accountId || !StellarSdk.StrKey.isValidEd25519PublicKey(accountId)) return;

    // Initialize Horizon server (following official docs)
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

    // First verify account exists
    server.loadAccount(accountId)
      .then(() => {
        // Create an API call to query payments involving the account (from docs)
        const payments = server.payments().forAccount(accountId);

        // If some payments have already been handled, start from last seen payment
        if (lastTokenRef.current) {
          payments.cursor(lastTokenRef.current);
        }

        // Stream will send each recorded payment, one by one, then keep the
        // connection open and continue to send new payments as they occur (from docs)
        streamRef.current = payments.stream({
          onmessage: function (payment: any) {
            // Record the paging token so we can start from here next time
            lastTokenRef.current = payment.paging_token;

            // The payments stream includes both sent and received payments
            // We only want to process received payments here (from docs)
            if (payment.to !== accountId) {
              return;
            }

            // In Stellar's API, Lumens are referred to as the "native" type (from docs)
            let asset;
            if (payment.asset_type === "native") {
              asset = "XLM";
            } else {
              asset = payment.asset_code + ":" + payment.asset_issuer;
            }

            console.log(payment.amount + " " + asset + " from " + payment.from);
            
            // Notify parent component of received payment
            onPaymentReceived?.(payment);
          },
          
          onerror: function (error: any) {
            console.warn("Error in payment stream (this is normal for new accounts):", error);
          },
        });
      })
      .catch((error) => {
        console.warn("Cannot start payment stream - account may not exist:", error.message);
      });

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current();
        streamRef.current = null;
      }
    };
  }, [accountId, onPaymentReceived]);

  // Function to stop streaming manually
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current();
      streamRef.current = null;
    }
  };

  return { stopStream };
};