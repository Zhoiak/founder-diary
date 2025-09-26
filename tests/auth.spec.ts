import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display auth page', async ({ page }) => {
    await page.goto('/auth');
    await expect(page).toHaveTitle(/Founder Diary/);
    await expect(page.getByText('Sign in to Founder Diary')).toBeVisible();
    await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
    await expect(page.getByText('Send magic link')).toBeVisible();
    await expect(page.getByText('Continue with Google')).toBeVisible();
    await expect(page.getByText('Continue with GitHub')).toBeVisible();
  });

  test('should redirect to auth when accessing protected route', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth');
  });

  test('should validate email input', async ({ page }) => {
    await page.goto('/auth');
    await page.getByRole('button', { name: 'Send magic link' }).click();
    // Should show HTML5 validation for required email
    await expect(page.getByPlaceholder('you@company.com')).toBeFocused();
  });
});
