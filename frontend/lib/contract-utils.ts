import { cvToJSON, hexToCV } from '@stacks/transactions';

export interface ContractCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const parseContractResponse = (response: string): ContractCallResult => {
  try {
    const cv = hexToCV(response);
    const json = cvToJSON(cv);
    return { success: true, data: json };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
