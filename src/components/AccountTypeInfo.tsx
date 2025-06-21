import { isContractAddress } from "@/helpers/validation";

interface AccountTypeInfoProps {
  accountId: string;
}

export const AccountTypeInfo = ({ accountId }: AccountTypeInfoProps) => {
  if (!accountId) return null;

  const isContract = isContractAddress(accountId);

  if (isContract) {
    return (
      <div className="bg-yellow-900/50 border border-yellow-500/50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-yellow-400 font-medium">Smart Contract Account</span>
        </div>
        <div className="text-yellow-300 mt-2 text-sm">
          <p className="mb-2">
            Your account <span className="font-mono text-xs">{accountId}</span> is a smart contract address (starts with C...).
          </p>
          <p className="mb-2">
            <strong>Send Payments:</strong> Not available for smart contract addresses. Classic Stellar payments require regular accounts (G...).
          </p>
          <p>
            <strong>Receive Payments & View Balance:</strong> ✅ Available and working normally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-green-400 font-medium">Regular Stellar Account</span>
      </div>
      <div className="text-green-300 mt-2 text-sm">
        <p>
          Your account <span className="font-mono text-xs">{accountId}</span> is a regular Stellar account.
          All wallet features are available! ✅
        </p>
      </div>
    </div>
  );
};