import type { HTMLAttributes } from 'vue'

type InputType = 'text' | 'password' | 'email' | 'number'

export interface InputBaseProps {
  id?: string
  name?: string
  label?: string
  hint?: string
  error?: string | null
  placeholder?: string
  inputmode?: HTMLAttributes['inputmode']
  autocomplete?: string
  autocapitalize?: string
  spellcheck?: boolean
  disabled?: boolean
  type?: InputType
}
