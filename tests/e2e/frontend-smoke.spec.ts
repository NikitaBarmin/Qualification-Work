import { expect, test } from '@playwright/test';

test('frontend state scaffold page is reachable', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Каркас frontend-состояния' })).toBeVisible();
});
