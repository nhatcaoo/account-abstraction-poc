// import * as typ from "./SolidityTypes";

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: number;
  verificationGasLimit: number;
  preVerificationGas: number;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}
