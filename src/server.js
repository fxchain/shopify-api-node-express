import express from 'express';
import getToken from './routes/getToken.js';
import auth from './middleware/auth.js';
import updateCustomerMetas from './routes/updateCustomerMetas.js';

const app = express();

app.use("/", getToken);


app.use("/", updateCustomerMetas);

app.get('/', auth, (req, res) => {
  console.log('req', req);
  
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});