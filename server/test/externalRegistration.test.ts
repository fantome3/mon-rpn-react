import { test, strictEqual, ok } from 'node:test'
import { sendExternalRegistrationFailureEmail } from '../src/mailer/externalRegistration'
import * as core from '../src/mailer/core'

process.env.ADMIN_EMAIL = 'admin@test.com'

test('sendExternalRegistrationFailureEmail uses ADMIN_EMAIL', async () => {
  let calledOpts: any
  const original = core.sendEmail
  core.sendEmail = async (opts: any) => {
    calledOpts = opts
  }
  await sendExternalRegistrationFailureEmail('user@test.com', 'fail')
  strictEqual(calledOpts.to, 'admin@test.com')
  ok(calledOpts.subject.includes('Erreur'))
  core.sendEmail = original
})
