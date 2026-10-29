/**
 * ALTHUS by DATALIS — Módulo de Criptografia e Segurança (ADR-002 / LGPD)
 * Implementa encriptação de CPF/CNPJ (AES-256-GCM) e Índice Cego (HMAC-SHA256)
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Recupera a chave de 32 bytes (256 bits) ou gera fallback para dev
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.createHash('sha256').update(process.env.JWT_SECRET || 'althus-dev-secret-key-32b').digest();

const BLIND_INDEX_PEPPER = process.env.BLIND_INDEX_PEPPER || 'althus-pepper-secret-key-salt';

/**
 * Criptografa dado sensível (CPF/CNPJ) com AES-256-GCM
 */
export function encryptSensitive(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Retorna formato: iv:tag:encrypted (todos em hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Descriptografa dado sensível com AES-256-GCM
 */
export function decryptSensitive(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Payload criptográfico em formato inválido.');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Gera o Índice Cego (Blind Index) do documento usando HMAC-SHA256 (ADR-002)
 * Permite busca e verificação de duplicidade por tenant sem salvar em texto claro.
 */
export function generateBlindIndex(doc: string): string {
  const cleanDoc = doc.replace(/\D/g, '');
  return crypto.createHmac('sha256', BLIND_INDEX_PEPPER).update(cleanDoc).digest('hex');
}

/**
 * Hash seguro de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Validação de senha com bcrypt
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
