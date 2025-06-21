import { useState } from "react";
import { Button, Modal, Input } from "@stellar/design-system";
import { Box } from "@/components/layout/Box";

interface QRGeneratorProps {
  assetCode: "XLM" | "USDC";
}

// Use the source account from environment for receiving payments
const RECEIVE_ADDRESS = import.meta.env.VITE_STELLAR_SOURCE_ACCOUNT_PUBLIC_KEY || "GAX7FKBADU7HQFB3EYLCYPFKIXHE7SJSBCX7CCGXVVWJ5OU3VTWOFEI5";

export const QRGenerator = ({ assetCode }: QRGeneratorProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [amount, setAmount] = useState("");

  const generatePaymentURL = () => {
    const baseURL = "web+stellar:pay";
    const params = new URLSearchParams({
      destination: RECEIVE_ADDRESS,
      ...(amount && { amount }),
      ...(assetCode !== "XLM" && { asset_code: assetCode }),
    });
    
    return `${baseURL}?${params.toString()}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const paymentURL = generatePaymentURL();

  return (
    <>
      <Button
        size="md"
        variant="tertiary"
        onClick={() => setIsModalVisible(true)}
        className="bg-cyan-600 hover:bg-cyan-500 text-white border-none transition-all duration-200"
      >
        Receive {assetCode}
      </Button>

      <Modal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          setAmount("");
        }}
      >
        <Modal.Heading>Receive {assetCode}</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <div className="text-gray-300 mb-4">
              Share this address to receive {assetCode} payments
            </div>

            <Input
              id="amount"
              fieldSize="md"
              label="Amount (optional)"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ✅ Receive Address (Working Account)
                </label>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <div className="font-mono text-sm text-gray-300 break-all">
                    {RECEIVE_ADDRESS}
                  </div>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => copyToClipboard(RECEIVE_ADDRESS)}
                    className="mt-2 bg-gray-700 hover:bg-gray-600 text-white border-none"
                  >
                    Copy Address
                  </Button>
                </div>
                <div className="text-green-400 text-xs mt-1">
                  💡 This is a regular Stellar account (G...) that can send and receive payments
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Link
                </label>
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                  <div className="font-mono text-sm text-gray-300 break-all">
                    {paymentURL}
                  </div>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => copyToClipboard(paymentURL)}
                    className="mt-2 bg-gray-700 hover:bg-gray-600 text-white border-none"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>

              {/* Simple QR Code placeholder */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-32 h-32 bg-gray-200 rounded flex items-center justify-center">
                    <div className="text-gray-500 text-xs text-center">
                      QR Code<br/>
                      {RECEIVE_ADDRESS.slice(0, 8)}...
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  Scan to send {assetCode} to this address
                </div>
              </div>
            </div>
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button
            size="md"
            variant="tertiary"
            onClick={() => {
              setIsModalVisible(false);
              setAmount("");
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};