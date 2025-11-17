import express from 'express';
import jwt from 'jsonwebtoken';
import shopifyClient from '../../services/shopifyService.js';
const router = express.Router();
router.use(express.json());

/**
 * @openapi
 * /api/token:
 *    post:
 *       tags:
 *         - Authorization
 *       summary: Retrive a JWT token valid for 1 hour
 *       description: Retrive a JWT token.
 *       security: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 customerId:
 *                   type: integer
 *                   required: true
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
	if (typeof req.body === 'undefined') {
		res.status(401).json({ message: "Authentification failed." });
	}
	let { customerId } = req.body;

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

			const { data } = await shopifyClient.request(operation, {
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

			// if (cookie && cookie === true) {
			// 	console.log('set cookie', process.env.ENVIRONMENT === 'production');
			// 	res.cookie('rememberme', '1', { maxAge: 900000, httpOnly: true });
			// 	res.cookie('myCookie', 'cookie_value', { maxAge: 3600000 });
			// 	res.cookie('sqdf', jwtToken, {
			// 		// httpOnly: true,
			// 		secure: process.env.ENVIRONMENT === 'production', // Only send over HTTPS
			// 		sameSite: 'Strict' // Protect against CSRF
			// 	});
			// }
			res.json({token: jwtToken});
		} catch (error) {
			res.status(401).json({ message: 'Authentification failed.' });
		}
	} else {
		res.status(500).json({ message: 'Internal Server Error' });
	}
});
export default router;
