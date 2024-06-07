import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { motion } from 'framer-motion'

const CustomButton = () => {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className='p-16 text-center'
    >
      <Button onClick={() => navigate('/register')}>
        S'incrire maintenant
      </Button>
    </motion.div>
  )
}

export default CustomButton
