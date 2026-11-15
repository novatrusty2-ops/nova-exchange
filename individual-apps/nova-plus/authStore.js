// Persistent auth storage for Nova Plus (Sign in once until explicit sign out)
export function getSession() { return localStorage.getItem("nova_session"); }
export function clearSession() { localStorage.removeItem("nova_session"); }
