import { render, screen } from '@testing-library/react';

import { AppProviders } from '../providers';
import { App } from './';

describe('App', () => {
  it('renders the state scaffold heading', async () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'РљР°СЂРєР°СЃ frontend-СЃРѕСЃС‚РѕСЏРЅРёСЏ',
      }),
    ).toBeInTheDocument();
  });
});
