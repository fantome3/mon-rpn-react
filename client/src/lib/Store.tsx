import React from 'react'
import { Infos, Origines, Register, User } from '@/types/User'

type AppState = {
  userInfo?: User
}

const initialState: AppState = {
  userInfo: localStorage.getItem('userInfo')
    ? JSON.parse(localStorage.getItem('userInfo')!)
    : null,
}

type Action =
  | { type: 'USER_LOGIN'; payload: User }
  | { type: 'USER_SIGNUP'; payload: User }
  | { type: 'USER_REGISTER'; payload: Register }
  | { type: 'USER_ORIGINES'; payload: Origines }
  | { type: 'USER_INFOS'; payload: Infos }
  | { type: 'USER_SIGNOUT' }

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
      return {
        ...state!,
        userInfo: action.payload,
      }
    case 'USER_SIGNOUT':
      return undefined
    default:
      return state
  }
}

function rootReducer(state: AppState, action: Action) {
  return {
    userInfo: userInfoReducer(state.userInfo!, action),
  }
}

const defaultDispatch: React.Dispatch<Action> = () => initialState

const Store = React.createContext({
  state: initialState,
  dispatch: defaultDispatch,
})

function useAppState() {
  const [state, dispatch] = React.useReducer<React.Reducer<AppState, Action>>(
    rootReducer,
    initialState
  )
  return { state, dispatch }
}

function StoreProvider(props: React.PropsWithChildren<{}>) {
  const store = useAppState()
  return <Store.Provider value={store} {...props} />
}

export { Store, StoreProvider }
