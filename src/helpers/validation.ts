import * as StellarSdk from "@stellar/stellar-sdk";

export const validateStellarAddress = (address: string): { isValid: boolean; error?: string } => {
  if (!address) {
    return { isValid: false, error: "Address is required" };
  }

  // Check for regular Stellar account (starts with G)
  if (StellarSdk.StrKey.isValidEd25519PublicKey(address)) {
    return { isValid: true };
  }

  // Check for contract address (starts with C)
  if (StellarSdk.StrKey.isValidContract(address)) {
    return { isValid: false, error: "Contract addresses not supported for payments. Use G... address." };
  }

  return { isValid: false, error: "Invalid Stellar address format (must start with G)" };
};

export const validateAmount = (amount: string): { isValid: boolean; error?: string } => {
  if (!amount) {
    return { isValid: false, error: "Amount is required" };
  }

  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: "Amount must be a positive number" };
  }

  if (num > 1000000) {
    return { isValid: false, error: "Amount too large" };
  }

  return { isValid: true };
};

export const isContractAddress = (address: string): boolean => {
  return StellarSdk.StrKey.isValidContract(address);
};

export const isRegularStellarAccount = (address: string): boolean => {
  return StellarSdk.StrKey.isValidEd25519PublicKey(address);
};