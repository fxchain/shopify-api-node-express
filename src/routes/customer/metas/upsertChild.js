import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import handleErrors from '../../../utils/handleErrors.js';
import metas from '../../../schema/customer_metas.json' with { type: "json" };
const router = express.Router();

/**
 * @openapi
 * /api/customer/child/upsert:
 *    post:
 *       tags:
 *         - Childs metaobject
 *       summary: Add or update a Shopify child metaobjet entry
 *       requestBody:
 *         description: When parameter "handle" is not provided, it will create a new metaobject entry, otherwise update it. When parameter "handle" is not provided, the parameter "first_name" is required.
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                handle:
 *                  type: string
 *                first_name:
 *                  type: string
 *                birthday:
 *                  type: string
 *                  description: A date in the YYYY-MM-DD format
 *                chaussures_associees:
 *                  type: array
 *                  description: An array of product IDs
 *                persona:
 *                  type: integer
 *                  description: The person metaobject ID
 *                current_kids:
 *                  type: array
 *                  description: An array of kids metaobject IDs currently associeded with the Customer. If not provided, they will be overwritten.
 *               example:
 *                handle: Victor-12547
 *                first_name: Victor
 *                birthday: 2018-05-15
 *                chaussures_associees: [1234567890,0987654321]
 *                persona: 1234567890
 *       responses:
 *         '200':
 *           description: Update to child's metas successful. Shopify sometimes retruns erorrs with a 200 status. They will be stored in the userError array.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   data:
 *                     metaobjectUpsert:
 *                       metaobject:
 *                         id: 1234567890
 *                         handle: victore-5
 *                         fields:
 *                           key: first_name
 *                           value: Victor
 *                       userErrors: []
 *         '400':
 *           description: Bad Request.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Parameter 'first_name' was not provided.
 *         '401':
 *           description: Unauthorized - The JWT token was not provided, expired, or wrong.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Authentification failed
 *         '500':
 *           description: Internal Server Error
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Internal Server Error
 */
router.post("/", auth, async (req, res) => {
  // const customerId = req.customer
  const customerId = 8643416850746;
  let variables;

  const { handle, first_name, birthday, persona, chaussures_associees } = req.body;

  if (typeof first_name === 'undefined' && typeof handle === 'undefined') {
    res.status(400).json({ error: 'Bad request', message: 'You must provide at least of of \'first_name\' or \'handle\' parameters.' });
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
      handleErrors(errors, false, res);
      return;
    }

    const kidsMetaobjectIds = [
      data.metaobjectUpsert.metaobject.id,
    ];

    if (typeof req.body.current_kids !== 'undefined' && req.body.current_kids.length > 0) {
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
      handleErrors(errors, false, res);
      return;
    }

    var setMfdata = data;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  return setMfdata;
}

export default router;