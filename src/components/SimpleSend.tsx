import { useState } from "react";
import { Button, Input, Modal } from "@stellar/design-system";
import { validateStellarAddress, validateAmount } from "@/helpers/validation";
import { Box } from "@/components/layout/Box";
import * as StellarSdk from "@stellar/stellar-sdk";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";

interface SimpleSendProps {
  tokenCode: "XLM" | "USDC";
}

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

// Use source account from environment for sending
const SOURCE_SECRET = import.meta.env.VITE_STELLAR_SOURCE_ACCOUNT_PRIVATE_KEY || "SAARF2ZWAHZJMKA6LXIFVNIHUBEUTMKV5NWCCUZV6ORPKLUK6RSOYZ4D";

export const SimpleSend = ({ tokenCode }: SimpleSendProps) => {
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
      // Initialize
      const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");
      const sourceKeys = StellarSdk.Keypair.fromSecret(SOURCE_SECRET);
      
      // Load accounts
      await server.loadAccount(destination); // Check destination exists
      const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
      
      // Determine asset
      let asset;
      if (tokenCode === "XLM") {
        asset = StellarSdk.Asset.native();
      } else {
        asset = new StellarSdk.Asset("USDC", "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
      }

      // Build and submit transaction
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destination,
            asset: asset,
            amount: amount,
          })
        )
        .addMemo(StellarSdk.Memo.text("Simple Send"))
        .setTimeout(180)
        .build();

      transaction.sign(sourceKeys);
      const result = await server.submitTransaction(transaction);
      
      console.log("Payment successful:", result);
      setSuccess(true);
      
      // Reset form after success
      setTimeout(() => {
        setDestination("");
        setAmount("");
        setIsModalVisible(false);
        setSuccess(false);
      }, 2000);

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
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-none transition-all duration-300 shadow-lg"
      >
        Send {tokenCode} (Simple)
      </Button>

      <Modal visible={isModalVisible} onClose={closeModal}>
        <Modal.Heading>Send {tokenCode} - Simple Demo</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <div className="text-gray-300 mb-4">
              Send {tokenCode} using the source account from environment
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
                placeholder="0.00"
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
                    <span className="text-red-400 font-medium">Error sending payment</span>
                  </div>
                  <p className="text-red-300 mt-2 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-medium">Payment sent successfully! 🎉</span>
                  </div>
                  <p className="text-green-300 mt-2 text-sm">Transaction completed</p>
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
            className="bg-green-600 hover:bg-green-500 text-white border-none transition-all duration-200"
          >
            Send Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};