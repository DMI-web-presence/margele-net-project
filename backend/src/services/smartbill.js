const DEFAULT_BASE_URL = 'https://ws.smartbill.ro/SBORO/api';
const DEFAULT_TIMEOUT_MS = 12000;

class SmartBillError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SmartBillError';
    this.status = options.status || 502;
    this.providerStatus = options.providerStatus || null;
    this.details = options.details || null;
  }
}

function createSmartBillClient(config = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch || globalThis.fetch;
  const wait = dependencies.wait || ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  const settings = {
    enabled: Boolean(config.enabled),
    baseUrl: String(config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    email: String(config.email || '').trim(),
    token: String(config.token || '').trim(),
    companyVatCode: String(config.companyVatCode || '').trim(),
    invoiceSeries: String(config.invoiceSeries || '').trim(),
    taxName: String(config.taxName || 'Normala').trim(),
    taxPercentage: numberOrDefault(config.taxPercentage, 21),
    dueDays: Math.max(0, Math.floor(numberOrDefault(config.dueDays, 0))),
    sendEmail: Boolean(config.sendEmail),
    timeoutMs: Math.max(1000, numberOrDefault(config.timeoutMs, DEFAULT_TIMEOUT_MS)),
  };

  function isConfigured() {
    return Boolean(
      settings.enabled &&
      settings.email &&
      settings.token &&
      settings.companyVatCode &&
      settings.invoiceSeries,
    );
  }

  function assertConfigured() {
    if (isConfigured()) return;

    throw new SmartBillError(
      'SmartBill nu este configurat complet. Verifica variabilele SMARTBILL_* din backend/.env.',
      { status: 503 },
    );
  }

  async function request(pathname, options = {}) {
    assertConfigured();

    if (typeof fetchImpl !== 'function') {
      throw new SmartBillError('Runtime-ul serverului nu suporta fetch.', { status: 500 });
    }

    const url = new URL(`${settings.baseUrl}/${String(pathname).replace(/^\/+/, '')}`);
    for (const [key, value] of Object.entries(options.query || {})) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = {
      Accept: options.binary ? 'application/octet-stream' : 'application/json',
      Authorization: `Basic ${Buffer.from(`${settings.email}:${settings.token}`, 'utf8').toString('base64')}`,
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    };
    const maxAttempts = options.retrySafe ? 3 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let response;
      try {
        response = await fetchImpl(url, {
          method: options.method || 'GET',
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: AbortSignal.timeout(settings.timeoutMs),
        });
      } catch (error) {
        if (attempt < maxAttempts) {
          await wait(attempt * 500);
          continue;
        }

        throw new SmartBillError(
          error?.name === 'TimeoutError'
            ? 'SmartBill nu a raspuns in timpul asteptat.'
            : 'Conexiunea cu SmartBill a esuat.',
          { details: error instanceof Error ? error.message : String(error) },
        );
      }

      if (response.ok) {
        if (options.binary) {
          return Buffer.from(await response.arrayBuffer());
        }

        const text = await response.text();
        const data = parseJson(text);
        const providerResponse = data?.sbcResponse || data || {};
        if (providerResponse.errorText) {
          throw new SmartBillError(providerResponse.errorText, {
            providerStatus: response.status,
            details: data,
          });
        }
        return data || {};
      }

      const errorText = await response.text().catch(() => '');
      const errorData = parseJson(errorText);
      const message =
        errorData?.errorText ||
        errorData?.sbcResponse?.errorText ||
        errorData?.message ||
        errorText ||
        `SmartBill a raspuns cu status ${response.status}.`;

      if (attempt < maxAttempts && (response.status === 429 || response.status >= 500)) {
        await wait(attempt * 500);
        continue;
      }

      throw new SmartBillError(message, {
        providerStatus: response.status,
        details: errorData || errorText || null,
      });
    }

    throw new SmartBillError('Cererea SmartBill nu a putut fi finalizata.');
  }

  async function createInvoice(payload) {
    const response = await request('/invoice', {
      method: 'POST',
      body: payload,
    });
    const result = response?.sbcResponse || response;

    if (!result?.number) {
      throw new SmartBillError('SmartBill nu a returnat numarul facturii.', {
        details: response,
      });
    }

    return {
      number: String(result.number),
      series: String(result.series || settings.invoiceSeries),
      url: result.url || '',
      raw: response,
    };
  }

  function getInvoicePdf(series, number) {
    return request('/invoice/pdf', {
      binary: true,
      retrySafe: true,
      query: {
        cif: settings.companyVatCode,
        seriesname: series,
        number,
      },
    });
  }

  async function sendInvoiceEmail({ series, number, to, subject, bodyText }) {
    const recipient = String(to || '').trim();
    if (!recipient) {
      throw new SmartBillError('Factura nu poate fi trimisa fara o adresa de email.', {
        status: 400,
      });
    }

    const response = await request('/document/send', {
      method: 'POST',
      body: {
        companyVatCode: settings.companyVatCode,
        seriesName: series,
        number,
        type: 'factura',
        to: recipient,
        cc: '',
        bcc: '',
        subject: Buffer.from(subject || `Factura ${series}${number}`, 'utf8').toString('base64'),
        bodyText: Buffer.from(
          bodyText || `Buna ziua,\n\nVa trimitem factura ${series}${number}.\n\nEchipa Margele.net`,
          'utf8',
        ).toString('base64'),
      },
    });
    const status = response?.status || response?.Response?.status || response?.response?.status;
    if (status && String(status.code) !== '0') {
      throw new SmartBillError(status.message || 'SmartBill nu a putut trimite factura.', {
        details: response,
      });
    }

    return response;
  }

  return {
    settings,
    isConfigured,
    createInvoice,
    getInvoicePdf,
    sendInvoiceEmail,
  };
}

