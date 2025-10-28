# Shopify Node middleware

This backend Node application is used as a middleware to enable frontend apps to interact with Shopify's admin API.

It uses JWT token and CORS for security.

You fist query for a JWT token using the Shopify customer's ID, and you get an JWR token, valid for 1h, to use in your frontend app. Then you can make queries to interact with the Shopify admin API.

## App scopes

Currently, this app only enables writing to a customer's metafields/metaobject

The minium app scopes are `write_metaobjects, read_metaobjects, read_customers`

## Current endpoints

`/get_token` POST
Public endpoint to retrive a JWT token valid for an hour. You must POST the customerID. Use this token to make calls to other prive endpoints


## Install

### Requirements
- Node version >20.18.0
- Access the Shopify store and create/edit custom apps

### Local install

```
git clone [git URL]
cd [folder]
npm install
cp .env.exemple .env
```

Edit the .env file witht the required info. You will need to create a private app in Shopify, assign the correct scopes and get your app's Admin API access token.

#### Run the app locally
`npm run dev`

Use something like Postman to make calls to the local app.

### Server install
```
npm install
npm run start
```