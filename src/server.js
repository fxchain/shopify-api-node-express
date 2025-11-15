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
