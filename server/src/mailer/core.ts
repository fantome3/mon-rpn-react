import nodemailer from 'nodemailer'

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text?: string
  html?: string
}) => {
  const transporter = nodemailer.createTransport({
    service: process.env.NODEMAILER_SERVICE || 'gmail',
    host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_AUTH_USER || 'paiement.rpn@gmail.com',
      pass: process.env.NODEMAILER_AUTH_PASS || 'jgmw puwg usqi mcxk',
    },
  })

  const mailOptions = {
    from: `"MON-RPN" <${process.env.NODEMAILER_AUTH_USER} || 'paiement.rpn@gmail.com'>`,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  }

  return await transporter.sendMail(mailOptions)
}
