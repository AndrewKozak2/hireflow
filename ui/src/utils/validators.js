export const isEmailValid = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

export const isPasswordValid = (password) => {
  return password.length >= 8;
};
