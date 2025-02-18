/* eslint-disable @typescript-eslint/ban-types */
import React, { useCallback } from 'react'
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
      }
    case 'USER_INFOS':
      return {
        ...state!,
        infos: action.payload,
      }
    case 'USER_ORIGINES':
      return {
        ...state!,
        origines: action.payload,
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

const Store = React.createContext({
  state: initialState,
  dispatch: defaultDispatch,
  logoutHandler: () => {},
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
  }, [dispatch])

  return { state, dispatch, logoutHandler }
}

function StoreProvider(props: React.PropsWithChildren<{}>) {
  const store = useAppState()
  return <Store.Provider value={store} {...props} />
}

export { Store, StoreProvider }
