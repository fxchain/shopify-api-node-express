import express from 'express';
import jwt from 'jsonwebtoken';
import shopifyClient from '../services/shopifyService.js';
const router = express.Router();
router.use(express.json());

router.post("/get_token", async (req, res) => {
	const { customerId } = req.body;

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
				expiresIn: "1h",
			});
			res.cookie("jwtToken", jwtToken, { httpOnly: true, secure: true });
			res.json(jwtToken);
		} catch (error) {
			res.status(401).json({ message: "Authentification failed." });
		}
	} else {
		res.status(401).json({ message: "Authentification failed." });
	}
});
export default router;
