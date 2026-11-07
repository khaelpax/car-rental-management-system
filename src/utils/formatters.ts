/**
 * Formats a numeric value into Indonesian Rupiah (IDR) currency format.
 * Example: 450000 -> "Rp 450.000"
 */
export const formatIDR = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};
