import * as dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import path from 'path'
import { userRouter } from './routers/userRouter'
import { accountRouter } from './routers/accountRouter'
import { deathAnnouncementRouter } from './routers/deathAnnoucementRouter'
import { uploadRouter } from './routers/uploadRouter'
import { settingRouter } from './routers/settingRouter'
import { transactionRouter } from './routers/transactionRouter'
import './cron/membershipReminder'

dotenv.config({ path: path.join(__dirname, '../.env') })
mongoose.set('strictQuery', true)

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch(() => {
    console.log('Error MongoDB')
  })

const app = express()

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:5173'],
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', userRouter)
app.use('/api/accounts', accountRouter)
app.use('/api/announcements', deathAnnouncementRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/settings', settingRouter)
app.use('/api/transactions', transactionRouter)

app.get('/api/ping', (_req, res) => {
  res.send('pong')
})

app.use(express.static(path.join(__dirname, '../dist')))
app.get('/robots.txt', (_req: Request, res: Response) =>
  res.sendFile(path.join(__dirname, '../dist/robots.txt'))
)
app.get('/sitemap.xml', (_req: Request, res: Response) =>
  res.sendFile(path.join(__dirname, '../dist/sitemap.xml'))
)
app.get('*', (req: Request, res: Response) =>
  res.sendFile(path.join(__dirname, '../dist/index.html'))
)

const PORT: number = parseInt((process.env.PORT || '5010') as string, 10)

app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`)
})
