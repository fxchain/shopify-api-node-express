# Shopify Node middleware

This backend Node application is used as a middleware to enables a frontend apps to interact with Shopify's admin API.

It uses JWT token and CORS for security.

You fist query for a JWT token using the Shopify customer's ID, and you get an JWR token valid for 1h to use in your frontend app. Than you can make queries to interact withe the Shopify admin API.

## App scopes

Currently, this app only enables writing to a customer's metafields/metaobject

## Current endpoints