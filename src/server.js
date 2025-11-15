import express from 'express';
import auth from './middleware/auth.js';
import cors from 'cors';
import getToken from './routes/getToken/index.js';
// import updateCustomerMetas from './routes/customer/metas/index.js';
import updateChildMetas from './routes/customer/metas/upsertChild.js';
import updatemeasureMetas from './routes/customer/metas/upsertMeasures.js';
import deleteChild from './routes/customer/metas/deleteChild.js';
import swaggerDocs from './utils/swagger.js';

const app = express();

app.use(express.json());


// Handle JSON format errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error(err);
        return res.status(400).send({ status: 400, message: err.message });
    }
    next();
});

// const corsOptions = {
//   origin: process.env.CORS_ORIGIN || 'https://nodetest.local.com',
//   methods: process.env.CORS_METHODS || 'GET,POST',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// app.use(cors(corsOptions))

app.use("/api/get_token", getToken);

/**
 * @openapi
 * /api/customer/upsert_child:
 *    post:
 *       tags:
 *         - Childs metaobject
 *       summary: Updates child Shopify metafields and metaobjets
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
 *           description: Update to child's metas successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   data:
 *                     metaobjectUpsert:
 *                       metaobject:
 *                         id: 1234567890
 *                         handle: Victore-12345
 *                         fields:
 *                           key: first_name
 *                           value: Victor
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
app.use("/api/customer/upsert_child", updateChildMetas);

app.use("/api/customer/delete_child", deleteChild);

app.use("/api/customer/upsert_measure", updatemeasureMetas);


app.get('/', (req, res) => {
  console.log('req', req);

  res.send('Hello World!');
});

if (process.env.ENVIRONMENT === 'development') {
  app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');

    swaggerDocs(app, 3000);
  });
}

export default app;
