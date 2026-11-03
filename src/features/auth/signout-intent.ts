// Tells the route guard why the user disappeared: they pressed "Sign out" (go home) or their session expired
// (go to sign-in and come back). A plain module flag because it only matters for the single render in between.
let intentional = false

export const markIntentionalSignOut = () => {
  intentional = true
}

export const clearSignOutIntent = () => {
  intentional = false
}

export const isIntentionalSignOut = () => intentional
