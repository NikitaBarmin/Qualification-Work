import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/app/layouts';

interface IRouteStubProps {
  title: string;
}

function RouteStub({ title }: IRouteStubProps) {
  return <h1>{title}</h1>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RouteStub title="???????" />} />
        <Route path="/how-it-works" element={<RouteStub title="??? ??? ????????" />} />
        <Route path="/datasets" element={<RouteStub title="??? ????????" />} />
        <Route path="/analytics/new" element={<RouteStub title="????? ?????????" />} />
        <Route path="/analytics" element={<RouteStub title="?????????" />} />
        <Route path="/settings" element={<RouteStub title="?????????" />} />
        <Route path="/sign-in" element={<RouteStub title="???????????" />} />
        <Route path="/sign-up" element={<RouteStub title="???????????" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
