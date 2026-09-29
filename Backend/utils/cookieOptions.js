// Production runs over HTTPS, so the auth cookie is Secure + SameSite=None.
// Local development runs over plain http://localhost, which needs a non-Secure, Lax cookie.
export const authCookieOptions = () => {
  const isDev = process.env.NODE_ENV === "development";
  return {
    httpOnly: true,
    secure: !isDev,
    sameSite: isDev ? "lax" : "none",
  };
};
