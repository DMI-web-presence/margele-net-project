const assert = require('node:assert/strict');
const test = require('node:test');
const {
  buildSmartBillInvoicePayload,
  createSmartBillClient,
} = require('./smartbill');

const settings = {
  companyVatCode: 'RO12345678',
  invoiceSeries: 'MN',
  taxName: 'Normala',
  taxPercentage: 21,
  dueDays: 0,
};

test('buildSmartBillInvoicePayload maps products, delivery and a confirmed card payment', () => {
  const payload = buildSmartBillInvoicePayload(
    settings,
    {
      order: {
        orderNumber: 'MN-100',
        currency: 'RON',
        deliveryTotal: '19.99',
        total: '140.99',
        paymentMethod: 'card',
        paymentStatus: 'paid',
      },
      customer: {
        name: 'Client Test',
        vatCode: '0',
        address: 'Str. Test 1',
        city: 'Oradea',
        county: 'Bihor',
        country: 'Romania',
        email: 'client@example.com',
      },
      items: [
        {
          productName: 'Margele',
          sku: 'MRG-1',
          unitPrice: '12.10',
          quantity: 10,
        },
      ],
    },
    new Date('2026-07-27T10:00:00Z'),
  );

  assert.equal(payload.issueDate, '2026-07-27');
  assert.equal(payload.seriesName, 'MN');
  assert.equal(payload.products.length, 2);
  assert.deepEqual(payload.products[0], {
    name: 'Margele',
    code: 'MRG-1',
    isDiscount: false,
    measuringUnitName: 'buc',
    currency: 'RON',
    quantity: 10,
    price: 12.1,
    isTaxIncluded: true,
    taxName: 'Normala',
    taxPercentage: 21,
    saveToDb: false,
    isService: false,
  });
  assert.equal(payload.products[1].name, 'Livrare');
  assert.equal(payload.products[1].price, 19.99);
  assert.deepEqual(payload.payment, {
    value: 140.99,
    type: 'Card',
    isCash: false,
  });
});

test('buildSmartBillInvoicePayload requires a Romanian billing county', () => {
  assert.throws(
    () =>
      buildSmartBillInvoicePayload(settings, {
        order: { orderNumber: 'MN-101' },
        customer: {
          name: 'Client Test',
          address: 'Str. Test 1',
          city: 'Oradea',
          country: 'Romania',
        },
        items: [{ productName: 'Produs', unitPrice: 10, quantity: 1 }],
      }),
    /judetul/,
  );
});

test('SmartBill client uses Basic auth and unwraps the invoice response', async () => {
  let request;
  const client = configuredClient(async (url, options) => {
    request = { url, options };
    return jsonResponse({
      sbcResponse: {
        errorText: '',
        number: '0042',
        series: 'MN',
        url: '',
      },
    });
  });

  const result = await client.createInvoice({ products: [] });

  assert.equal(result.number, '0042');
  assert.equal(result.series, 'MN');
  assert.equal(request.url.toString(), 'https://ws.smartbill.ro/SBORO/api/invoice');
  assert.equal(
    request.options.headers.Authorization,
    `Basic ${Buffer.from('api@example.com:secret-token').toString('base64')}`,
  );
});

test('SmartBill client requests the PDF with the provider query names', async () => {
  let requestUrl;
  const client = configuredClient(async (url) => {
    requestUrl = url;
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => Uint8Array.from([37, 80, 68, 70]).buffer,
    };
  });

  const pdf = await client.getInvoicePdf('MN', '0042');

  assert.equal(pdf.toString('ascii'), '%PDF');
  assert.equal(requestUrl.searchParams.get('cif'), 'RO12345678');
  assert.equal(requestUrl.searchParams.get('seriesname'), 'MN');
  assert.equal(requestUrl.searchParams.get('number'), '0042');
});

test('SmartBill client base64 encodes email subject and body', async () => {
  let body;
  const client = configuredClient(async (_url, options) => {
    body = JSON.parse(options.body);
    return jsonResponse({ status: { code: '0', message: 'Document trimis.' } });
  });

  await client.sendInvoiceEmail({
    series: 'MN',
    number: '0042',
    to: 'client@example.com',
    subject: 'Factura MN0042',
    bodyText: 'Factura atasata.',
  });

  assert.equal(body.type, 'factura');
  assert.equal(body.to, 'client@example.com');
  assert.equal(
    Buffer.from(body.subject, 'base64').toString('utf8'),
    'Factura MN0042',
  );
  assert.equal(
    Buffer.from(body.bodyText, 'base64').toString('utf8'),
    'Factura atasata.',
  );
});

test('SmartBill client surfaces email failures returned with HTTP 200', async () => {
  const client = configuredClient(async () =>
    jsonResponse({ status: { code: '1', message: 'Server email neconfigurat.' } }),
  );

  await assert.rejects(
    () =>
      client.sendInvoiceEmail({
        series: 'MN',
        number: '0042',
        to: 'client@example.com',
      }),
    /Server email neconfigurat/,
  );
});

function configuredClient(fetch) {
  return createSmartBillClient(
    {
      enabled: true,
      email: 'api@example.com',
      token: 'secret-token',
      companyVatCode: 'RO12345678',
      invoiceSeries: 'MN',
      taxName: 'Normala',
      taxPercentage: 21,
    },
    { fetch },
  );
}

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
  };
}
