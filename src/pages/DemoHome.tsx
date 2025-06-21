import { useEffect, useState } from "react";
import { Badge, Button, Display, Input, Layout, Loader, Modal, Text } from "@stellar/design-system";
import { useBalance } from "@/query/useBalance";
import { useSep24Deposit } from "@/query/useSep24Deposit";
import { useSep24DepositPolling } from "@/query/useSep24DepositPolling";

import { useDemoStore } from "@/store/useDemoStore";
import { C_ACCOUNT_ED25519_SIGNER, TOKEN_CONTRACT } from "@/config/settings";
import { truncateStr } from "@/helpers/truncateStr";
import { formatBigIntWithDecimals } from "@/helpers/formatBigIntWithDecimals";
import { triggerCompleteTx } from "@/helpers/triggerCompleteTx";

import { Box } from "@/components/layout/Box";
import { ButtonsBar } from "@/components/ButtonsBar";

import { BroadcastStatusFn, TransactionStatus } from "@/types/types";

import IconUsdc from "@/assets/asset-usdc.svg?react";
import IconXlm from "@/assets/asset-xlm.svg?react";
import { snakeToTitleCase } from "@/helpers/snakeToTitleCase";
import { AuthEntrySigner } from "@/services/AuthEntrySigner";
import { TransactionHistory } from "@/components/TransactionHistory";
import { useAccountStream } from "@/hooks/useAccountStream";
import { useNotifications, NotificationContainer } from "@/components/NotificationSystem";
import { AccountTypeInfo } from "@/components/AccountTypeInfo";
import { OfficialSend } from "@/components/OfficialSend";
import { ReceiveAddress } from "@/components/ReceiveAddress";

const defaultSignerAddressId = C_ACCOUNT_ED25519_SIGNER.PUBLIC_KEY;
const defaultSignerSigningMethod: AuthEntrySigner = AuthEntrySigner.fromKeypairSecret(
  C_ACCOUNT_ED25519_SIGNER.PRIVATE_KEY,
);

const ASSET_ICON: { [key: string]: React.ReactElement } = {
  XLM: <IconXlm />,
  USDC: <IconUsdc />,
};

