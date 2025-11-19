/**
 * Check if user has admin role
 */
export function isAdmin(user) {
  return user?.role === 'admin'
}

/**
 * Check if user can create/edit/delete (admin only)
 */
export function canModify(user) {
  return isAdmin(user)
}

/**
 * Check if user is view-only
 */
export function isViewOnly(user) {
  return user?.role === 'viewonly' || !user?.role
}

