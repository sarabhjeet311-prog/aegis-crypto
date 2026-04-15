import { analyzeAddress } from '../lib/analyze';
import { updateLeaderboard } from '../lib/leaderboard';

export interface ScanState {
  loading: boolean;
  error: string | null;
  result: unknown | null;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function useScanner() {
  const scanState: ScanState = {
    loading: false,
    error: null,
    result: null
  };

  const reset = () => {
    scanState.loading = false;
    scanState.error = null;
    scanState.result = null;
  };

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleScan = async (input: string): Promise<void> => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    return new Promise((resolve) => {
      debounceTimer = setTimeout(async () => {
        const address = input.trim();

        if (!address) {
          scanState.error = 'Please enter an address';
          scanState.loading = false;
          resolve();
          return;
        }

        if (!validateAddress(address)) {
          scanState.error = 'Invalid Ethereum address format';
          scanState.loading = false;
          resolve();
          return;
        }

        scanState.loading = true;
        scanState.error = null;
        scanState.result = null;

        try {
          const result = await analyzeAddress(address);

          if (!result) {
            scanState.error = 'Failed to analyze address';
          } else {
            scanState.result = result;
            updateLeaderboard({
              name: result.name,
              symbol: result.symbol,
              logo: result.logo,
              aegisScore: result.aegis.score,
              type: 'token'
            });
          }
        } catch (error) {
          scanState.error = 'Analysis failed: ' + ((error as Error).message || 'Unknown error');
        } finally {
          scanState.loading = false;
        }

        resolve();
      }, 300);
    });
  };

  return {
    scanState,
    handleScan,
    reset
  };
}
