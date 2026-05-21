import { render, screen } from '@testing-library/react';

import { App } from './App';
import { AppProviders } from './providers/AppProviders';

describe('App', () => {
  it('renders the state scaffold heading', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Каркас frontend-состояния',
      }),
    ).toBeInTheDocument();
  });
});
