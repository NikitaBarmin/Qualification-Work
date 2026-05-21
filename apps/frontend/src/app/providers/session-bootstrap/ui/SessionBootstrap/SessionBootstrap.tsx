import type { PropsWithChildren } from 'react';

import { useGetCurrentSessionQuery } from '@/entities/session';

export function SessionBootstrap({ children }: PropsWithChildren) {
  useGetCurrentSessionQuery();

  return children;
}
