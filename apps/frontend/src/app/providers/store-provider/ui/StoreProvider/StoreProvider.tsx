import type { PropsWithChildren } from 'react';
import { useRef } from 'react';
import { Provider } from 'react-redux';

import { createReduxStore, type AppStore } from '../../config/store';

export function StoreProvider({ children }: PropsWithChildren) {
  const storeRef = useRef<AppStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createReduxStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
