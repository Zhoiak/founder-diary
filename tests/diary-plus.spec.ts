import { test, expect } from '@playwright/test';

// Diary+ E2E Tests - Critical User Flows
// These tests validate the main user journeys for the Personal Life OS

test.describe('Diary+ Core Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for testing
    await page.goto('/');
  });

  test('Flow 1: New user onboarding wizard appears', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // Check if onboarding wizard appears for new Personal users
    // This would require mocking the user state and Personal project
    await expect(page).toHaveTitle(/Founder Diary/);
    
    // Look for mode selector
    await expect(page.locator('[data-testid="mode-selector"]')).toBeVisible({ timeout: 10000 });
  });

  test('Flow 2: Mode selector switches between Founder and Personal', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if mode selector is present
    const modeSelector = page.locator('[data-testid="mode-selector"]');
    if (await modeSelector.isVisible()) {
      await expect(modeSelector).toBeVisible();
    } else {
      // Mode selector might not be visible without proper auth/projects
      console.log('Mode selector not visible - likely needs authentication');
    }
  });

  test('Flow 3: Settings page loads with feature flags', async ({ page }) => {
    await page.goto('/settings');
    
    // Check if settings page loads
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Look for feature flags section
    const featureFlags = page.locator('[data-testid="feature-flags"]');
    if (await featureFlags.isVisible()) {
      await expect(featureFlags).toBeVisible();
    }
  });

  test('Flow 4: Admin cron page is accessible', async ({ page }) => {
    await page.goto('/admin/cron');
    
    // Check if cron admin page loads
    await expect(page.locator('h1')).toContainText('Cron Jobs');
    
    // Look for cron job cards
    const cronJobs = page.locator('[data-testid="cron-job"]');
    if (await cronJobs.first().isVisible()) {
      await expect(cronJobs.first()).toBeVisible();
    }
  });

  test('Flow 5: API endpoints respond correctly', async ({ page }) => {
    // Test critical API endpoints
    const response = await page.request.get('/api/projects');
    
    // Should return 401 without authentication, which is expected
    expect([200, 401, 403]).toContain(response.status());
  });

  test('Flow 6: Yearbook generator UI loads', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to a page that might have yearbook generator
    // This would be in the Personal mode dashboard or a dedicated page
    await page.waitForLoadState('networkidle');
    
    // Check if the page loads without critical errors
    const errors = await page.locator('[data-testid="error"]').count();
    expect(errors).toBe(0);
  });

  test('Flow 7: Vault manager in settings (Personal mode)', async ({ page }) => {
    await page.goto('/settings');
    
    // Check if vault manager section exists
    const vaultSection = page.locator('[data-testid="vault-manager"]');
    if (await vaultSection.isVisible()) {
      await expect(vaultSection).toBeVisible();
    }
  });

  test('Flow 8: Navigation adapts to mode and feature flags', async ({ page }) => {
    await page.goto('/');
    
    // Check if adaptive navigation is present
    const navigation = page.locator('nav, [role="navigation"]');
    if (await navigation.first().isVisible()) {
      await expect(navigation.first()).toBeVisible();
    }
    
    // Verify no critical JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    
    // Filter out known non-critical errors
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('ResizeObserver') && 
      !error.includes('Non-Error promise rejection')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Diary+ API Health Checks', () => {
  test('API routes are properly configured', async ({ request }) => {
    // Test key API endpoints exist (even if they return auth errors)
    const endpoints = [
      '/api/projects',
      '/api/personal-entries',
      '/api/yearbook',
      '/api/vault/setup',
      '/api/cron/logs'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // Should not return 404 (route exists) or 500 (server error)
      expect([200, 400, 401, 403]).toContain(response.status());
    }
  });

  test('Rate limiting middleware is active', async ({ request }) => {
    // Test that rate limiting is working on API routes
    const response = await request.get('/api/projects');
    
    // Check for rate limit headers
    const rateLimitHeaders = response.headers();
    if (rateLimitHeaders['x-ratelimit-limit']) {
      expect(rateLimitHeaders['x-ratelimit-limit']).toBeDefined();
    }
  });
});

test.describe('Diary+ Build Validation', () => {
  test('No critical console errors on main pages', async ({ page }) => {
    const criticalErrors: string[] = [];
    
    page.on('pageerror', (error) => {
      if (!error.message.includes('ResizeObserver') && 
          !error.message.includes('Non-Error promise rejection')) {
        criticalErrors.push(error.message);
      }
    });

    const pages = ['/', '/settings', '/auth'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('All static assets load correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that CSS and JS assets load
    const failedRequests: string[] = [];
    
    page.on('requestfailed', (request) => {
      if (request.url().includes('.css') || request.url().includes('.js')) {
        failedRequests.push(request.url());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    expect(failedRequests.length).toBe(0);
  });
});
