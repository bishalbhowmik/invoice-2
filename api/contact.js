// api/contact.js
const axios = require("axios");

module.exports = async (req, res) => {
  const contactId = req.query.id;
  const token = process.env.HUBSPOT_API_KEY;

  if (!contactId) {
    return res.status(400).json({ error: "Missing contact ID" });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Get invoices associated with the contact
    const contactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=invoices&archived=false`;
    const contactRes = await axios.get(contactUrl, { headers });

    const invoiceIds =
      contactRes.data?.associations?.invoices?.results?.map(i => i.id) || [];

    // Step 2: Fetch invoice details
    const invoiceDetails = [];

    for (const id of invoiceIds) {
      const invoiceUrl = `https://api.hubapi.com/crm/v3/objects/invoices/${id}?properties=hs_number,hs_invoice_link`;

      try {
        const invoiceRes = await axios.get(invoiceUrl, { headers });
        const properties = invoiceRes.data.properties;

        invoiceDetails.push({
          id,
          hs_number: properties.hs_number,
          hs_invoice_link: properties.hs_invoice_link,
        });
      } catch (invoiceErr) {
        console.error(`Error fetching invoice ${id}:`, invoiceErr?.response?.data || invoiceErr.message);
      }
    }

    res.status(200).json({ contactId, invoiceDetails });
  } catch (err) {
    console.error("❌ Contact fetch failed:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch contact or invoices" });
  }
};
