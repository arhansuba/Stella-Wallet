import { useState } from "react";
import { Button, Modal } from "@stellar/design-system";
import { Box } from "@/components/layout/Box";

// Source account from environment - this is the receive address
const RECEIVE_ADDRESS = import.meta.env.VITE_STELLAR_SOURCE_ACCOUNT_PUBLIC_KEY || "GAX7FKBADU7HQFB3EYLCYPFKIXHE7SJSBCX7CCGXVVWJ5OU3VTWOFEI5";

interface ReceiveAddressProps {
  assetCode: "XLM" | "USDC";
}

export const ReceiveAddress = ({ assetCode }: ReceiveAddressProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <Button
        size="md"
        variant="tertiary"
        onClick={() => setIsModalVisible(true)}
        className="bg-emerald-600 hover:bg-emerald-500 text-white border-none transition-all duration-200"
      >
        Receive {assetCode}
      </Button>

      <Modal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      >
        <Modal.Heading>Receive {assetCode}</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <div className="text-gray-300 mb-4">
              Copy this address to receive {assetCode} payments
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                📍 Your Receive Address
              </label>
              
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="font-mono text-lg text-white break-all mb-3 leading-relaxed">
                  {RECEIVE_ADDRESS}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(RECEIVE_ADDRESS)}
                    className={`transition-all duration-200 ${
                      copySuccess 
                        ? "bg-green-600 hover:bg-green-500 text-white" 
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    } border-none`}
                  >
                    {copySuccess ? "✅ Copied!" : "📋 Copy Address"}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mt-4">
                <div className="text-blue-300 text-sm">
                  <p className="mb-2">
                    <strong>💡 How to receive payments:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Copy the address above</li>
                    <li>Share it with someone who wants to send you {assetCode}</li>
                    <li>They send {assetCode} to this address</li>
                    <li>You'll receive the payment automatically! ✨</li>
                  </ol>
                </div>
              </div>
            </div>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button
            size="md"
            variant="tertiary"
            onClick={() => setIsModalVisible(false)}
          >
            Close
          </Button>
          
          <Button
            size="md"
            variant="secondary"
            onClick={() => copyToClipboard(RECEIVE_ADDRESS)}
            className={`transition-all duration-200 ${
              copySuccess 
                ? "bg-green-600 hover:bg-green-500 text-white" 
                : "bg-blue-600 hover:bg-blue-500 text-white"
            } border-none`}
          >
            {copySuccess ? "✅ Copied!" : "📋 Copy Again"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};