export const DemoHome = () => {
  const {
    tomlDomain,
    setTomlDomain,
    clearTomlDomain,
    contractSigner,
    setContractSigner,
    clearContractSigner,
    tokenInfo,
    setTokenInfo,
    clearTokenInfo,
  } = useDemoStore();

  const {
    data: fetchBalanceResponse,
    mutate: fetchBalance,
    error: fetchBalanceError,
    isPending: isFetchBalancePending,
    reset: resetFetchBalance,
  } = useBalance();

  const {
    data: sep24DepositResponse,
    mutate: sep24DepositInit,
    isPending: isSep24DepositPending,
    error: sep24DepositError,
    isSuccess: isSep24DepositSuccess,
    isError: isSep24DepositError,
    reset: resetSep24Deposit,
  } = useSep24Deposit();

  const {
    data: sep24DepositPollingResponse,
    mutate: sep24DepositPolling,
    isPending: isSep24DepositPollingPending,
    reset: resetSep24DepositPolling,
  } = useSep24DepositPolling();

  type TxStatusAndMessage = {
    status: string;
    message: string;
  };
  const [intermediateTxStatus, setIntermediateTxStatus] = useState<TxStatusAndMessage[] | undefined>(undefined);
  const [tomlDomainInput, setTomlDomainInput] = useState<string>("");
  const [contractSignerAddressIdInput, setContractSignerAddressIdInput] = useState<string>("");

  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositAddressInput, setDepositAddressInput] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  // Real-time notifications and streaming
  const { notifications, addNotification } = useNotifications();

  // Track previous balance for change detection
  const [previousBalance, setPreviousBalance] = useState<bigint | undefined>(undefined);

  const contractSignerAddressId = contractSigner?.addressId || "";
  const tokenContractId = tokenInfo?.contractId || "";
  const tokenCode = tokenInfo?.name || "";

  const interactiveUrl = sep24DepositResponse?.interactiveUrl || "";
  const sep24TransferServerUrl = sep24DepositResponse?.sep24TransferServerUrl || "";
  const sep10Token = sep24DepositResponse?.sep10Token || "";
  const transactionId = sep24DepositResponse?.interactiveId || "";

  useEffect(() => {
    setTomlDomainInput(tomlDomain || "");
  }, [tomlDomain]);

  useEffect(() => {
    setContractSignerAddressIdInput(contractSignerAddressId);
    setDepositAddressInput(contractSignerAddressId);
  }, [contractSignerAddressId]);

  useEffect(() => {
    if (contractSignerAddressId && tokenContractId) {
      fetchBalance({
        contractId: tokenContractId,
        accountId: contractSignerAddressId,
      });
    } else {
      resetFetchBalance();
    }
  }, [contractSignerAddressId, fetchBalance, resetFetchBalance, tokenContractId]);

  // Real-time account streaming
  useAccountStream(contractSignerAddressId, () => {
    if (contractSignerAddressId && tokenContractId) {
      // Refresh balance when account updates
      fetchBalance({
        contractId: tokenContractId,
        accountId: contractSignerAddressId,
      });
      
      // Show notification for account activity
      addNotification({
        message: "Account activity detected - refreshing data",
        type: "info",
        duration: 3000,
      });
    }
  });

  // Monitor balance changes for notifications
  useEffect(() => {
    if (fetchBalanceResponse !== undefined && previousBalance !== undefined) {
      if (fetchBalanceResponse > previousBalance) {
        const difference = fetchBalanceResponse - previousBalance;
        const formattedDiff = formatBigIntWithDecimals(difference, 7);
        addNotification({
          message: `Received ${formattedDiff} ${tokenCode}`,
          type: "success",
          duration: 5000,
        });
      } else if (fetchBalanceResponse < previousBalance) {
        const difference = previousBalance - fetchBalanceResponse;
        const formattedDiff = formatBigIntWithDecimals(difference, 7);
        addNotification({
          message: `Sent ${formattedDiff} ${tokenCode}`,
          type: "info",
          duration: 5000,
        });
      }
    }
    setPreviousBalance(fetchBalanceResponse);
  }, [fetchBalanceResponse, previousBalance, tokenCode, addNotification]);

  useEffect(() => {
    if (isSep24DepositError) {
      setIsDepositModalVisible(false);
    }
  }, [isSep24DepositError]);

  useEffect(() => {
    let popup: Window | null = null;

    if (!popup && isSep24DepositSuccess && interactiveUrl) {
      setIsDepositModalVisible(false);

      popup = open(interactiveUrl, "popup", "width=420,height=640");

      const trigger = async () => {
        await triggerCompleteTx({ interactiveUrl: interactiveUrl });
      };

      const interval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(interval);

          trigger();
          setIsPolling(true);
        }
      }, 2000);
    }
  }, [interactiveUrl, isSep24DepositSuccess]);

  const broadcastStatus: BroadcastStatusFn = (txStatus: TransactionStatus, message: string, isFinal: boolean) => {
    console.log(`broadcastStatus: ${txStatus}, ${message}, ${isFinal}`);

    if (!isFinal) {
      setIntermediateTxStatus((prevState) => {
        if (txStatus === TransactionStatus.INCOMPLETE) {
          return prevState;
        }

        let alreadyExists = false;
        const status = snakeToTitleCase(txStatus);

        // Check if the status and message already exist in the previous state
        if (prevState !== undefined) {
          alreadyExists = prevState.some((tx) => {
            return tx.status === status && tx.message === message;
          });
        }

        // If it doesn't exist, add it to the state, otherwise return the same state
        if (!alreadyExists) {
          return prevState ? [...prevState, { status, message }] : [{ status, message }];
        }

        return prevState; // Return the previous state if nothing changes
      });
    }
  };

  useEffect(() => {
    if (isPolling && sep24TransferServerUrl && transactionId && sep10Token) {
      sep24DepositPolling({ sep24TransferServerUrl, transactionId, sep10Token, broadcastStatus });
    }
  }, [isPolling, sep24DepositPolling, sep24TransferServerUrl, sep10Token, transactionId]);

  useEffect(() => {
    if (sep24DepositPollingResponse === TransactionStatus.COMPLETED) {
      setIsPolling(false);
      setDepositAmountInput("");
      resetSep24Deposit();

      fetchBalance({
        contractId: tokenContractId,
        accountId: contractSignerAddressId,
      });

      const t = setTimeout(() => {
        setIntermediateTxStatus(undefined);
        resetSep24DepositPolling();
        clearTimeout(t);
      }, 10000);
    }
    // Not including tokenContractId and contractSignerAddressId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBalance, resetSep24Deposit, resetSep24DepositPolling, sep24DepositPollingResponse]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Real-time notifications */}
      <NotificationContainer notifications={notifications} />
      
      <Layout.Inset>
        <div className="max-w-4xl mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Stella Wallet
            </h1>
            <p className="text-gray-400 text-lg">Passkey-based smart wallet for Stellar with SEP-10c and SEP-24 support</p>
          </div>
          
          <Box gap="xl" addlClassName="DemoHome space-y-6">
            {/* TOML */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Anchor Configuration
              </h2>
              <Box gap="sm">
                <Input
                  id="tomlDomain"
                  fieldSize="md"
                  label="Anchor TOML Domain"
                  placeholder="Enter anchor domain..."
                  onChange={(e) => {
                    setTomlDomainInput(e.target.value);
                  }}
                  value={tomlDomainInput}
                />

                <ButtonsBar
                  left={
                    <Button
                      size="md"
                      variant="tertiary"
                      disabled={!tomlDomainInput || tomlDomain === tomlDomainInput}
                      onClick={() => {
                        setTomlDomain(tomlDomainInput);
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white border-none transition-all duration-200"
                    >
                      Update
                    </Button>
                  }
                  right={
                    tomlDomain ? (
                      <Button
                        size="md"
                        variant="error"
                        onClick={() => {
                          clearTomlDomain();
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white border-none transition-all duration-200"
                      >
                        Reset
                      </Button>
                    ) : (
                      <></>
                    )
                  }
                />
              </Box>
            </div>

            {/* Account */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Account Management
              </h2>
              <Box gap="sm">
                <Input
                  id="contractSignerAddressId"
                  fieldSize="md"
                  label="Account"
                  value={contractSignerAddressIdInput}
                  onChange={(e) => {
                    setContractSignerAddressIdInput(e.target.value);
                  }}
                />

                <ButtonsBar
                  left={
                    <Button
                      size="md"
                      variant="tertiary"
                      onClick={() => {
                        setContractSigner({
                          addressId: defaultSignerAddressId,
                          method: defaultSignerSigningMethod,
                        });
                      }}
                      className="bg-green-600 hover:bg-green-500 text-white border-none transition-all duration-200"
                    >
                      Set Default Account
                    </Button>
                  }
                  right={
                    contractSignerAddressId ? (
                      <Button
                        size="md"
                        variant="error"
                        onClick={() => {
                          clearContractSigner();
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white border-none transition-all duration-200"
                      >
                        Logout
                      </Button>
                    ) : (
                      <></>
                    )
                  }
                />
              </Box>
            </div>

            {/* Balance */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-2xl">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                Balance & Assets
              </h2>
              <Box gap="sm">
                <BalanceBox
                  tokenCode={tokenCode}
                  tokenContractId={tokenContractId}
                  amount={fetchBalanceResponse}
                  isLoading={isFetchBalancePending}
                />

                <ButtonsBar
                  left={
                    <>
                      {contractSignerAddressId && tokenContractId ? (
                        <>
                          <Button
                            size="md"
                            variant="secondary"
                            onClick={() => {
                              setIsDepositModalVisible(true);
                            }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-none transition-all duration-300 shadow-lg"
                          >
                            Deposit with Cash-in
                          </Button>

                          <OfficialSend
                            tokenCode={tokenCode as "XLM" | "USDC"}
                          />

                          <ReceiveAddress
                            assetCode={tokenCode as "XLM" | "USDC"}
                          />
                        </>
                      ) : null}

                      <Button
                        size="md"
                        variant="tertiary"
                        onClick={() => {
                          setTokenInfo({
                            contractId: TOKEN_CONTRACT.NATIVE,
                            name: "XLM",
                          });
                        }}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white border-none transition-all duration-200"
                      >
                        Set XLM Asset
                      </Button>

                      <Button
                        size="md"
                        variant="tertiary"
                        onClick={() => {
                          setTokenInfo({
                            contractId: TOKEN_CONTRACT.USDC,
                            name: "USDC",
                          });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white border-none transition-all duration-200"
                      >
                        Set USDC Asset
                      </Button>
                    </>
                  }
                  right={
                    tokenContractId ? (
                      <Button
                        size="md"
                        variant="error"
                        onClick={() => {
                          clearTokenInfo();
                        }}
                        className="bg-red-600 hover:bg-red-500 text-white border-none transition-all duration-200"
                      >
                        Clear
                      </Button>
                    ) : (
                      <></>
                    )
                  }
                />

                <>
                  {fetchBalanceError ? (
                    <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-400 font-medium">Error fetching balance</span>
                      </div>
                      <p className="text-red-300 mt-2">{fetchBalanceError?.message}</p>
                    </div>
                  ) : null}
                </>
              </Box>
            </div>

            {/* Account Type Information */}
            {contractSignerAddressId ? (
              <AccountTypeInfo accountId={contractSignerAddressId} />
            ) : (
              <></>
            )}

            {/* Transaction History */}
            {contractSignerAddressId ? (
              <TransactionHistory accountId={contractSignerAddressId} />
            ) : (
              <div className="text-gray-400 text-center text-base py-8">
                Set up an account to view transaction history
              </div>
            )}

            {(isSep24DepositPollingPending ||
              (sep24DepositPollingResponse && sep24DepositPollingResponse !== TransactionStatus.COMPLETED)) ? (
                <div className="bg-blue-900/50 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Loader />
                    <span className="text-blue-400 font-medium">Deposit in progress…</span>
                  </div>
                  <div className="space-y-1">
                    {intermediateTxStatus?.map((tx, index) => (
                      <div key={index} className="text-blue-300 text-sm">
                        [{tx.status}] {tx.message}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <></>
              )}

            {sep24DepositError ? (
              <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 font-medium">Error depositing</span>
                </div>
                <p className="text-red-300 mt-2">{sep24DepositError.message}</p>
              </div>
            ) : (
              <></>
            )}

            {sep24DepositPollingResponse === TransactionStatus.COMPLETED ? (
              <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400 font-medium">Deposit completed</span>
                </div>
              </div>
            ) : (
              <></>
            )}
          </Box>
        </div>
      </Layout.Inset>
      
      <Modal
        visible={isDepositModalVisible}
        onClose={() => {
          setIsDepositModalVisible(false);
          setDepositAmountInput("");
        }}
      >
        <Modal.Heading>Deposit with Cash-in</Modal.Heading>
        <Modal.Body>
          <Box gap="sm">
            <span>Choose an amount and a destination</span>

            <Input
              id="deposit-amount"
              fieldSize="md"
              label="Amount"
              rightElement={tokenCode}
              leftElement={<span className="Deposit__inputIcon">{ASSET_ICON[tokenCode]}</span>}
              value={depositAmountInput}
              onChange={(e) => {
                setDepositAmountInput(e.target.value);
              }}
            />
            <Input
              id="deposit-address"
              fieldSize="md"
              label="Destination"
              value={depositAddressInput}
              onChange={(e) => {
                setDepositAddressInput(e.target.value);
              }}
            />
          </Box>
        </Modal.Body>
        <Modal.Footer>
          <Button
            size="md"
            variant="tertiary"
            onClick={() => {
              setIsDepositModalVisible(false);
            }}
          >
            Cancel
          </Button>

          <Button
            size="md"
            variant="secondary"
            disabled={!depositAmountInput}
            isLoading={isSep24DepositPending}
            onClick={() => {
              if (contractSigner) {
                sep24DepositInit({
                  amount: depositAmountInput,
                  address: contractSignerAddressId,
                  signer: contractSigner,
                  assetCode: tokenCode,
                  homeDomain: tomlDomainInput,
                });
              }
            }}
          >
            Confirm Deposit
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

const BalanceBox = ({
  tokenCode,
  tokenContractId,
  amount,
  isLoading,
}: {
  tokenCode: string;
  tokenContractId: string;
  amount: bigint | undefined;
  isLoading: boolean;
}): JSX.Element => {
  const renderAmount = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (amount === undefined) {
      return `- ${tokenCode}`;
    }

    return amount && tokenCode ? `${formatBigIntWithDecimals(amount, 7)} ${tokenCode}` : 0;
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-gray-600/30">
      <div className="space-y-4">
        <Text as="div" size="md" weight="medium" className="text-gray-300">
          Balance
        </Text>

        <div className="space-y-2">
          <Display as="div" size="xs" weight="medium" className="text-white text-2xl font-bold">
            {renderAmount()}
          </Display>

          {tokenContractId ? (
            <Badge variant="secondary">
              {`Asset: ${truncateStr(tokenContractId, 4)}`}
            </Badge>
          ) : (
            <Badge variant="tertiary">
              No asset selected
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
