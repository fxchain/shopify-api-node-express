import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import metas from '../../../schema/customer_metas.json' with { type: "json" };
const router = express.Router();

//TODO: readd auth
/**
 * @openapi
 * /api/customer/delete_child:
 *    delete:
 *       tags:
 *         - Childs metaobject
 *       summary: Delete a Shopify child metaobjet entry
 *       requestBody:
 *         description: When a child entry is deleted, all its associeted measures metaobject entries will be deleted too.
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 childId:
 *                   type: integer
 *                   example: 123456789
 *       responses:
 *         '200':
 *           description: Delete child metaobject entry successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   metaobjectDelete:
 *                     metaobject:
 *                       deletedId: "gid://shopify/Metaobject/123456789"
 *                       userErrors: []
 *         '400':
 *           description: Bad Request.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Child metaobject ID cannot be found.
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
router.delete("/", async (req, res) => {
  // const customerId = req.customer
  const customerId = 8643416850746;
  let variables;

  const { childId } = req.body;

  if (typeof childId === 'undefined') {
    const childIdError = 'You must provide the child\'s "childId" parameter.'
    res.status(400).json({ message: deleteHandleError });
    return;
  }

  try {
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
        handleErrors(errors, res);
        return;
    }

    if (data.metaobject === null) {
      res.status(400).json({ message: 'Child metaobject ID cannot be found' });
      return;
    }
    var dataChild = data;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

  if (dataChild.metaobject.field.value !== null) {
    const measuresString = dataChild.metaobject.field.value.replace('[', '').replace(']', '').replaceAll('"', '');
    const measureIds = measuresString.split(',');

    variables = {
      "where": {
        "ids": measureIds
      }
    }
    const deleteMetaobjectsQuery = `
      mutation DeleteMetaobjects($where: MetaobjectBulkDeleteWhereCondition!) {
        metaobjectBulkDelete(where: $where) {
          job {
            id
            done
          }
        }
      }
    `;
    const { data, errors } = await shopifyClient.request(deleteMetaobjectsQuery, { variables: variables });
  }

  try {
    variables = {
      "id": `gid://shopify/Metaobject/${childId}`
    };

    const deleteMetaobjectQuery = `
      mutation DeleteMetaobject($id: ID!) {
        metaobjectDelete(id: $id) {
          deletedId
          userErrors {
            field
            message
            code
          }
        }
      }
    `;
    const { data, errors } = await shopifyClient.request(deleteMetaobjectQuery, { variables: variables });

    if (typeof errors !== 'undefined') {
      handleErrors(errors, res);
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});


export default router;