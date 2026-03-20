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

  console.log('\n=== SIGNING ===');
  console.log('Filtered keys:', keys);
  console.log('Query string:', queryString);

  const hmac = crypto.createHmac('sha256', Buffer.from(secret, 'hex'));
  hmac.update(queryString);
  const hash = hmac.digest('hex').toUpperCase();

  console.log('Hash:', hash);
  console.log('=== SIGNING END ===\n');

  return hash;
}

export function verify(params: Record<string, string>, secret: string): boolean {
  const secureHash = params['vpc_SecureHash'];
  if (!secureHash) return false;

  const calculatedHash = sign(params, secret);
  return secureHash === calculatedHash;
}

export function buildPaymentUrl(params: OnePayParams, baseUrl: string, secret: string): string {
  console.log('\n=== BUILD PAYMENT URL ===');
  console.log('Input params:', params);

  const secureHash = sign(params, secret);
  console.log('Secure hash:', secureHash);

  const queryParams = new URLSearchParams();
  const includedKeys: string[] = [];
  const excludedKeys: string[] = [];

  Object.keys(params).forEach(key => {
    if ((key.startsWith('vpc_') || key.startsWith('user_'))
      && key !== 'vpc_SecureHash'
      && key !== 'vpc_SecureHashType'
      && params[key]
      && params[key].length > 0) {
      queryParams.append(key, params[key]);
      includedKeys.push(key);
    } else {
      excludedKeys.push(key);
    }
  });

  console.log('Included params:', includedKeys);
  console.log('Excluded params:', excludedKeys);

  queryParams.append('vpc_SecureHash', secureHash);

  const finalUrl = `${baseUrl}?${queryParams.toString()}`;
  console.log('Final URL:', finalUrl);
  console.log('=== BUILD PAYMENT URL END ===\n');

  return finalUrl;
}