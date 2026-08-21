const DEFAULT_BASE_URL = 'https://panel.ecolet.ro';
const DEFAULT_TIMEOUT_MS = 15000;

class EcoletError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'EcoletError';
    this.status = options.status || 502;
    this.providerStatus = options.providerStatus || null;
    this.details = options.details || null;
  }
}

// In-memory token cache
let tokenCache = {
  accessToken: null,
  expiryTime: 0, // epoch ms
};

function createEcoletClient(config = {}, dependencies = {}) {
  const fetchImpl = dependencies.fetch || globalThis.fetch;
  const wait = dependencies.wait || ((delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)));
  
  const settings = {
    enabled: Boolean(config.enabled ?? process.env.ECOLET_ENABLED === 'true'),
    baseUrl: String(config.baseUrl || process.env.ECOLET_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    clientId: String(config.clientId || process.env.ECOLET_CLIENT_ID || '').trim(),
    clientSecret: String(config.clientSecret || process.env.ECOLET_CLIENT_SECRET || '').trim(),
    username: String(config.username || process.env.ECOLET_USERNAME || '').trim(),
    password: String(config.password || process.env.ECOLET_PASSWORD || '').trim(),
    timeoutMs: Math.max(1000, Number(config.timeoutMs || DEFAULT_TIMEOUT_MS)),
    // Sender fallback details
    senderName: String(config.senderName || process.env.STORE_SENDER_NAME || 'Margele Net'),
    senderContact: String(config.senderContact || process.env.STORE_SENDER_CONTACT_PERSON || 'Departamentul Expedieri'),
    senderPhone: String(config.senderPhone || process.env.STORE_SENDER_PHONE || '0722000000'),
    senderEmail: String(config.senderEmail || process.env.STORE_SENDER_EMAIL || 'expedieri@margele.net'),
    senderCountry: String(config.senderCountry || process.env.STORE_SENDER_COUNTRY || 'ro').toLowerCase(),
    senderCounty: String(config.senderCounty || process.env.STORE_SENDER_COUNTY || 'Ilfov'),
    senderCity: String(config.senderCity || process.env.STORE_SENDER_CITY || 'Otopeni'),
    senderAddress: String(config.senderAddress || process.env.STORE_SENDER_ADDRESS || 'Strada Principala Nr. 12'),
    senderPostcode: String(config.senderPostcode || process.env.STORE_SENDER_POSTCODE || '077190'),
  };

  function isConfigured() {
    return Boolean(
      settings.enabled &&
      settings.clientId &&
      settings.clientSecret &&
      settings.username &&
      settings.password
    );
  }

  function assertConfigured() {
    if (isConfigured()) return;
    throw new EcoletError(
      'Ecolet is not fully configured. Verify ECOLET_* env vars in backend/.env.',
      { status: 503 }
    );
  }

  async function getAccessToken() {
    assertConfigured();

    // Check if token cache is still valid (with a 60s buffer)
    const now = Date.now();
    if (tokenCache.accessToken && tokenCache.expiryTime > now + 60000) {
      return tokenCache.accessToken;
    }

    const url = `${settings.baseUrl}/api/v1/oauth/token`;
    const bodyParams = new URLSearchParams({
      grant_type: 'password',
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      username: settings.username,
      password: settings.password,
    });

    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(settings.timeoutMs),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new EcoletError('Ecolet authentication failed.', {
          status: response.status,
          providerStatus: response.status,
          details: text,
        });
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new EcoletError('Access token missing from authentication response.');
      }

      tokenCache.accessToken = data.access_token;
      // Expires_in is in seconds, cache it
      const expiresInSec = Number(data.expires_in || 3600);
      tokenCache.expiryTime = Date.now() + (expiresInSec * 1000);

      return tokenCache.accessToken;
    } catch (err) {
      if (err instanceof EcoletError) throw err;
      throw new EcoletError('Failed to connect to Ecolet auth server.', {
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function request(pathname, options = {}) {
    const token = await getAccessToken();
    const url = `${settings.baseUrl}/${String(pathname).replace(/^\/+/, '')}`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: options.binary ? 'application/octet-stream' : 'application/json',
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    };

    let response;
    try {
      response = await fetchImpl(url, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(settings.timeoutMs),
      });
    } catch (error) {
      throw new EcoletError('Connection to Ecolet API failed.', {
        details: error instanceof Error ? error.message : String(error),
      });
    }

    if (!response.ok) {
      const text = await response.text();
      let parsedError = text;
      try {
        const json = JSON.parse(text);
        parsedError = json.message || json.error || text;
      } catch {}

      throw new EcoletError(`Ecolet API returned error: ${parsedError}`, {
        status: response.status,
        providerStatus: response.status,
        details: text,
      });
    }

    if (options.binary) {
      return Buffer.from(await response.arrayBuffer());
    }

    return response.json();
  }

  // Generate AWB label via Ecolet
  async function createLabel(order, parcelDetails = {}) {
    assertConfigured();

    const shipping = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : (order.shipping_address || {});

    // Format target name
    const firstName = shipping.prenume || '';
    const lastName = shipping.nume || '';
    const receiverName = `${firstName} ${lastName}`.trim() || 'Client';

    const orderTotal = Number(order.total_amount || order.total || 0);

    const payload = {
      sender: {
        name: settings.senderName,
        country: settings.senderCountry,
        county: settings.senderCounty,
        locality: settings.senderCity,
        postal_code: settings.senderPostcode,
        street_name: settings.senderAddress,
        street_number: '1', // default fallback
        contact_person: settings.senderContact,
        email: settings.senderEmail,
        phone: settings.senderPhone,
        has_map_point: false,
        map_point_id: null,
      },
      receiver: {
        name: receiverName,
        country: 'ro',
        county: shipping.judet || '',
        locality: shipping.oras || '',
        postal_code: shipping.codPostal || '',
        street_name: shipping.adresa1 || '',
        street_number: shipping.adresa2 || '1',
        contact_person: receiverName,
        email: order.customer_email || order.email || '',
        phone: shipping.telefon || order.customer_phone || '',
        has_map_point: false,
        map_point_id: null,
      },
      parcel: {
        type: parcelDetails.type === 'envelope' ? 'envelope' : 'package',
        shape: 'standard',
        observations: `Comanda #${order.order_number || order.id}`,
      },
      parcels: [
        {
          weight: String(parcelDetails.weight || '1.0'),
          dimensions: {
            length: String(parcelDetails.length || '10'),
            width: String(parcelDetails.width || '10'),
            height: String(parcelDetails.height || '10'),
          },
          declared_value: 0,
          content: 'Articole craft / margele',
        }
      ],
      additional_services: {
        cod: {
          status: order.payment_method === 'ramburs',
          amount: order.payment_method === 'ramburs' ? orderTotal : 0,
        },
        open_package: { status: false },
        sms_notify: { status: true },
      },
      courier: {
        service: parcelDetails.service || 'fan_standard', // e.g. fan_standard, dpd_standard, sameday_standard, gls_standard
        pickup: {
          type: 'courier',
          date: new Date().toISOString().split('T')[0], // today
        }
      }
    };

    // Call v2 create order endpoint
    const result = await request('api/v2/add-parcel/send-order', {
      method: 'POST',
      body: payload,
    });

    // Ecolet return format maps details of the created parcel
    return {
      awbNumber: result.waybill_number || result.awb_number || result.id || '',
      waybillId: result.id || '',
      carrier: result.courier_name || result.courier || parcelDetails.service || 'Ecolet',
      pdfUrl: result.waybill_url || result.pdf_url || '',
    };
  }

  // Cancel/Void label
  async function cancelLabel(waybillId) {
    assertConfigured();
    return request(`api/v1/order/${waybillId}`, {
      method: 'DELETE',
    });
  }

  // Download PDF Waybill Binary stream
  async function getLabelPdf(waybillId) {
    assertConfigured();
    return request(`api/v1/order/${waybillId}/download-waybill`, {
      method: 'GET',
      binary: true,
    });
  }

  // Fetch single shipment status
  async function getLabelStatus(waybillId) {
    assertConfigured();
    const orderDetails = await request(`api/v1/order/${waybillId}`, {
      method: 'GET',
    });
    return {
      status: orderDetails.status || 'Unknown',
      statusDate: orderDetails.status_date || orderDetails.updated_at || null,
      courierStatus: orderDetails.courier_status || '',
    };
  }

  return {
    isConfigured,
    createLabel,
    cancelLabel,
    getLabelPdf,
    getLabelStatus,
  };
}

module.exports = {
  createEcoletClient,
  EcoletError,
};
