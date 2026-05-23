import { Spin } from 'antd';
import type { PropsWithChildren } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/app/layouts';
import { DatasetsPage } from '@/pages/datasets';
import { HomePage } from '@/pages/home';
import { HowItWorksPage } from '@/pages/how-it-works';
import { NewAnalysisPage } from '@/pages/new-analysis';
import { SignInPage } from '@/pages/sign-in';
import { SignUpPage } from '@/pages/sign-up';
import { useAppSelector } from '@/shared/lib/store';

interface IRouteStubProps {
  title: string;
}

function RouteStub({ title }: IRouteStubProps) {
  return <h1>{title}</h1>;
}

function PublicOnlyRoute({ children }: PropsWithChildren) {
  const { initialized, status } = useAppSelector((state) => state.session);

  if (!initialized) {
    return (
      <div data-stack="h" data-align="center" data-justify="center" style={{ minHeight: 180 }}>
        <Spin />
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/analytics/new" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/analytics/new" element={<NewAnalysisPage />} />
        <Route path="/analytics" element={<RouteStub title="Аналитика" />} />
        <Route path="/settings" element={<RouteStub title="Настройки" />} />
        <Route path="/privacy" element={<RouteStub title="Политика конфиденциальности" />} />
        <Route path="/terms" element={<RouteStub title="Условия использования" />} />
        <Route path="/docs" element={<RouteStub title="Документация" />} />
        <Route path="/support" element={<RouteStub title="Поддержка" />} />
        <Route
          path="/sign-in"
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/sign-up"
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
