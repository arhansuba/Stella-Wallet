import { useState } from "react";
import { Button, Input, Modal } from "@stellar/design-system";
import { useSendPayment } from "@/hooks/useSendPayment";
import { validateStellarAddress, validateAmount } from "@/helpers/validation";
import { Box } from "@/components/layout/Box";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";

interface SendPaymentProps {
  contractSigner: any;
  tokenCode: "XLM" | "USDC";
  onSuccess?: () => void;
}

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

export const SendPayment = ({ contractSigner, tokenCode, onSuccess }: SendPaymentProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const { sendPayment, isPending, error, success, reset } = useSendPayment();

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
    if (!contractSigner || !validateForm()) return;

    try {
      await sendPayment({
        destination,
        amount,
        assetCode: tokenCode,
        signer: contractSigner,
      });

      // Reset form and close modal
      setDestination("");
      setAmount("");
      setValidationErrors({});
      setIsModalVisible(false);
      onSuccess?.();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const openModal = () => {
    reset();
    setValidationErrors({});
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setDestination("");
    setAmount("");
    setValidationErrors({});
    reset();
  };

  return (
    <>
      <Button
        size="md"
        variant="secondary"
        onClick={openModal}
        disabled={!contractSigner}
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-none transition-all duration-300 shadow-lg"
      >
        Send {tokenCode}
      </Button>

      <Modal visible={isModalVisible} onClose={closeModal}>
        <Modal.Heading>Send {tokenCode}</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <div className="text-gray-300 mb-4">
              Send {tokenCode} to any Stellar address
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
                  <p className="text-red-300 mt-2 text-sm">{error.message}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 font-medium">Payment sent successfully!</span>
                  </div>
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