function buildSmartBillInvoicePayload(settings, context, now = new Date()) {
  const order = context?.order || {};
  const customer = context?.customer || {};
  const items = Array.isArray(context?.items) ? context.items : [];
  const issueDate = dateInTimeZone(now, 'Europe/Bucharest');
  const dueDate = addDays(issueDate, settings.dueDays || 0);

  if (!customer.name || !customer.address || !customer.city) {
    throw new SmartBillError(
      'Completeaza numele, adresa si localitatea clientului inainte de emiterea facturii.',
      { status: 400 },
    );
  }

  if (
    String(customer.country || 'Romania').toLowerCase() === 'romania' &&
    !String(customer.county || '').trim()
  ) {
    throw new SmartBillError(
      'Completeaza judetul in adresa de facturare inainte de emiterea facturii.',
      { status: 400 },
    );
  }

  if (items.length === 0) {
    throw new SmartBillError('Comanda nu contine produse facturabile.', { status: 400 });
  }

  const currency = String(order.currency || 'RON').toUpperCase();
  const products = items.map((item) => ({
    name: String(item.productName || item.product_name || '').trim(),
    ...(item.sku ? { code: String(item.sku) } : {}),
    ...(item.selectedOptions || item.selected_options
      ? { productDescription: String(item.selectedOptions || item.selected_options) }
      : {}),
    isDiscount: false,
    measuringUnitName: 'buc',
    currency,
    quantity: Number(item.quantity || 0),
    price: roundMoney(item.unitPrice || item.unit_price),
    isTaxIncluded: true,
    taxName: settings.taxName,
    taxPercentage: settings.taxPercentage,
    saveToDb: false,
    isService: false,
  }));

  const deliveryTotal = roundMoney(order.deliveryTotal || order.delivery_total);
  if (deliveryTotal > 0) {
    products.push({
      name: 'Livrare',
      isDiscount: false,
      measuringUnitName: 'buc',
      currency,
      quantity: 1,
      price: deliveryTotal,
      isTaxIncluded: true,
      taxName: settings.taxName,
      taxPercentage: settings.taxPercentage,
      saveToDb: false,
      isService: true,
    });
  }

  const payload = {
    companyVatCode: settings.companyVatCode,
    client: {
      name: String(customer.name).trim(),
      vatCode: String(customer.vatCode || '0').trim(),
      address: String(customer.address).trim(),
      isTaxPayer: Boolean(customer.isTaxPayer),
      city: String(customer.city).trim(),
      county: String(customer.county || '').trim(),
      country: String(customer.country || 'Romania').trim(),
      email: String(customer.email || '').trim(),
      phone: String(customer.phone || '').trim(),
      ...(customer.regCom ? { regCom: String(customer.regCom).trim() } : {}),
      saveToDb: false,
    },
    isDraft: false,
    issueDate,
    dueDate,
    seriesName: settings.invoiceSeries,
    currency,
    language: 'RO',
    precision: 2,
    useStock: false,
    useEstimateDetails: false,
    mentions: `Comanda online ${order.orderNumber || order.order_number || ''}`.trim(),
    observations: `Comanda ${order.orderNumber || order.order_number || ''}`.trim(),
    products,
  };

  if (order.paymentStatus === 'paid' || order.payment_status === 'paid') {
    payload.payment = {
      value: roundMoney(order.total),
      type: order.paymentMethod === 'card' || order.payment_method === 'card' ? 'Card' : 'Alta incasare',
      isCash: false,
    };
  }

  return payload;
}

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

module.exports = {
  SmartBillError,
  buildSmartBillInvoicePayload,
  createSmartBillClient,
};
