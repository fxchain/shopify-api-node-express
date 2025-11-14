import express from 'express';
import jwt from 'jsonwebtoken';
import shopifyClient from '../../services/shopifyService.js';
const router = express.Router();
router.use(express.json());

/**
 * @openapi
 * /get_token:
 *    post:
 *       tags:
 *         - Authorization
 *       summary: Retrive a JWT token valid for 1 hour
 *       security: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 customerId:
 *                   type: integer
 *                   example: 123456789
 *       responses:
 *         '200':
 *           description: The JWT token
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   token: abc123
 *         '401':
 *           description: Authentification failed (most likely wrong Shopify customer ID).
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
router.post("/", async (req, res) => {
	let { customerId, cookie } = req.body;

	if (!cookie) {
		cookie = false;
	}

	if (!isNaN(customerId)) {
		//Check if customer id exists on store
		try {
			const operation = `
				query CustomerQuery($id: ID!) {
					customer(id: $id) {
						id
					}
				}
			`;

			const { data, errors, extensions } = await shopifyClient.request(operation, {
				variables: {
					id: `gid://shopify/Customer/${customerId}`,
				},
			});

			if (!data.customer) {
				res.status(401).json({ message: "Authentification failed." });
			}

			const jwtToken = jwt.sign({ customerId }, process.env.JWT_SECRET, {
				expiresIn: '1h',
			});

			if (cookie && cookie === true) {
				res.cookie('middleware_token', jwtToken, {
					httpOnly: true,
					secure: process.env.ENVIRONMENT === 'production', // Only send over HTTPS
					sameSite: 'Strict' // Protect against CSRF
				});
			}
			res.json({token: jwtToken});
		} catch (error) {
			res.status(401).json({ message: 'Authentification failed.' });
		}
	} else {
		res.status(500).json({ message: 'Internal Server Error' });
	}
});
export default router;
