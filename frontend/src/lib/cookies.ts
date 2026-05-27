const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ROLE_COOKIE = "user_role";
const MAX_AGE_DAYS = 7;

function maxAgeSeconds(days: number) {
  return days * 24 * 60 * 60;
}

export function setAuthCookies(accessToken: string, refreshToken: string, role?: string) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeSeconds(MAX_AGE_DAYS);
  document.cookie = `${ACCESS_COOKIE}=${accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${REFRESH_COOKIE}=${refreshToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
  if (role) {
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
}
