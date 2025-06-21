import { useState } from "react";
import { Button, Input, Modal } from "@stellar/design-system";
import { validateStellarAddress, validateAmount } from "@/helpers/validation";
import { Box } from "@/components/layout/Box";
import * as StellarSdk from "@stellar/stellar-sdk";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";

interface OfficialSendProps {
  tokenCode: "XLM" | "USDC";
}

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

// Source account from environment (following official docs)
const SOURCE_SECRET = import.meta.env.VITE_STELLAR_SOURCE_ACCOUNT_PRIVATE_KEY || "SAARF2ZWAHZJMKA6LXIFVNIHUBEUTMKV5NWCCUZV6ORPKLUK6RSOYZ4D";

export const OfficialSend = ({ tokenCode }: OfficialSendProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    const addressValidation = validateStellarAddress(destination);
    if (!addressValidation.isValid) {
      errors.destination = addressValidation.error!;
    }
    
    const amountValidation = validateAmount(amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error!;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      // Initialize Horizon server for testnet (following official docs)
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

      // Initialize the source account's secret key and destination account ID (from docs)
      const sourceKeys = StellarSdk.Keypair.fromSecret(SOURCE_SECRET);
      const destinationId = destination;

      // First, check to make sure that the destination account exists (from docs)
      try {
        await server.loadAccount(destinationId);
      } catch (error) {
        console.error("Error checking destination account:", error);
        throw new Error("Destination account does not exist");
      }

      // Now we also load the source account to build the transaction (from docs)
      let sourceAccount: StellarSdk.Account;
      try {
        sourceAccount = await server.loadAccount(sourceKeys.publicKey());
      } catch (error) {
        console.error("Error checking source account:", error);
        throw new Error("Source account error");
      }

      // The next step is to parametrize and build the transaction object (from docs)
      // Using the source account we just loaded we begin to assemble the transaction.
      // We set the fee to the base fee, which is 100 stroops (0.00001 XLM).
      // We also set the network passphrase to TESTNET.
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        // We then add a payment operation to the transaction object.
        // This operation will send XLM to the destination account.
        // Not specifying an explicit source account here means that the
        // operation will use the source account of the whole transaction.
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destinationId,
            asset: tokenCode === "XLM" ? StellarSdk.Asset.native() : new StellarSdk.Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"),
            amount: amount,
          })
        )
        // We include an optional memo for transaction identification (from docs)
        .addMemo(StellarSdk.Memo.text("Stella Wallet Payment"))
        // Finally, we set a timeout for the transaction.
        // This means that the transaction will not be valid anymore after 180 seconds.
        .setTimeout(180)
        .build();

      // We sign the transaction with the source account's secret key (from docs)
      transaction.sign(sourceKeys);

      // Now we can send the transaction to the network (from docs)
      // The submitTransaction method returns a promise that resolves with the transaction result.
      // The result will contain the transaction hash and other details.
      try {
        const result = await server.submitTransaction(transaction);
        console.log("Success! Results:", result);
        setSuccess(true);

        // Reset form after success
        setTimeout(() => {
          setDestination("");
          setAmount("");
          setIsModalVisible(false);
          setSuccess(false);
        }, 2000);

      } catch (error) {
        console.error("Something went wrong!", error);
        throw error;
      }

    } catch (err: any) {
      console.error("Payment failed:", err);
      setError(err.message || "Payment failed");
    } finally {
      setIsPending(false);
    }
  };

  const openModal = () => {
    setError(null);
    setSuccess(false);
    setValidationErrors({});
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setDestination("");
    setAmount("");
    setValidationErrors({});
    setError(null);
    setSuccess(false);
  };

  return (
    <>
      <Button
        size="md"
        variant="secondary"
        onClick={openModal}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-none transition-all duration-300 shadow-lg"
      >
        Send {tokenCode}
      </Button>

      <Modal visible={isModalVisible} onClose={closeModal}>
        <Modal.Heading>Send {tokenCode} - Official Stellar Method</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <div className="text-gray-300 mb-4">
              Following official Stellar documentation for payments
            </div>

            <div>
              <Input
                id="destination"
                fieldSize="md"
                label="Destination Address"
                placeholder="G... (Stellar address)"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (validationErrors.destination) {
                    setValidationErrors(prev => ({...prev, destination: ""}));
                  }
                }}
              />
              {validationErrors.destination && (
                <div className="text-red-400 text-sm mt-1">{validationErrors.destination}</div>
              )}
            </div>

            <div>
              <Input
                id="amount"
                fieldSize="md"
                label="Amount"
                placeholder="10.0"
                rightElement={tokenCode}
                leftElement={<span className="flex items-center">{ASSET_ICON[tokenCode]}</span>}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (validationErrors.amount) {
                    setValidationErrors(prev => ({...prev, amount: ""}));
                  }
                }}
              />
              {validationErrors.amount && (
                <div className="text-red-400 text-sm mt-1">{validationErrors.amount}</div>
              )}
            </div>

            <>
              {error && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-400 font-medium">Payment Failed</span>
                  </div>
                  <p className="text-red-300 mt-2 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-medium">Success! Payment sent! 🎉</span>
                  </div>
                  <p className="text-green-300 mt-2 text-sm">Transaction submitted to Stellar network</p>
                </div>
              )}
            </>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button size="md" variant="tertiary" onClick={closeModal}>
            Cancel
          </Button>

          <Button
            size="md"
            variant="secondary"
            disabled={!destination || !amount || isPending || Object.keys(validationErrors).length > 0}
            isLoading={isPending}
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-500 text-white border-none transition-all duration-200"
          >
            Send Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};