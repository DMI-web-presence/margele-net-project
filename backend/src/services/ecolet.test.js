const assert = require('node:assert/strict');
const test = require('node:test');
const { createEcoletClient, EcoletError } = require('./ecolet');

test('EcoletClient - returns false for isConfigured when not configured', () => {
  const client = createEcoletClient({ enabled: true });
  assert.strictEqual(client.isConfigured(), false);
});

test('EcoletClient - gets oauth token and calls createLabel successfully', async () => {
  let oauthCalled = false;
  let createLabelCalled = false;

  const mockFetch = async (url, options) => {
    const urlStr = String(url);
    
    if (urlStr.includes('/oauth/token')) {
      oauthCalled = true;
      assert.strictEqual(options.method, 'POST');
      return {
        ok: true,
        json: async () => ({
          access_token: 'mock-jwt-token',
          expires_in: 3600,
        }),
      };
    }

    if (urlStr.includes('/add-parcel/send-order')) {
      createLabelCalled = true;
      assert.strictEqual(options.method, 'POST');
      assert.ok(options.headers.Authorization.includes('Bearer mock-jwt-token'));
      
      const body = JSON.parse(options.body);
      assert.strictEqual(body.receiver.name, 'John Doe');
      assert.strictEqual(body.receiver.phone, '0722111222');
      assert.strictEqual(body.additional_services.cod.status, true);
      assert.strictEqual(body.additional_services.cod.amount, 150);

      return {
        ok: true,
        json: async () => ({
          id: '12345',
          waybill_number: 'AWB999888777',
          courier_name: 'FAN Courier',
        }),
      };
    }

    return { ok: false, text: async () => 'Not found' };
  };

  const client = createEcoletClient(
    {
      enabled: true,
      clientId: 'id',
      clientSecret: 'secret',
      username: 'user',
      password: 'pwd',
    },
    { fetch: mockFetch }
  );

  const order = {
    id: 1,
    order_number: 'MN-123',
    total_amount: 150,
    payment_method: 'ramburs',
    customer_email: 'client@example.com',
    shipping_address: JSON.stringify({
      prenume: 'John',
      nume: 'Doe',
      telefon: '0722111222',
      oras: 'Bucuresti',
      judet: 'Bucuresti',
      adresa1: 'Strada Florilor Nr. 5',
    }),
  };

  const result = await client.createLabel(order, { service: 'fan_standard', weight: '2.5' });
  
  assert.ok(oauthCalled);
  assert.ok(createLabelCalled);
  assert.strictEqual(result.awbNumber, 'AWB999888777');
  assert.strictEqual(result.waybillId, '12345');
  assert.strictEqual(result.carrier, 'FAN Courier');
});

test('EcoletClient - cancelLabel calls DELETE endpoint', async () => {
  let deleteCalled = false;

  const mockFetch = async (url, options) => {
    const urlStr = String(url);
    if (urlStr.includes('/oauth/token')) {
      return {
        ok: true,
        json: async () => ({ access_token: 'mock-token', expires_in: 3600 }),
      };
    }
    if (urlStr.includes('/order/12345')) {
      assert.strictEqual(options.method, 'DELETE');
      deleteCalled = true;
      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    }
    return { ok: false };
  };

  const client = createEcoletClient(
    {
      enabled: true,
      clientId: 'id',
      clientSecret: 'secret',
      username: 'user',
      password: 'pwd',
    },
    { fetch: mockFetch }
  );

  const result = await client.cancelLabel('12345');
  assert.ok(deleteCalled);
  assert.ok(result.success);
});
