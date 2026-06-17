/**
 * Gera URL do Google Maps para um endereço
 */
export function getMapsUrl(address: string): string {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/search/${encodedAddress}`;
}

/**
 * Abre o Google Maps em uma nova aba
 */
export function openMaps(address: string): void {
  const url = getMapsUrl(address);
  window.open(url, "_blank");
}
