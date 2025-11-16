import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import handleErrors from '../../../utils/handleErrors.js';
import metas from '../../../schema/customer_metas.json' with { type: "json" };
const router = express.Router();

/**
 * @openapi
 * /api/customer/measure/delete:
 *    delete:
 *       tags:
 *         - Measures metaobject
 *       summary: Delete a Shopify measure metaobjet entry
 *       requestBody:
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 measureId:
 *                   type: integer
 *                   example: 123456789
 *       responses:
 *         '200':
 *           description: Delete measure metaobject entry successful
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
 *                   message: measure metaobject ID cannot be found.
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
router.delete("/", auth, async (req, res) => {
  // const customerId = req.customer
  const customerId = 8643416850746;
  let variables;

  const { measureId } = req.body;

  try {
    variables = {
      "id": `gid://shopify/Metaobject/${measureId}`
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
      handleErrors(errors, false, res);
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
    return;
  }
});

export default router;