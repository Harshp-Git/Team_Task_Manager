import { test, expect } from '@playwright/test';

const TEST_ADMIN = { name: 'PW Admin', email: `pwadmin${Date.now()}@test.com`, password: 'Test1234', role: 'admin' };
const TEST_MEMBER = { name: 'PW Member', email: `pwmember${Date.now()}@test.com`, password: 'Test1234', role: 'member' };

test.describe('Authentication', () => {
  test('should show login page by default for unauthenticated users', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Sign Up');
    await expect(page.locator('h1')).toContainText('Create Account');
    await page.click('text=Sign In');
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'nonexistent@test.com');
    await page.fill('#login-password', 'wrongpass');
    await page.click('button[type="submit"]');
    // Should show error toast
    await expect(page.locator('.toast-error')).toBeVisible({ timeout: 5000 });
  });

  test('should signup as admin and redirect to dashboard', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('#signup-name', TEST_ADMIN.name);
    await page.fill('#signup-email', TEST_ADMIN.email);
    await page.fill('#signup-password', TEST_ADMIN.password);
    await page.selectOption('#signup-role', TEST_ADMIN.role);
    await page.click('button[type="submit"]');
    // Should redirect to dashboard
    await expect(page.locator('.sidebar-logo')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.topbar-title')).toContainText('Welcome back');
  });

  test('should signup as member', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('#signup-name', TEST_MEMBER.name);
    await page.fill('#signup-email', TEST_MEMBER.email);
    await page.fill('#signup-password', TEST_MEMBER.password);
    await page.selectOption('#signup-role', TEST_MEMBER.role);
    await page.click('button[type="submit"]');
    await expect(page.locator('.sidebar-logo')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#login-email', TEST_ADMIN.email);
    await page.fill('#login-password', TEST_ADMIN.password);
    await page.click('button[type="submit"]');
    await expect(page.locator('.sidebar-logo')).toBeVisible({ timeout: 10000 });
  });

  test('sidebar should have correct navigation links', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Projects')).toBeVisible();
  });

  test('dashboard should display stat cards', async ({ page }) => {
    await expect(page.locator('.stat-card')).toHaveCount(4);
    await expect(page.locator('.stat-label').first()).toBeVisible();
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.click('.sidebar-nav >> text=Projects');
    await expect(page.locator('.topbar-title')).toContainText('Projects');
  });

  test('admin should see create project button', async ({ page }) => {
    await page.click('.sidebar-nav >> text=Projects');
    await expect(page.locator('#create-project-btn')).toBeVisible();
  });

  test('should open and close create project modal', async ({ page }) => {
    await page.click('.sidebar-nav >> text=Projects');
    await page.click('#create-project-btn');
    await expect(page.locator('.modal-title')).toContainText('New Project');
    await page.click('.modal-close');
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('404 page should render for unknown routes', async ({ page }) => {
    await page.goto('/some-fake-page');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
