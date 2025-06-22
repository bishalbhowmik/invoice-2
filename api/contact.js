// api/contact.js
require("dotenv").config();
const axios = require("axios");

module.exports = async (req, res) => {
  const { query } = req;
  const contactId = query.id;
  const token = process.env.HUBSPOT_API_KEY;

  if (!contactId) return res.status(400).json({ error: "Missing contact ID" });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=invoices&archived=false`;
    const contactRes = await axios.get(contactUrl, { headers });

    const invoiceIds = contactRes.data?.associations?.invoices?.results?.map(i => i.id) || [];

    const invoiceDetails = [];

    for (const id of invoiceIds) {
      const invoiceUrl = `https://api.hubapi.com/crm/v3/objects/invoices/${id}?properties=hs_number,hs_invoice_link`;
      const invoiceRes = await axios.get(invoiceUrl, { headers });

      invoiceDetails.push({
        id,
        hs_number: invoiceRes.data.properties.hs_number,
        hs_invoice_link: invoiceRes.data.properties.hs_invoice_link,
      });
    }

    res.status(200).json({ contactId, invoiceDetails });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Something went wrong." });
  }
};
