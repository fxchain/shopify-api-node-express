import express from 'express';
import getToken from './routes/getToken.js';
import auth from './middleware/auth.js';
import cors from 'cors';
import updateCustomerMetas from './routes/updateCustomerMetas.js';

const app = express();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://nodetest.local.com',
  methods: process.env.CORS_METHODS || 'GET,POST',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))

/*
  * Route : /get_token
  * Method: POST
  * Description: Generates a JWT token for the customer based on their ID.
  * Request Body: { customerId: <customer_id> }
  * Response: JWT token if successful, error message if not.
*/
app.use("/get_token", getToken);

/*
  * Route : /update_metas
  * Method: POST
  * Description: Updates customer metadata in the Shopify store.
  * Request Headers: Authorization (JWT token)
  * Request Body: { customerId: <customer_id>, metas: <metas_object> }
  * Response: Success message with posted values if successful, error message if not.
*/
app.use("/update_customer_metafields", updateCustomerMetas);

app.post('/', auth, (req, res) => {
  console.log('req', req);

  res.send('Hello World!');
});

if (process.env.ENVIRONMENT === 'development') {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
  });
} else {
  app.listen(443, () => {
    console.log('Server is running on http://localhost');
  });
}

