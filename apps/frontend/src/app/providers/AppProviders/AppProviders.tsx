import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { SessionBootstrap } from '../session-bootstrap';
import { StoreProvider } from '../store-provider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#163B68',
          colorSuccess: '#2E8B57',
          colorError: '#C54A4A',
          colorBgLayout: '#F4F7FB',
          colorText: '#16202F',
          borderRadius: 16,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }}
    >
      <AntdApp>
        <StoreProvider>
          <BrowserRouter>
            <SessionBootstrap>{children}</SessionBootstrap>
          </BrowserRouter>
        </StoreProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
