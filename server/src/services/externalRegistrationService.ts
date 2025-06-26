import puppeteer, { Page } from 'puppeteer'
import { sendExternalRegistrationFailureEmail } from '../mailer'

type RegistrationPayload = {
  register: {
    email: string
    password: string
    conditions: boolean
    institution?: string | null
  }
  origines: {
    firstName: string
    lastName: string
    birthDate: string
    nativeCountry: string
    sex: string
  }
  infos: {
    tel: string
  }
}

async function loginToExternalApp(page: Page) {
  const email = process.env.EXTERNAL_APP_EMAIL || ''
  const password = process.env.EXTERNAL_APP_PASSWORD || ''
  await page.goto('https://app.notrerpn.org/auth/login')
  await page.type('input[name="login"]', email)
  await page.type('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}

async function fillMemberForm(page: Page, payload: RegistrationPayload) {
  await page.goto('https://app.notrerpn.org/communities/members/add')
  // Scroll jusqu'à "Province"
  await page.evaluate(() => {
    const provinceLabel = document.querySelector('label[for="region-label"], #region-label');
    if (provinceLabel) {
      provinceLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  await page.type('input[name="firstName"]', payload.origines.firstName)
  await page.type('input[name="lastName"]', payload.origines.lastName)
  await page.type('input[name="birthDate"]', payload.origines.birthDate)
  await page.type('input[name="email"]', payload.register.email)
  await page.type('input[name="phoneNumber"]', payload.infos.tel.replace(/[^0-9]/g, ''))
  await page.click(`input[name="gender"][value="${payload.origines.sex[0].toUpperCase()}"]`)
  await page.evaluate(() => {
    const nat = document.querySelector('input[name="nationality"]') as HTMLInputElement
    if (nat) nat.value = 'CMR'
  })

  await page.type('input[name="city"]', 'Montréal')
  await page.evaluate(() => {
    const region = document.querySelector('input[name="region"]') as HTMLInputElement
    const country = document.querySelector('input[name="country"]') as HTMLInputElement
    if (region) region.value = 'QC'
    if (country) country.value = 'CA'
  })

  await new Promise(resolve => setTimeout(resolve, 500));
  await page.screenshot({ path: 'remplirInfos_1.png' });

  await page.evaluate(() => {
    const memberType = document.querySelector('input[name="memberType"]') as HTMLInputElement
    if (memberType) memberType.value = 'n.resident'
  })
  await page.click('input[name="arrivalDateAfterLimit"][value="TRUE"]')
  // Scroll jusqu'au bouton "Enregistrer"
  await page.evaluate(() => {
    const submitButton = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent?.includes('Enregistrer'));
    if (submitButton) {
      submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));
  await page.screenshot({ path: 'remplirInfos_2.png' });

  //await page.click('button[type="submit"]')
  await page.waitForNavigation({ waitUntil: 'networkidle0' })
}

export const registerUserOnExternalApp = async (payload: RegistrationPayload) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  try {
    await loginToExternalApp(page)
    await fillMemberForm(page, payload)
  } catch (error: any) {
    await sendExternalRegistrationFailureEmail(payload.register.email, error.message)
    throw error
  } finally {
    await browser.close()
  }
}
