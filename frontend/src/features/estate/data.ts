/** BRD 6.10: organisational support after a death. Not legal advice and not estate administration. */

export type TaskGroup = 'first-days' | 'documents' | 'finances' | 'later'

export type EstateTask = { id: string; group: TaskGroup; title: string; hint: string; done: boolean; custom?: boolean }
export type EstateDocument = { id: string; name: string; obtained: boolean }
export type EstateAppointment = { id: string; title: string; date: string; note: string }
export type EstateContact = { id: string; name: string; role: string; phone: string }

export type EstateState = {
  tasks: EstateTask[]
  documents: EstateDocument[]
  appointments: EstateAppointment[]
  contacts: EstateContact[]
}

export const groupLabels: Record<TaskGroup, string> = {
  'first-days': 'First days',
  documents: 'Documents and registration',
  finances: 'Money and accounts',
  later: 'In the weeks that follow',
}

export const groupOrder: TaskGroup[] = ['first-days', 'documents', 'finances', 'later']

const t = (id: string, group: TaskGroup, title: string, hint: string): EstateTask => ({ id, group, title, hint, done: false })

export const defaultState = (): EstateState => ({
  tasks: [
    t('t1', 'first-days', 'Obtain the medical certificate or police report', 'Ask the doctor, hospital or police who attended.'),
    t('t2', 'first-days', 'Contact the funeral provider and any funeral plan', 'Have the policy number to hand.'),
    t('t3', 'first-days', 'Tell close family and agree who will coordinate', 'One person acting as a contact helps avoid confusion.'),
    t('t4', 'documents', 'Register the death with the relevant government office', 'Confirm the current process and fees with the official office.'),
    t('t5', 'documents', 'Collect certified copies of the death certificate', 'Banks and insurers usually ask for certified copies.'),
    t('t6', 'documents', 'Locate the will and the deceased person\'s identity documents', 'Check with the family lawyer or bank if you cannot find a will.'),
    t('t7', 'finances', 'List bank accounts, insurance policies, pensions and debts', 'A simple list is enough to start with.'),
    t('t8', 'finances', 'Notify employers, banks and insurers', 'Do this after you have the death certificate.'),
    t('t9', 'later', 'Speak to a qualified professional about the estate', 'A lawyer or the relevant official office can explain the legal steps. This site does not give legal advice.'),
    t('t10', 'later', 'Plan the memorial, headstone and thank-you messages', 'You can use the memorials and marketplace sections.'),
  ],
  documents: [
    { id: 'd1', name: 'Death certificate (certified copies)', obtained: false },
    { id: 'd2', name: 'Identity document of the deceased', obtained: false },
    { id: 'd3', name: 'Will, if one exists', obtained: false },
    { id: 'd4', name: 'Marriage certificate, if relevant', obtained: false },
    { id: 'd5', name: 'Insurance and funeral policy documents', obtained: false },
  ],
  appointments: [],
  contacts: [],
})

export const progress = (tasks: EstateTask[]) => {
  const done = tasks.filter((x) => x.done).length
  return { done, total: tasks.length, percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0 }
}

export const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
