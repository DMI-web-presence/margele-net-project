const DEFAULT_TIMEOUT_MS = 10000;

function createBrevoMailer(config = {}) {
  const mailConfig = {
    apiKey: config.apiKey || '',
    senderEmail: config.senderEmail || '',
    senderName: config.senderName || 'Margele.net',
    replyToEmail: config.replyToEmail || '',
    replyToName: config.replyToName || '',
    adminEmail: config.adminEmail || '',
    enabled: Boolean(config.enabled),
  };

  function isConfigured() {
    return Boolean(mailConfig.enabled && mailConfig.apiKey && mailConfig.senderEmail);
  }

  async function sendTransactionalEmail(message) {
    if (!isConfigured()) {
      return { skipped: true, reason: 'brevo_not_configured' };
    }

    if (!message || !Array.isArray(message.to) || message.to.length === 0) {
      return { skipped: true, reason: 'missing_recipients' };
    }

    const payload = {
      sender: {
        email: mailConfig.senderEmail,
        name: mailConfig.senderName,
      },
      to: message.to.map((entry) => ({
        email: entry.email,
        ...(entry.name ? { name: entry.name } : {}),
      })),
      subject: message.subject || '',
      htmlContent: message.htmlContent || '',
      textContent: message.textContent || '',
    };

    if (mailConfig.replyToEmail) {
      payload.replyTo = {
        email: mailConfig.replyToEmail,
        name: mailConfig.replyToName || mailConfig.senderName,
      };
    }

    if (Array.isArray(message.tags) && message.tags.length > 0) {
      payload.tags = message.tags;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': mailConfig.apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      const error = new Error(
        `Brevo request failed with ${response.status}${responseText ? `: ${responseText}` : ''}`,
      );
      error.status = response.status;
      throw error;
    }

    return response.json().catch(() => ({ ok: true }));
  }

  async function sendWelcomeEmail(user) {
    const email = cleanEmail(user?.email);
    if (!email) {
      return { skipped: true, reason: 'missing_user_email' };
    }

    const fullName = String(user?.full_name || user?.fullName || '').trim();

    return sendTransactionalEmail({
      to: [{ email, name: fullName || undefined }],
      subject: 'Bine ai venit la Margele.net',
      textContent: [
        `Salut${fullName ? `, ${fullName}` : ''}!`,
        '',
        'Contul tau a fost creat cu succes pe Margele.net.',
        'Acum poti salva produse favorite, poti plasa comenzi si iti poti urmari istoricul.',
        '',
        'Iti multumim,',
        'Echipa Margele.net',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Salut${fullName ? `, ${escapeHtml(fullName)}` : ''}!</h2>
          <p style="margin: 0 0 12px;">Contul tau a fost creat cu succes pe <strong>Margele.net</strong>.</p>
          <p style="margin: 0 0 12px;">Acum poti salva produse favorite, poti plasa comenzi si iti poti urmari istoricul.</p>
          <p style="margin: 24px 0 0;">Iti multumim,<br />Echipa Margele.net</p>
        </div>
      `,
      tags: ['welcome', 'account'],
    });
  }

  async function sendOrderConfirmationEmail({ user, order, items }) {
    const email = cleanEmail(user?.email);
    if (!email) {
      return { skipped: true, reason: 'missing_user_email' };
    }

    const fullName = String(user?.full_name || '').trim();
    const safeItems = Array.isArray(items) ? items : [];
    const itemsText = safeItems
      .map((item) => {
        const optionsText = formatSelectedOptions(item?.selectedOptions);
        return `- ${item?.productName || 'Produs'} x ${item?.quantity || 1}${optionsText ? ` (${optionsText})` : ''} - ${item?.lineTotal || '0'} lei`;
      })
      .join('\n');

    const itemsHtml = safeItems
      .map((item) => {
        const optionsText = formatSelectedOptions(item?.selectedOptions);
        return `
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">
              <strong>${escapeHtml(item?.productName || 'Produs')}</strong>
              ${optionsText ? `<div style="color: #475569; font-size: 14px;">${escapeHtml(optionsText)}</div>` : ''}
            </td>
            <td style="padding: 8px 0; text-align: center;">${escapeHtml(String(item?.quantity || 1))}</td>
            <td style="padding: 8px 0; text-align: right;">${escapeHtml(String(item?.lineTotal || '0'))} lei</td>
          </tr>
        `;
      })
      .join('');

    return sendTransactionalEmail({
      to: [{ email, name: fullName || undefined }],
      subject: `Confirmare comanda ${order?.orderNumber || ''}`.trim(),
      textContent: [
        `Salut${fullName ? `, ${fullName}` : ''}!`,
        '',
        `Am inregistrat comanda ${order?.orderNumber || ''}.`,
        '',
        itemsText,
        '',
        `Subtotal: ${order?.subtotal || '0'} lei`,
        `Livrare: ${order?.deliveryTotal || '0'} lei`,
        `Total: ${order?.total || '0'} lei`,
        `Status: ${order?.status || 'Plasata'}`,
        '',
        'Iti multumim,',
        'Echipa Margele.net',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Am inregistrat comanda ${escapeHtml(order?.orderNumber || '')}</h2>
          <p style="margin: 0 0 16px;">Salut${fullName ? `, ${escapeHtml(fullName)}` : ''}! Iti multumim pentru comanda.</p>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 8px 0;">Produs</th>
                <th style="padding: 8px 0; text-align: center;">Cant.</th>
                <th style="padding: 8px 0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <p style="margin: 0 0 6px;"><strong>Subtotal:</strong> ${escapeHtml(String(order?.subtotal || '0'))} lei</p>
          <p style="margin: 0 0 6px;"><strong>Livrare:</strong> ${escapeHtml(String(order?.deliveryTotal || '0'))} lei</p>
          <p style="margin: 0 0 6px;"><strong>Total:</strong> ${escapeHtml(String(order?.total || '0'))} lei</p>
          <p style="margin: 0 0 24px;"><strong>Status:</strong> ${escapeHtml(order?.status || 'Plasata')}</p>
          <p style="margin: 0;">Echipa Margele.net</p>
        </div>
      `,
      tags: ['orders', 'confirmation'],
    });
  }

  async function sendNewOrderAdminAlert({ user, order, items }) {
    const adminEmail = cleanEmail(mailConfig.adminEmail);
    if (!adminEmail) {
      return { skipped: true, reason: 'missing_admin_email' };
    }

    const safeItems = Array.isArray(items) ? items : [];
    const itemsHtml = safeItems
      .map((item) => {
        const optionsText = formatSelectedOptions(item?.selectedOptions);
        return `
          <li style="margin-bottom: 8px;">
            <strong>${escapeHtml(item?.productName || 'Produs')}</strong>
            x ${escapeHtml(String(item?.quantity || 1))}
            ${optionsText ? ` - ${escapeHtml(optionsText)}` : ''}
            - ${escapeHtml(String(item?.lineTotal || '0'))} lei
          </li>
        `;
      })
      .join('');

    return sendTransactionalEmail({
      to: [{ email: adminEmail }],
      subject: `Comanda noua ${order?.orderNumber || ''}`.trim(),
      textContent: [
        `Comanda noua: ${order?.orderNumber || ''}`,
        `Client: ${user?.full_name || '-'} <${user?.email || '-'}>`,
        `Total: ${order?.total || '0'} lei`,
        `Status plata: ${order?.paymentStatus || '-'}`,
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Comanda noua ${escapeHtml(order?.orderNumber || '')}</h2>
          <p style="margin: 0 0 8px;"><strong>Client:</strong> ${escapeHtml(user?.full_name || '-')} (${escapeHtml(user?.email || '-')})</p>
          <p style="margin: 0 0 8px;"><strong>Total:</strong> ${escapeHtml(String(order?.total || '0'))} lei</p>
          <p style="margin: 0 0 16px;"><strong>Status plata:</strong> ${escapeHtml(order?.paymentStatus || '-')}</p>
          <ul style="padding-left: 18px; margin: 0;">${itemsHtml}</ul>
        </div>
      `,
      tags: ['orders', 'admin-alert'],
    });
  }

  async function sendReturnRequestAdminAlert(returnRequest) {
    const adminEmail = cleanEmail(mailConfig.adminEmail);
    if (!adminEmail) {
      return { skipped: true, reason: 'missing_admin_email' };
    }

    const details = cleanMultiline(returnRequest?.details);
    const lines = [
      ['Nume', returnRequest?.fullName],
      ['Email', returnRequest?.email],
      ['Telefon', returnRequest?.phone],
      ['Numar comanda', returnRequest?.orderNumber],
      ['Produs', returnRequest?.productName],
      ['SKU', returnRequest?.sku],
      ['Motiv', returnRequest?.reason],
      ['Solicitare', returnRequest?.outcome],
    ].filter(([, value]) => value);

    return sendTransactionalEmail({
      to: [{ email: adminEmail }],
      subject: `Cerere retur ${returnRequest?.orderNumber || ''}`.trim(),
      textContent: [
        'A fost trimisa o noua cerere de retur.',
        '',
        ...lines.map(([label, value]) => `${label}: ${value}`),
        details ? ['', 'Detalii suplimentare:', details] : [],
      ]
        .flat()
        .join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Cerere noua de retur</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${lines
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; width: 180px;">${escapeHtml(label)}</td>
                      <td style="padding: 6px 0;">${escapeHtml(String(value || ''))}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
          ${
            details
              ? `<div style="margin-top: 20px;">
                  <p style="margin: 0 0 8px; font-weight: 700;">Detalii suplimentare</p>
                  <p style="margin: 0; white-space: pre-line;">${escapeHtml(details)}</p>
                </div>`
              : ''
          }
        </div>
      `,
      tags: ['returns', 'admin-alert'],
    });
  }

  async function sendReturnRequestCustomerConfirmation(returnRequest) {
    const email = cleanEmail(returnRequest?.email);
    if (!email) {
      return { skipped: true, reason: 'missing_customer_email' };
    }

    const fullName = String(returnRequest?.fullName || '').trim();
    const details = cleanMultiline(returnRequest?.details);

    return sendTransactionalEmail({
      to: [{ email, name: fullName || undefined }],
      subject: `Am primit cererea ta de retur${returnRequest?.orderNumber ? ` - ${returnRequest.orderNumber}` : ''}`,
      textContent: [
        `Salut${fullName ? `, ${fullName}` : ''}!`,
        '',
        'Am primit cererea ta de retur si revenim cat mai curand cu pasii urmatori.',
        '',
        returnRequest?.orderNumber ? `Numar comanda: ${returnRequest.orderNumber}` : null,
        returnRequest?.productName ? `Produs: ${returnRequest.productName}` : null,
        returnRequest?.sku ? `SKU: ${returnRequest.sku}` : null,
        returnRequest?.reason ? `Motiv: ${returnRequest.reason}` : null,
        returnRequest?.outcome ? `Solicitare: ${returnRequest.outcome}` : null,
        details ? ['', 'Detalii trimise:', details] : null,
        '',
        'Echipa Margele.net',
      ]
        .filter(Boolean)
        .flat()
        .join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Am primit cererea ta de retur</h2>
          <p style="margin: 0 0 12px;">Salut${fullName ? `, ${escapeHtml(fullName)}` : ''}!</p>
          <p style="margin: 0 0 16px;">Revenim cat mai curand cu pasii urmatori pentru cererea trimisa.</p>
          <ul style="margin: 0 0 16px; padding-left: 18px;">
            ${returnRequest?.orderNumber ? `<li>Numar comanda: ${escapeHtml(returnRequest.orderNumber)}</li>` : ''}
            ${returnRequest?.productName ? `<li>Produs: ${escapeHtml(returnRequest.productName)}</li>` : ''}
            ${returnRequest?.sku ? `<li>SKU: ${escapeHtml(returnRequest.sku)}</li>` : ''}
            ${returnRequest?.reason ? `<li>Motiv: ${escapeHtml(returnRequest.reason)}</li>` : ''}
            ${returnRequest?.outcome ? `<li>Solicitare: ${escapeHtml(returnRequest.outcome)}</li>` : ''}
          </ul>
          ${
            details
              ? `<div style="margin-top: 16px;">
                  <p style="margin: 0 0 8px; font-weight: 700;">Detalii trimise</p>
                  <p style="margin: 0; white-space: pre-line;">${escapeHtml(details)}</p>
                </div>`
              : ''
          }
          <p style="margin: 24px 0 0;">Echipa Margele.net</p>
        </div>
      `,
      tags: ['returns', 'confirmation'],
    });
  }

  async function sendContactMessageAdminAlert(message) {
    const adminEmail = cleanEmail(mailConfig.adminEmail);
    if (!adminEmail) {
      return { skipped: true, reason: 'missing_admin_email' };
    }

    const body = cleanMultiline(message?.message);
    const lines = [
      ['Nume', message?.name],
      ['Contact', message?.contactDetail],
      ['Subiect', message?.topic],
    ].filter(([, value]) => value);

    return sendTransactionalEmail({
      to: [{ email: adminEmail }],
      subject: `Mesaj contact${message?.topic ? ` - ${message.topic}` : ''}`,
      textContent: [
        'A fost trimis un mesaj nou din formularul de contact.',
        '',
        ...lines.map(([label, value]) => `${label}: ${value}`),
        '',
        'Mesaj:',
        body || '-',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Mesaj nou din formularul de contact</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${lines
                .map(
                  ([label, value]) => `
                    <tr>
                      <td style="padding: 6px 0; font-weight: 700; width: 140px;">${escapeHtml(label)}</td>
                      <td style="padding: 6px 0;">${escapeHtml(String(value || ''))}</td>
                    </tr>
                  `,
                )
                .join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p style="margin: 0 0 8px; font-weight: 700;">Mesaj</p>
            <p style="margin: 0; white-space: pre-line;">${escapeHtml(body || '-')}</p>
          </div>
        </div>
      `,
      tags: ['contact', 'admin-alert'],
    });
  }

  async function sendContactMessageCustomerConfirmation(message) {
    const email = extractEmailFromContactDetail(message?.contactDetail);
    if (!email) {
      return { skipped: true, reason: 'missing_customer_email' };
    }

    const name = String(message?.name || '').trim();
    const body = cleanMultiline(message?.message);

    return sendTransactionalEmail({
      to: [{ email, name: name || undefined }],
      subject: 'Am primit mesajul tau',
      textContent: [
        `Salut${name ? `, ${name}` : ''}!`,
        '',
        'Am primit mesajul tau si revenim cat mai curand.',
        '',
        message?.topic ? `Subiect: ${message.topic}` : null,
        '',
        'Mesaj trimis:',
        body || '-',
        '',
        'Echipa Margele.net',
      ]
        .filter(Boolean)
        .join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Am primit mesajul tau</h2>
          <p style="margin: 0 0 12px;">Salut${name ? `, ${escapeHtml(name)}` : ''}!</p>
          <p style="margin: 0 0 16px;">Revenim cat mai curand cu un raspuns.</p>
          ${message?.topic ? `<p style="margin: 0 0 12px;"><strong>Subiect:</strong> ${escapeHtml(message.topic)}</p>` : ''}
          <div>
            <p style="margin: 0 0 8px; font-weight: 700;">Mesaj trimis</p>
            <p style="margin: 0; white-space: pre-line;">${escapeHtml(body || '-')}</p>
          </div>
          <p style="margin: 24px 0 0;">Echipa Margele.net</p>
        </div>
      `,
      tags: ['contact', 'confirmation'],
    });
  }

  async function sendConversationReplyEmail(conversation, replyMessage) {
    const email =
      cleanEmail(conversation?.customerEmail) ||
      extractEmailFromContactDetail(conversation?.contactDetail);
    if (!email) {
      return { skipped: true, reason: 'missing_customer_email' };
    }

    const name = String(conversation?.customerName || '').trim();
    const subjectBase = String(conversation?.subject || 'Mesaj website').trim();
    const body = cleanMultiline(replyMessage);

    return sendTransactionalEmail({
      to: [{ email, name: name || undefined }],
      subject: `Raspuns Margele.net${subjectBase ? ` - ${subjectBase}` : ''}`,
      textContent: [
        `Salut${name ? `, ${name}` : ''}!`,
        '',
        body || '-',
        '',
        'Echipa Margele.net',
      ].join('\n'),
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
          <h2 style="margin: 0 0 16px;">Raspuns din partea echipei Margele.net</h2>
          <p style="margin: 0 0 12px;">Salut${name ? `, ${escapeHtml(name)}` : ''}!</p>
          <p style="margin: 0; white-space: pre-line;">${escapeHtml(body || '-')}</p>
          <p style="margin: 24px 0 0;">Echipa Margele.net</p>
        </div>
      `,
      tags: ['contact', 'reply'],
    });
  }

  return {
    isConfigured,
    sendTransactionalEmail,
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendNewOrderAdminAlert,
    sendReturnRequestAdminAlert,
    sendReturnRequestCustomerConfirmation,
    sendContactMessageAdminAlert,
    sendContactMessageCustomerConfirmation,
    sendConversationReplyEmail,
  };
}

function cleanEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email || '';
}

function cleanMultiline(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function extractEmailFromContactDetail(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  const match = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
  return match ? match[0] : '';
}

function formatSelectedOptions(selectedOptions) {
  if (!selectedOptions) return '';

  const options =
    Array.isArray(selectedOptions)
      ? selectedOptions
      : typeof selectedOptions === 'object'
        ? Object.entries(selectedOptions)
        : [];

  if (Array.isArray(options) && options.length > 0 && Array.isArray(options[0])) {
    return options
      .map(([key, value]) => `${humanizeLabel(key)}: ${value}`)
      .join(', ');
  }

  if (Array.isArray(options)) {
    return options
      .map((option) => {
        if (!option || typeof option !== 'object') return null;
        const key = option.name || option.label || option.key;
        const value = option.value;
        if (!key || value === undefined || value === null || value === '') return null;
        return `${humanizeLabel(key)}: ${value}`;
      })
      .filter(Boolean)
      .join(', ');
  }

  return '';
}

function humanizeLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  createBrevoMailer,
};
