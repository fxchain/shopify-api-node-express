import express from 'express';
import shopifyClient from '../services/shopifyService.js';
import auth from '../middleware/auth.js';
const router = express.Router();
const metafieldNamespace = process.env.SHOPIFY_METAFIELD_NAMESPACE || "custom";
const metafieldKey = process.env.SHOPIFY_METAFIELD_KEY || "chaussures";

router.post("/", auth, async (req, res) => {
    const customerId = req.customerId;
    console.log("customerId", customerId);
    
    // Check if metaobject is set for the customer
    try {
        const customerMetafieldQuery = `
            query CustomerMetafieldQuery($id: ID!){
                customer(id: $id) {
                    id
                    metafield(namespace: ${metafieldNamespace}, key: ${metafieldKey}) {
                        value
                    }
                }
            }
        `;

        const { data, errors, extensions } = await shopifyClient.request(customerMetafieldQuery, {
            variables: {
                id: `gid://shopify/Customer/${customerId}`,
            },
        });
        var metaObjectData = data;
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
    console.log("metaObjectData", metaObjectData);
    
    // If metafield is not set, we need to assign the metaObject
    if (typeof metaObjectData !== 'undefined') {
        if (metaObjectData.customer?.metafields === null) {
            console.log('getting mo id');
            // First get the metaobject id
            try {
                const getMetaobjectId = `
                    {
                        metaobjects(first: 5, type: ${metafieldKey}) {
                            nodes {
                                id
                            }
                        }
                    }
                `;
                const { data, errors, extensions } = await shopifyClient.request(getMetaobjectId);
                var metaObjectId = data.metaobjects.nodes[0].id;
            } catch (error) {
                res.status(401).json({ message: error.message });
            }

            console.log('setting mf');
            // Then we set the metafield with the metaobject id
            try {
                const setMetaOjectToMetafield = `
                    mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
                        metafieldsSet(metafields: $metafields) {
                            metafields {
                                key
                                namespace
                                value
                            }
                            userErrors {
                                field
                                message
                                code
                            }
                        }
                    }
                `;

                const { data, errors, extensions } = await shopifyClient.request(setMetaOjectToMetafield, {
                    variables: {
                        metafields: [
                            {
                                key: metafieldKey,
                                namespace: metafieldNamespace,
                                ownerId: `gid://shopify/Customer/${customerId}`,
                                type: "metaobject_reference",
                                value: metaObjectId
                            }
                        ]
                    },
                });
                var setMfdata = data;
                console.log("setMfdata", setMfdata);
                console.log("errors", errors);
                
            } catch (error) {
                res.status(401).json({ message: error.message });
            }
        }
    }

    // Finally, we add/update the metaobject with posted data
    console.log('updating metaobject');
    console.log('req.body', req);

    const { pointure_droite, pointure_gauche } = req;
    console.log("pointure_droite", pointure_droite);
    console.log("pointure_gauche", pointure_gauche);
    
    try {
        const updateCustomerMetaObject = `
            mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
                metaobjectUpdate(id: $id, metaobject: $metaobject) {
                    metaobject {
                        handle
                        chaussures: field(key: ${metafieldKey}) {
                            value
                        }
                    }
                    userErrors {
                        field
                        message
                        code
                    }
                }
            }
        `;

        const { data, errors } = await shopifyClient.request(updateCustomerMetaObject, {
            variables: {
                "id": "gid://shopify/Metaobject/158929289530",
                "metaobject": {
                    "fields": [
                        {
                            "key": "pointure_droite",
                            "value": "[\"15\", \"16\"]"
                        },
                        {
                            "key": "pointure_gauche",
                            "value": "[\"40\", \"41\"]"
                        }
                    ]
                }
            },
        });
        var metaObjectData = data;
        console.log("metaObjectData", metaObjectData);
        console.log("errors", errors);
        
    } catch (error) {
        res.status(401).json({ message: error.message });
    }

    res.json(metaObjectData);
});

export default router;