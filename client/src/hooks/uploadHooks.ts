import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const CustomAxios = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development' ? 'http://localhost:5010' : '/',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

export const useUploadImageMutation = () =>
  useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await CustomAxios.post('/api/upload', formData)
      return response.data.secure_url
    },
  })
