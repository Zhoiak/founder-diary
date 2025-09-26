import { test, expect } from '@playwright/test';

// Note: These tests require a logged-in user
// In a real setup, you'd create test users and handle auth state

test.describe('Dashboard', () => {
  test.skip('should display dashboard for authenticated user', async ({ page }) => {
    // Skip for now - would need proper test auth setup
    await page.goto('/');
    await expect(page.getByText('Founder Diary')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test.skip('should allow creating a new project', async ({ page }) => {
    // Skip for now - would need proper test auth setup
    await page.goto('/');
    await page.getByText('New Project').click();
    await page.getByPlaceholder('My Startup').fill('Test Project');
    await page.getByText('Create Project').click();
    await expect(page.getByText('Test Project')).toBeVisible();
  });
});
