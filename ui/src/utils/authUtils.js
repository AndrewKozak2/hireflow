/** 
@param {string} userRole
@param {string[]} allowedRoles
@returns {boolean}
*/
export const hasAccess = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  return allowedRoles.includes(userRole);
};
