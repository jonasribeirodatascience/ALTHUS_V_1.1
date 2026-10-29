/**
 * ALTHUS by DATALIS — Utilitários de Documento (CPF / CNPJ)
 * Validações de dígitos verificadores e formatação para conformidade LGPD.
 */

export function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

/**
 * Validação dos dígitos verificadores do CPF (11 dígitos numéricos)
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cleanDocument(cpf);
  if (clean.length !== 11) return false;

  // Rejeita sequências de dígitos idênticos (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação dos dígitos verificadores do CNPJ (14 dígitos numéricos)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cleanDocument(cnpj);
  if (clean.length !== 14) return false;

  // Rejeita sequências de dígitos idênticos
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // Primeiro dígito verificador
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0), 10)) return false;

  // Segundo dígito verificador
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1), 10)) return false;

  return true;
}

/**
 * Valida se é um CPF ou CNPJ com dígitos verificadores corretos
 */
export function isValidDocument(doc: string): boolean {
  const clean = cleanDocument(doc);
  if (clean.length === 11) return isValidCPF(clean);
  if (clean.length === 14) return isValidCNPJ(clean);
  return false;
}

/**
 * Máscara amigável de exibição (mantendo partes protegidas se necessário)
 */
export function formatDocument(doc: string): string {
  const clean = cleanDocument(doc);
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}
