import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { type Quiz, Quiz__factory } from '@oasisprotocol/rtk-quiz-backend';
export type { Quiz } from '@oasisprotocol/rtk-quiz-backend';

import { useEthereumStore } from './stores/ethereum';

const addr = import.meta.env.VITE_QUIZ_ADDR!;

export function useQuiz(): ComputedRef<Quiz | null> {
  const eth = useEthereumStore();

  return computed(() => {
    if (!eth) {
      console.error('[useQuiz] Ethereum Store not initialized');
      return null;
    }

    return Quiz__factory.connect(addr, eth.provider);
  });
}
