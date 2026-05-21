import { render, screen } from '@testing-library/react';

import { AppProviders } from '../providers';
import { App } from './';

describe('App', () => {
  it('renders the main navigation layout', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByLabelText('Основная навигация')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: 'Главная',
      }),
    ).toBeInTheDocument();
  });
});
