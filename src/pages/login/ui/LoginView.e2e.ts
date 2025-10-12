import { test, expect } from '@playwright/test'

const MYSELF_ENDPOINT = '**/myself'

const successfulUser = {
  self: '/myself',
  uid: 1,
  login: 'test.user',
  trackerUid: 1,
  passportUid: 1,
  cloudUid: '1',
  firstName: 'Test',
  lastName: 'User',
  display: 'Test User',
  email: 'test@example.com',
  external: false,
  hasLicense: true,
  dismissed: false,
  useNewFilters: true,
  disableNotifications: false,
  firstLoginDate: '2024-01-01T00:00:00Z',
  lastLoginDate: '2024-01-02T00:00:00Z',
  welcomeMailSent: true,
  sources: []
}

test.describe('LoginView e2e', () => {
  test('выполняет успешную авторизацию и перенаправляет на таймшит', async ({ page }) => {
    await page.route(MYSELF_ENDPOINT, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successfulUser)
      })
    })

    await page.goto('/login')

    const tokenInput = page.locator('input[name="oauth-token"]')
    const submitButton = page.getByRole('button', { name: 'Войти' })

    await expect(submitButton).toBeDisabled()

    await tokenInput.fill('token-123')
    await expect(submitButton).toBeEnabled()

    const navigation = page.waitForURL(/\/timesheet$/)
    await submitButton.click()

    await expect(page.locator('.password-placeholder')).toBeVisible()
    await navigation

    await expect(page.locator('.password-placeholder')).toHaveCount(0)
    await expect(page).toHaveURL(/\/timesheet$/)
  })

  test('показывает ошибку и уведомление при неуспешной авторизации', async ({ page }) => {
    await page.route(MYSELF_ENDPOINT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null'
      })
    })

    await page.goto('/login')

    const tokenInput = page.locator('input[name="oauth-token"]')
    const submitButton = page.getByRole('button', { name: 'Войти' })

    await tokenInput.fill('invalid-token')
    await submitButton.click()

    const dangerToast = page.locator('.toast.danger .title')
    const errorMessage = page.locator('p.error[role="alert"]')

    await expect(dangerToast).toHaveText('Неверный токен')
    await expect(errorMessage).toHaveText('Неверный токен')
    await expect(submitButton).toBeEnabled()
  })

  test('позволяет повторить попытку после ошибки и завершает авторизацию', async ({ page }) => {
    let attempt = 0

    await page.route(MYSELF_ENDPOINT, async (route) => {
      attempt += 1
      if (attempt === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'null'
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successfulUser)
      })
    })

    await page.goto('/login')

    const tokenInput = page.locator('input[name="oauth-token"]')
    const submitButton = page.getByRole('button', { name: 'Войти' })

    await tokenInput.fill('invalid-token')
    await submitButton.click()

    const errorMessage = page.locator('p.error[role="alert"]')

    await expect(errorMessage).toHaveText('Неверный токен')

    await tokenInput.fill('valid-token')
    await expect(errorMessage).toHaveCount(0)

    const navigation = page.waitForURL(/\/timesheet$/)
    await submitButton.click()
    await navigation

    await expect(page).toHaveURL(/\/timesheet$/)
  })
})
