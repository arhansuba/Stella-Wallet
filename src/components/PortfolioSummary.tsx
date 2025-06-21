import { Badge, Loader } from "@stellar/design-system";
import { formatBigIntWithDecimals } from "@/helpers/formatBigIntWithDecimals";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";

interface PortfolioSummaryProps {
  xlmBalance?: bigint;
  usdcBalance?: bigint;
  isLoadingXlm?: boolean;
  isLoadingUsdc?: boolean;
  activeAsset?: string;
}

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

export const PortfolioSummary = ({ 
  xlmBalance, 
  usdcBalance, 
  isLoadingXlm, 
  isLoadingUsdc,
  activeAsset 
}: PortfolioSummaryProps) => {
  const formatBalance = (balance: bigint | undefined, symbol: string, isLoading: boolean) => {
    if (isLoading) return <Loader size="sm" />;
    if (balance === undefined) return `0.00 ${symbol}`;
    return `${formatBigIntWithDecimals(balance, 7)} ${symbol}`;
  };

  const hasAnyBalance = xlmBalance !== undefined || usdcBalance !== undefined;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
        Portfolio Overview
      </h2>

      {!hasAnyBalance ? (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">No assets detected</div>
          <div className="text-gray-500 text-sm">Select an asset above to view your balance</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* XLM Balance */}
          <div className={`bg-black/20 rounded-lg p-4 border transition-all duration-200 ${
            activeAsset === "XLM" 
              ? "border-yellow-500/50 ring-1 ring-yellow-500/20" 
              : "border-gray-600/30"
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {ASSET_ICON.XLM}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-300 font-medium">XLM</div>
                  {activeAsset === "XLM" && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
                <div className="text-white text-lg font-semibold">
                  {formatBalance(xlmBalance, "XLM", isLoadingXlm || false)}
                </div>
              </div>
            </div>
          </div>

          {/* USDC Balance */}
          <div className={`bg-black/20 rounded-lg p-4 border transition-all duration-200 ${
            activeAsset === "USDC" 
              ? "border-indigo-500/50 ring-1 ring-indigo-500/20" 
              : "border-gray-600/30"
          }`}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {ASSET_ICON.USDC}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-300 font-medium">USDC</div>
                  {activeAsset === "USDC" && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
                <div className="text-white text-lg font-semibold">
                  {formatBalance(usdcBalance, "USDC", isLoadingUsdc || false)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-600/30">
        <div className="text-gray-400 text-sm text-center">
          Portfolio automatically updates in real-time
        </div>
      </div>
    </div>
  );
};