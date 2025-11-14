import express from 'express';
import auth from './middleware/auth.js';
import cors from 'cors';
import getToken from './routes/getToken/index.js';
import updateCustomerMetas from './routes/customer/metas/index.js';
import swaggerDocs from './utils/swagger.js';

const app = express();

app.use(express.json());


// Handle JSON format errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(err);
        return res.status(400).send({ status: 400, message: err.message }); // Bad request
    }
    next();
});

// const corsOptions = {
//   origin: process.env.CORS_ORIGIN || 'https://nodetest.local.com',
//   methods: process.env.CORS_METHODS || 'GET,POST',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// app.use(cors(corsOptions))

/*
  * Route : /get_token
  * Method: POST
  * Description: Generates a JWT token for the customer based on their ID.
  * If cookie is set to true, the token is set on the user's browser in a cookie
  * Request Body: { customerId: <customer_id>, cookie: <true | false> }
  * Response: JWT token if successful, error 4xx if not.
*/
app.use("/get_token", getToken);

/*
  * Route : /update_customer_metafields
  * Method: POST
  * Description: Updates customer metadata.
  * Request Headers: Authorization (JWT token)
  * Request Body: { metas: <metas_object> }
  * Response: Success message with posted values if successful, 4xx error if not.
*/
app.use("/update_customer_metas", updateCustomerMetas);

app.get('/', (req, res) => {
  console.log('req', req);

  res.send('Hello World!');
});

if (process.env.ENVIRONMENT === 'development') {
  app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');

    swaggerDocs(app, 3000);
  });
}
// else {
//   app.listen(443, () => {
//     console.log('Server is running on http://localhost');
//   });
//   module.exports = app;
// }
export default app;
