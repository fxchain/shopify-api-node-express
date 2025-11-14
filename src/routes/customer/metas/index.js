import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import metas from './metas.json' with { type: "json" };
const router = express.Router();

//TODO: readd auth
/**
 * @openapi
 * /update_customer_metas:
 *    post:
 *       tags:
 *         - Update Shopify metas
 *       summary: Updates customer metafields and metaobjets
 *       requestBody:
 *         description: When handle is not provided, it will create a new metaobject entry. Parameter "fields.first_name" is required.
 *         required: true
 *         content:
 *           application/json: 
 *             schema:
 *               properties:
 *                 updateType:
 *                   type: string
 *                   enum: ["child", "mesures"]
 *                 fields:
 *                   type: object
 *                   required:
 *                     - first_name
 *                   properties:
 *                     handle:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     birthday:
 *                       type: string
 *                       description: A date in the YYYY-MM-DD format
 *                     chaussures_associees:
 *                       type: string
 *                       description: A list of product IDs seperated by commas
 *                     persona:
 *                       type: integer
 *                       description: The person metaobject ID
 *                   example:
 *                     handle: Victor-12547
 *                     first_name: Victor
 *                     birthday: 2018-05-15
 *                     chaussures_associees: 1234567890,0987654321
 *                     persona: 1234567890
 *                 current_kids:
 *                   type: string
 *                   description: A list of kids metaobject IDs currently associeded with the Customer. If not provided, they will be overwritten.
 *                   example: 1234567890,0987654321
 *       responses:
 *         '200':
 *           description: Update to Shopify's metas successful
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   metaobjectUpsert:
 *                     metaobject:
 *                       id: 1234567890
 *                       handle: Victore-12345
 *                       fields:
 *                         key: first_name
 *                         value: Victor
 *         '400':
 *           description: Bad Request.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 example:
 *                   message: Authentification failed
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
router.post("/", async (req, res) => {
    // const customerId = req.customerId;
    const customerId = 8643416850746;

    const updateType = req.body.updateType;

    if (!updateType) {
        res.status(400).json({ error: 'Bad request', message: 'Required "updateType" parameter not provided.' });
        return;
    }
    let variables;

    if (updateType === 'child') {
        const {handle, first_name, birthday, persona, chaussures_associees} = req.body.fields;
        
        if (typeof first_name === 'undefined') {
            res.status(400).json({ error: 'Bad request', message: 'Required "fields.first_name" parameter not provided.' });
        }
        const childHandle = (typeof handle === 'undefined') ? '' : handle;

        const fieldsProfilEnfant = [
            {"key": metas.enfant.fields.name, "value": first_name},
        ]

        if (typeof birthday !== 'undefined') {
           fieldsProfilEnfant.push({"key": metas.enfant.fields.birthday, "value": birthday}); 
        }

        if (typeof chaussures_associees !== 'undefined') {
           fieldsProfilEnfant.push({"key": metas.enfant.fields.chaussures, "value": chaussures_associees}); 
        }

        if (typeof persona !== 'undefined') {
           fieldsProfilEnfant.push({"key": metas.enfant.fields.persona, "value": `gid://shopify/Metaobject/${persona}`}); 
        }

        variables = {
            "handle": {
                "type": metas.enfant.name,
                "handle": childHandle
            },
            "metaobject": {
                "capabilities" : {
                    "publishable": {
                        "status": 'ACTIVE'
                    }
                },
                "fields": fieldsProfilEnfant
            }
        }

        try {
            const customerMetafieldQuery = `
                mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                        metaobject {
                            id
                            handle
                            fields {
                                key
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
            const { data, errors } = await shopifyClient.request(customerMetafieldQuery, { variables: variables });

            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
                return;
            }

            const kidsMetaobjectIds = [
                data.metaobjectUpsert.metaobject.id,
            ];
            
            if (typeof req.body.current_kids !== 'undefined') {
                const currentkids = req.body.current_kids.split(',');
                
                currentkids.forEach((id) => {
                    const kidId = `gid://shopify/Metaobject/${id}`;

                    if (!kidsMetaobjectIds.includes(kidId)) {
                        kidsMetaobjectIds.push(kidId);
                    }
                })
            }
            console.log("kidsMetaobjectIds", kidsMetaobjectIds);
            
            const customerData = await assignChildsToCustomer(customerId, kidsMetaobjectIds, res);

            res.json({
                data,
                customerData
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

        
    } else if (updateType === 'mesures') {
        const { handle, kidHandle, pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur } = req.body.fields;

        if (typeof pied_gauche_longueur === 'undefined' && typeof pied_gauche_largeur === 'undefined' && typeof pied_droit_longueur === 'undefined' && typeof pied_droit_largeur === 'undefined') {
            const mesureError = 'You must provide at least one on these parameters in the fields object: pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur'
            res.status(401).json({ message: mesureError });
        }

        if (typeof kidHandle === 'undefined') {
            const kidHandleError = 'You must provide the "fields.kidHandle" parameter.'
            res.status(400).json({ message: kidHandleError });
        }

        let date = new Date();
        const offset = date.getTimezoneOffset();
        date = new Date(date.getTime() - (offset*60*1000));
        const now = date.toISOString().split('T')[0];

        const mesureHandle = (typeof handle === 'undefined') ? '' : handle;

        const fieldsMesure = [
            {
                "key": metas.mesures.fields.date,
                "value": `${now}`
            }
        ];

        if (typeof pied_gauche_longueur !== 'undefined') {
            fieldsMesure.push({
                "key": metas.mesures.fields.g_longeur,
                "value": `${pied_gauche_longueur}`
            })
        }

        if (typeof pied_gauche_largeur !== 'undefined') {
            fieldsMesure.push({
                "key": metas.mesures.fields.g_largeur,
                "value": `${pied_gauche_largeur}`
            })
        }

        if (typeof pied_droit_longueur !== 'undefined') {
            fieldsMesure.push({
                "key": metas.mesures.fields.d_longeur,
                "value": `${pied_droit_longueur}`
            })
        }

        if (typeof pied_droit_largeur !== 'undefined') {
            fieldsMesure.push({
                "key": metas.mesures.fields.d_largeur,
                "value": `${pied_droit_largeur}`
            })
        }

        console.log('fieldsMesure', fieldsMesure);
        

        variables = {
            "handle": {
                "type": metas.mesures.name,
                "handle": mesureHandle
            },
            "metaobject": {
                "capabilities" : {
                    "publishable": {
                        "status": 'ACTIVE'
                    }
                },
                "fields": fieldsMesure
            }
        };
        console.log("variables", JSON.stringify(variables));
        

        try {
            const mesuresMetafieldQuery = `
                mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                        metaobject {
                            id    
                            handle
                        }
                        userErrors {
                            field
                            message
                            code
                        }
                    }
                }
            `;
            const { data, errors, extensions } = await shopifyClient.request(mesuresMetafieldQuery, { variables: variables });
        
            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
                return;
            }
            const mesureData = await assignMesureToChild(kidHandle, data.metaobjectUpsert.metaobject.id, res);


            res.json({
                data
            })
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    
    } 

    return;

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

        const { data, errors } = await shopifyClient.request(customerMetafieldQuery, {
            variables: {
                id: `gid://shopify/Customer/${customerId}`,
            },
        });
        
        if (typeof errors !== 'undefined') {
            handleErrors(errors, res);
        }
        
        var metaObjectData = data;
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
    console.log("metaObjectData", metaObjectData);
    

    return;
    // If metafield is not set, we need to assign the metaObject to the customer
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

const assignChildsToCustomer = async (customerId, metaObjectIds, res) => {
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

        const { data, errors } = await shopifyClient.request(setMetaOjectToMetafield, { variables: {
            metafields: {
                key: metas.customer.enfants.key,
                namespace: metas.customer.enfants.namespace,
                ownerId: `gid://shopify/Customer/${customerId}`,
                value: JSON.stringify(metaObjectIds)
            }
        }});


        if (typeof errors !== 'undefined') {
            handleErrors(errors, res);
            return;
        }

        var setMfdata = data;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    return setMfdata;
}

const assignMesureToChild = async (kidHandle, mesureId, res) => {
    try {
        const mesureMetafieldQuery = `
            mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                    metaobject {
                        id
                        handle
                        fields {
                            key
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

        const variables =  {
            "handle": {
                "type": metas.enfant.name,
                "handle": kidHandle
            },
            "metaobject": {
                "fields": {
                    "key": metas.enfant.fields.mesures,
                    "value": mesureId
                }
            }
        }
        const { data, errors } = await shopifyClient.request(mesureMetafieldQuery, { variables: variables });

        if (typeof errors !== 'undefined') {
            handleErrors(errors, res);
            return;
        }

        return data;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const handleErrors = (errors, res) => {
    const errorsMessage = [];

    errors.graphQLErrors.forEach(error => {
        errorsMessage.push(error.message);
    });
    
    const error = {
        message: errors.message,
        errors: errorsMessage
    }

    res.status(400).json({ error });
    return;
}

export default router;