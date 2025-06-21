import { Loader } from "@stellar/design-system";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { truncateStr } from "@/helpers/truncateStr";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";

interface TransactionHistoryProps {
  accountId: string;
}

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

export const TransactionHistory = ({ accountId }: TransactionHistoryProps) => {
  const { transactions, isLoading, error, refetch } = useTransactionHistory(accountId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: string, type: "sent" | "received") => {
    const sign = type === "sent" ? "-" : "+";
    const color = type === "sent" ? "text-red-400" : "text-green-400";
    return (
      <span className={`font-medium ${color}`}>
        {sign}{parseFloat(amount).toFixed(2)}
      </span>
    );
  };

  if (!accountId) {
    return (
      <div className="bg-gray-800/30 rounded-lg p-6 text-center">
        <div className="text-gray-400">Set up an account to view transaction history</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
          Transaction History
        </h2>
        <button
          onClick={refetch}
          className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader />
          <span className="ml-2 text-gray-400">Loading transactions...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-400 font-medium">Error loading transactions</span>
          </div>
          <p className="text-red-300 mt-2 text-sm">{error.message}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No transactions found</div>
          <div className="text-gray-500 text-sm">Make your first payment to see it here</div>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-black/20 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {ASSET_ICON[tx.assetCode] || <div className="w-6 h-6 bg-gray-500 rounded-full" />}
                    <div>
                      <div className="flex items-center space-x-2">
                        <div className="text-white font-medium">
                          {tx.type === "sent" ? "Sent" : "Received"} {tx.assetCode}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          tx.type === "sent" 
                            ? "bg-red-900/50 text-red-300" 
                            : "bg-green-900/50 text-green-300"
                        }`}>
                          {tx.type}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {tx.type === "sent" ? "To: " : "From: "}
                        <span className="font-mono">
                          {truncateStr(tx.type === "sent" ? tx.to : tx.from, 6)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg">
                    {formatAmount(tx.amount, tx.type)} {tx.assetCode}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {formatDate(tx.createdAt)}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-600/30">
                <div className="text-gray-400 text-xs font-mono">
                  Hash: {truncateStr(tx.hash, 8)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};