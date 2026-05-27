/** Remove não-dígitos (alinha com backend). */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}
