import * as crypto from 'crypto';

export interface OnePayParams {
  vpc_AccessCode: string;
  vpc_Amount: string; // Amount in VND * 100
  vpc_Command: string; // 'pay'
  vpc_Currency: string; // 'VND'
  vpc_Locale: string; // 'vn' or 'en'
  vpc_MerchTxnRef: string; // Unique order ID
  vpc_Merchant: string;
  vpc_OrderInfo: string;
  vpc_ReturnURL: string;
  vpc_Version: string; // '2'
  vpc_TicketNo: string; // Client IP
  [key: string]: string;
}

export function sign(params: Record<string, string>, secret: string): string {
  const keys = Object.keys(params)
    .filter(k => (k.startsWith('vpc_') || k.startsWith('user_')) && 
      k !== 'vpc_SecureHash' && 
      k !== 'vpc_SecureHashType' && 
      params[k].length > 0)
    .sort();
  
  const queryString = keys.map(k => `${k}=${params[k]}`).join('&');
  
  const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));
  hmac.update(queryString);
  return hmac.digest('hex').toUpperCase();
}

export function verify(params: Record<string, string>, secret: string): boolean {
  const secureHash = params['vpc_SecureHash'];
  if (!secureHash) return false;
  
  const calculatedHash = sign(params, secret);
  return secureHash === calculatedHash;
}

export function buildPaymentUrl(params: OnePayParams, baseUrl: string, secret: string): string {
  const secureHash = sign(params, secret);
  const queryParams = new URLSearchParams(params);
  queryParams.append('vpc_SecureHash', secureHash);
  return `${baseUrl}?${queryParams.toString()}`;
}
