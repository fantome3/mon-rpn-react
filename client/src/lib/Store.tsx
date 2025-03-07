/* eslint-disable @typescript-eslint/ban-types */
import React, { useCallback, useEffect } from 'react'
import { Infos, Origines, Register, User } from '@/types/User'
import { Account } from '@/types/Account'

type AppState = {
  userInfo?: User
  accountInfo?: Account
}

const initialState: AppState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo')!)
    : null,
  accountInfo: localStorage.getItem('accountInfo')
    ? JSON.parse(localStorage.getItem('accountInfo')!)
    : null,
}

type Action =
  | { type: 'USER_LOGIN'; payload: User }
  | { type: 'USER_SIGNUP'; payload: User }
  | { type: 'USER_REGISTER'; payload: Register }
  | { type: 'USER_ORIGINES'; payload: Origines }
  | { type: 'USER_INFOS'; payload: Infos }
  | { type: 'USER_SIGNOUT' }
  | { type: 'ACCOUNT_INFOS'; payload: Account }
  | { type: 'CLEAR_ACCOUNT' }

function accountInfoReducer(state: Account, action: Action) {
  switch (action.type) {
    case 'ACCOUNT_INFOS':
      return action.payload
    case 'CLEAR_ACCOUNT':
      return undefined
    default:
      return state
  }
}

function userInfoReducer(state: User, action: Action) {
  switch (action.type) {
    case 'USER_LOGIN':
      return action.payload
    case 'USER_REGISTER':
      return {
        ...state!,
        register: action.payload,
        registerTime: new Date(),
      }
    case 'USER_INFOS':
      return {
        ...state!,
        infos: action.payload,
        infosTime: new Date(),
      }
    case 'USER_ORIGINES':
      return {
        ...state!,
        origines: action.payload,
        originesTime: new Date(),
      }

    case 'USER_SIGNUP':
      return action.payload

    case 'USER_SIGNOUT':
      return undefined
    default:
      return state
  }
}

function rootReducer(state: AppState, action: Action) {
  return {
    userInfo: userInfoReducer(state.userInfo!, action),
    accountInfoReducer: accountInfoReducer(state.accountInfo!, action),
  }
}

const defaultDispatch: React.Dispatch<Action> = () => initialState

const Store = React.createContext<{
  state: AppState
  dispatch: React.Dispatch<Action>
  logoutHandler: () => void
  disconnectAfter10Minutes: () => void
}>({
  state: initialState,
  dispatch: defaultDispatch,
  logoutHandler: () => {},
  disconnectAfter10Minutes: () => {},
})

function useAppState() {
  const [state, dispatch] = React.useReducer<React.Reducer<AppState, Action>>(
    rootReducer,
    initialState
  )

  const logoutHandler = useCallback(() => {
    dispatch({ type: 'USER_SIGNOUT' })
    dispatch({ type: 'CLEAR_ACCOUNT' })
    localStorage.removeItem('userInfo')
    localStorage.removeItem('accountInfo')
    window.location.reload()
  }, [dispatch])

  const disconnectAfter10Minutes = useCallback(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo')!)

    if (!userInfo.registerTime) return

    const registerTime = new Date(userInfo.registerTime).getTime()
    const oginesTime = userInfo?.originesTime
      ? new Date(userInfo.originesTime).getTime()
      : null

    const checkTimeElapsed = () => {
      const currentTime = Date.now()
      const elapsedRegisterTimeMinutes = (currentTime - registerTime) / 60000
      const elapsedOriginesTimeMinutes = oginesTime
        ? (currentTime - oginesTime) / 60000
        : null

      console.log(
        `⏳ Temps écoulé : ${elapsedRegisterTimeMinutes.toFixed(2)} minutes`
      )
      console.log(`⏳ Temps écoulé : ${elapsedOriginesTimeMinutes!} minutes`)

      if (elapsedRegisterTimeMinutes >= 10 && !userInfo?.infos) {
        console.log('⏳ Déconnexion : inscription incomplète après 10 minutes')
        window.location.href = '/register'
        localStorage.removeItem('userInfo')
        return
      }

      if (
        elapsedOriginesTimeMinutes !== null &&
        elapsedOriginesTimeMinutes >= 10 &&
        !userInfo?.infos
      ) {
        console.log('⏳ Déconnexion : origines incomplètes après 10 minutes')
        window.location.href = '/register'
        localStorage.removeItem('userInfo')
        return
      }
    }

    checkTimeElapsed()

    const interval = setInterval(() => {
      checkTimeElapsed()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (state.userInfo?.registerTime) {
      const cleanup = disconnectAfter10Minutes()
      return cleanup
    }
  }, [state.userInfo, disconnectAfter10Minutes])

  return { state, dispatch, logoutHandler, disconnectAfter10Minutes }
}

function StoreProvider(props: React.PropsWithChildren<{}>) {
  const store = useAppState()
  return <Store.Provider value={store} {...props} />
}

export { Store, StoreProvider }
