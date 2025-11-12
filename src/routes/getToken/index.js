import express from 'express';
import jwt from 'jsonwebtoken';
import shopifyClient from '../../services/shopifyService.js';
const router = express.Router();
router.use(express.json());

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
			res.json(jwtToken);
		} catch (error) {
			res.status(401).json({ message: 'Authentification failed.' });
		}
	} else {
		res.status(401).json({ message: 'Authentification failed.' });
	}
});
export default router;
