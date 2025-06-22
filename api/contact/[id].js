const axios = require("axios");

module.exports = async (req, res) => {
  // ✅ Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://trtaustralia-portal.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request (for safety)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const contactId = req.query.id;
  const apiKey = process.env.HUBSPOT_API_KEY;

  if (!contactId) {
    return res.status(400).json({ error: "Missing contact ID in URL" });
  }

  const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=invoices&archived=false`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    const contactResponse = await axios.get(contactUrl, { headers });

    const invoiceAssociations = contactResponse.data?.associations?.invoices?.results || [];
    const invoiceIds = invoiceAssociations.map(inv => inv.id);

    if (invoiceIds.length === 0) {
      return res.json({ contactId, invoiceDetails: [] });
    }

    const invoiceDetails = [];

    for (const invoiceId of invoiceIds) {
      const invoiceUrl = `https://api.hubapi.com/crm/v3/objects/invoices/${invoiceId}?properties=hs_invoice_link,hs_number`;

      try {
        const invoiceRes = await axios.get(invoiceUrl, { headers });
        invoiceDetails.push({
          id: invoiceRes.data.id,
          hs_invoice_link: invoiceRes.data.properties.hs_invoice_link,
          hs_number: invoiceRes.data.properties.hs_number,
        });
      } catch (invoiceError) {
        console.error(`❌ Failed to fetch invoice ${invoiceId}`, invoiceError?.response?.data || invoiceError.message);
      }
    }

    res.json({ contactId, invoiceDetails });
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
};
