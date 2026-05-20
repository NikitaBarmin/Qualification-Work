import { ShellLayout } from './layouts/ShellLayout';
import { AppRouter } from './router/AppRouter';

export function App() {
  return (
    <ShellLayout>
      <AppRouter />
    </ShellLayout>
  );
}
