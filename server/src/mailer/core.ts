import nodemailer from 'nodemailer'
import path from 'path'

const imagePath = (file: string) => path.join(__dirname, 'assets/emails', file)

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
    from: `"MON ACQ-RPN" <${process.env.NODEMAILER_AUTH_USER} || 'paiement.rpn@gmail.com'>`,
    to,
    bcc: '<romsdjo@gmail.com>',
    subject,
    text,
    html: html || `<p>${text}</p>`,
    attachments: [
    {
      filename: 'drapeau-cameroun.jpg',
      path: imagePath('drapeau-cameroun.jpg'),
      cid: 'drapeau-cameroun.jpg'
    },
    {
      filename: 'logo-Acq-jpeg.jpg',
      path: imagePath('logo-Acq-jpeg.jpg'),
      cid: 'logo-Acq-jpeg.jpg'
    },
    {
      filename: 'amoirie-cameroun.jpg',
      path: imagePath('amoirie-cameroun.jpg'),
      cid: 'amoirie-cameroun.jpg'
    }
  ]
  }

  return await transporter.sendMail(mailOptions)
}
