import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import metas from './metas.json' with { type: "json" };
const router = express.Router();

//TODO: readd auth
router.post("/", async (req, res) => {
  // const customerId = req.customer
  const customerId = 8643416850746;
  let variables;

  const { handle, first_name, birthday, persona, chaussures_associees } = req.body;

  if (typeof first_name === 'undefined' && typeof handle === 'undefined') {
    res.status(400).json({ error: 'Bad request', message: 'You must provide at least of of "first_name" or "handle" parameters.' });
    return;
  }
  const childHandle = (typeof handle === 'undefined') ? '' : handle;

  const fieldsProfilEnfant = [
    { "key": metas.enfant.fields.name, "value": first_name },
  ]

  if (typeof birthday !== 'undefined') {
    fieldsProfilEnfant.push({ "key": metas.enfant.fields.birthday, "value": birthday });
  }

  if (typeof chaussures_associees !== 'undefined') {
    fieldsProfilEnfant.push({ "key": metas.enfant.fields.chaussures, "value": JSON.stringify(chaussures_associees) });
  }

  if (typeof persona !== 'undefined') {
    fieldsProfilEnfant.push({ "key": metas.enfant.fields.persona, "value": `gid://shopify/Metaobject/${persona}` });
  }

  variables = {
    "handle": {
      "type": metas.enfant.name,
      "handle": childHandle
    },
    "metaobject": {
      "capabilities": {
        "publishable": {
          "status": 'ACTIVE'
        }
      },
      "fields": fieldsProfilEnfant
    }
  }

  const customerMetafieldQuery = `
    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject {
          id
          handle
          fields {
            key
            value
          }
        }
        userErrors {
          field
          message
          code
        }
      }
    }
  `;

  try {
    const { data, errors } = await shopifyClient.request(customerMetafieldQuery, { variables: variables });

    if (typeof errors !== 'undefined') {
      handleErrors(errors, res);
      return;
    }

    const kidsMetaobjectIds = [
      data.metaobjectUpsert.metaobject.id,
    ];

    if (typeof req.body.current_kids !== 'undefined' && req.body.current_kids.length > 0) {
      // const currentkids = req.body.current_kids.split(',');

      req.body.current_kids.forEach((id) => {
        const kidId = `gid://shopify/Metaobject/${id}`;

        if (!kidsMetaobjectIds.includes(kidId)) {
          kidsMetaobjectIds.push(kidId);
        }
      })
    }
    const customerData = await assignChildsToCustomer(customerId, kidsMetaobjectIds, res);

    res.json({
      data,
      customerData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

const assignChildsToCustomer = async (customerId, metaObjectIds, res) => {
  try {
    const setMetaOjectToMetafield = `
            mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
                metafieldsSet(metafields: $metafields) {
                    metafields {
                        key
                        namespace
                        value
                    }
                    userErrors {
                        field
                        message
                        code
                    }
                }
            }
        `;

    const { data, errors } = await shopifyClient.request(setMetaOjectToMetafield, {
      variables: {
        metafields: {
          key: metas.customer.enfants.key,
          namespace: metas.customer.enfants.namespace,
          ownerId: `gid://shopify/Customer/${customerId}`,
          value: JSON.stringify(metaObjectIds)
        }
      }
    });


    if (typeof errors !== 'undefined') {
      handleErrors(errors, res);
      return;
    }

    var setMfdata = data;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  return setMfdata;
}

export default router;