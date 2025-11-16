import express from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import handleErrors from '../../../utils/handleErrors.js';
import metas from '../../../schema/customer_metas.json' with { type: "json" };
const router = express.Router();

/**
 * @openapi
 * /api/customer/measure/upsert:
 *    post:
 *       tags:
 *         - Measures metaobject
 *       summary: Add or update a Shopify measure metaobjet entry
 *       requestBody:
 *         description: When parameter "handle" is not provided, it will create a new metaobject entry, otherwise update it. Parameter "childId" is required.
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 handle:
 *                   type: string
 *                 childId:
 *                   type: integert
 *                   required: true
 *                 pied_gauche_longueur:
 *                   type: integer
 *                 pied_gauche_largeur:
 *                   type: int  eger
 *                 pied_droit_longueur:
 *                   type: integer
 *                 pied_droit_largeur:
 *                   type: integer
 *               example:
 *                 handle: mm-measures-g8pe3aym
 *                 childId: 123456789
 *                 pied_gauche_longueur: 10
 *                 pied_gauche_largeur: 4
 *                 pied_droit_longueur: 10.5
 *                 pied_droit_largeur: 4.2
 *       responses:
 *         '200':
 *           description: Update to measure's metas successful. Shopify sometimes retruns erorrs with a 200 status. They will be stored in the userErrors array.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   data:
 *                      metaobjectUpsert:
 *                        metaobject:
 *                          id: 1234567890
 *                          handle: mm-measures-fyfz6qyd
 *                        userErrors: []
 *         '400':
 *           description: Bad Request.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Parameter 'childId' was not provided.
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
  const customerId = req.customer
  let variables;
  const { handle, childId, pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur } = req.body;

  if (typeof childId === 'undefined') {
    const childIdError = 'You must provide the \'childId\' parameter.'
    res.status(400).json({ message: childIdError });
    return;
  }

  // if (
  //   typeof pied_gauche_longueur === 'undefined'
  //   && typeof pied_gauche_largeur === 'undefined'
  //   && typeof pied_droit_longueur === 'undefined'
  //   && typeof pied_droit_largeur === 'undefined'
  // ) {
  //   const measureError = 'You must provide at least one of these parameters: pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur'
  //   res.status(400).json({ message: measureError });
  //   return;
  // }
  let date = new Date();
  const offset = date.getTimezoneOffset();
  date = new Date(date.getTime() - (offset * 60 * 1000));
  const now = date.toISOString().split('T')[0];
  const measureHandle = (typeof handle === 'undefined') ? '' : handle;

  const fieldsmeasure = [
    {
      "key": metas.measures.fields.date,
      "value": `${now}`
    }
  ];

  if (typeof pied_gauche_longueur !== 'undefined') {
    fieldsmeasure.push({
      "key": metas.measures.fields.g_longeur,
      "value": `${pied_gauche_longueur}`
    })
  }

  if (typeof pied_gauche_largeur !== 'undefined') {
    fieldsmeasure.push({
      "key": metas.measures.fields.g_largeur,
      "value": `${pied_gauche_largeur}`
    })
  }

  if (typeof pied_droit_longueur !== 'undefined') {
    fieldsmeasure.push({
      "key": metas.measures.fields.d_longeur,
      "value": `${pied_droit_longueur}`
    })
  }

  if (typeof pied_droit_largeur !== 'undefined') {
    fieldsmeasure.push({
      "key": metas.measures.fields.d_largeur,
      "value": `${pied_droit_largeur}`
    })
  }

  variables = {
    "handle": {
      "type": metas.measures.name,
      "handle": measureHandle
    },
    "metaobject": {
      "capabilities": {
        "publishable": {
          "status": 'ACTIVE'
        }
      },
      "fields": fieldsmeasure
    }
  };

  try {
    const measuresMetafieldQuery = `
      mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject {
            id    
            handle
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;
    const { data, errors } = await shopifyClient.request(measuresMetafieldQuery, { variables: variables });

    if (typeof errors !== 'undefined') {
      handleErrors(errors, false, res);
      return;
    }    

    if (typeof data.metaobjectUpsert.userErrors.length > 0) {
      handleErrors(data.metaobjectUpsert.userErrors, true, res);
      return;
    }
    const childData = await assignmeasureToChild(childId, data.metaobjectUpsert.metaobject.id, res);

    res.json({
      data,
      childData
    });

  } catch (error) {
    res.status(500).json({ message: error.message + "01" });
    return;
  }
});

const assignmeasureToChild = async (childId, measureId, res) => {
  try {
    // Get current child handle and measures IDs
    const getChildMetaobjectQuery = `{
      metaobject(id: "gid://shopify/Metaobject/${childId}") {
        handle
        field (key: "${metas.enfant.fields.measures}") {
          value
        }
      }
    }`;
    const { data, errors } = await shopifyClient.request(getChildMetaobjectQuery);

    if (typeof errors !== 'undefined') {
      handleErrors(errors, false, res);
      return;
    }

    var dataChild = data;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  let measuresIds = measureId;

  if (dataChild.metaobject.field.value !== null && !dataChild.metaobject.field.value.includes(measureId)) {
    const cleaned = dataChild.metaobject.field.value.replace(']', '');
    measuresIds = `${cleaned},"${measureId}"]`;
  } else {
    measuresIds = `["${measureId}"]`;
  }

  try {    
    const measureMetafieldQuery = `
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

    const variables = {
      "handle": {
        "type": metas.enfant.name,
        "handle": dataChild.metaobject.handle
      },
      "metaobject": {
        "fields": {
          "key": metas.enfant.fields.measures,
          "value": measuresIds
        }
      }
    }
    const { data, errors } = await shopifyClient.request(measureMetafieldQuery, { variables: variables });

    if (typeof errors !== 'undefined') {
      handleErrors(errors, false, res);
      return;
    }
    
    if (typeof data.metaobjectUpsert.userErrors.length > 0) {
      handleErrors(data.metaobjectUpsert.userErrors, true, res);
      return;
    }

    var measuresData;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  return measuresData;
}

export default router;