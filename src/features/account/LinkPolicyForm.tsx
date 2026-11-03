import { useState } from 'react'
import { Callout } from '@/components/ui/Callout'
import { Icon } from '@/components/ui/Icon'
import { TextField } from '@/components/ui/TextField'
import { getErrorMessage } from '@/lib/api-error'
import { env } from '@/lib/env'
import { DEMO_POLICY_HINT } from './data'
import { useLinkPolicy } from './queries'

/** Connects an existing policy to the signed-in account. On success the policy query updates and the page re-renders. */
export function LinkPolicyForm() {
  const [policyNumber, setPolicyNumber] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [errors, setErrors] = useState<{ policyNumber?: string; idNumber?: string }>({})
  const link = useLinkPolicy()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const found = {
      policyNumber: policyNumber.trim() ? undefined : 'Enter the policy number from your documents.',
      idNumber: idNumber.trim() ? undefined : 'Enter the ID number you registered the policy with.',
    }
    setErrors(found)
    if (found.policyNumber || found.idNumber) return
    link.mutate({ policyNumber: policyNumber.trim(), idNumber: idNumber.trim() })
  }

  return (
    <form className="stack link-form" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Policy number"
        placeholder="FLA-123456"
        autoCapitalize="characters"
        value={policyNumber}
        onChange={setPolicyNumber}
        error={errors.policyNumber}
      />
      <TextField
        label="ID number"
        placeholder="63-123456-K-42"
        autoCapitalize="characters"
        value={idNumber}
        onChange={setIdNumber}
        error={errors.idNumber}
        hint="We use this once, to confirm the policy is yours."
      />

      {env.useMock && <Callout tone="info">{DEMO_POLICY_HINT}</Callout>}

      <div aria-live="polite">
        {link.error && (
          <Callout tone="danger" role="alert">
            {getErrorMessage(link.error)}
          </Callout>
        )}
      </div>

      <button type="submit" className="btn btn--primary" disabled={link.isPending}>
        <Icon name="shield" size={18} />
        {link.isPending ? 'Checking…' : 'Link my policy'}
      </button>
    </form>
  )
}
