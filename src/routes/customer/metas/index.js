import express from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
const router = express.Router();

//TODO: readd auth
router.post("/", async (req, res) => {
    // console.log('req.body', req.body);
    
    const customerId = req.customerId;
    
    const metafieldNamespace = 'custom';
    const metafieldKey = 'mm_kids';

    const updateType = req.body.updateType;

    if (!updateType) {
        res.status(400).json({ error: 'Bad request', message: '"updateType" parameter not provided.' });
        return;
    }
    
    if (updateType === "upsert child") {
        const {handle, first_name, birthday, chaussures_associees} = req.body.fields;
        
        if (typeof first_name === 'undefined') {
            res.status(400).json({ error: 'Bad request', message: 'Required "fields.first_name" parameter not provided.' });
        }
        const childHandle = (typeof handle === 'undefined') ? `${first_name}-${customerId}` : handle;

        let fields = [
            {"key": "first_name", "value": first_name},
            // ...((typeof first_name !== 'undefined') && {"key": "first_name", "value": first_name}),
            // ...((typeof birthday !== 'undefined') && {"key": "birthday", "value": birthday}),
            // ...((typeof chaussures_associees !== 'undefined') && {"key": "chaussures_associees", "value": chaussures_associees})
        ]

        if (typeof birthday !== 'undefined') {
           fields.push({"key": "birthday", "value": birthday}); 
        }

        if (typeof chaussures_associees !== 'undefined') {
           fields.push({"key": "chaussures_associees", "value": chaussures_associees}); 
        }

        // fields.push({"key": "first_name", "value": first_name});

        // console.log('fields', fields);
        
        

        const variables = {
            "handle": {
                "type": "mm_profil_enfant",
                "handle": childHandle
            },
            "metaobject": {
                "capabilities" : {
                    "publishable": {
                        "status": 'ACTIVE'
                    }
                },
                "fields": fields
            }
        }

        console.log("var", JSON.stringify(variables));
        

        // return;

        try {
            const customerMetafieldQuery = `
                mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                        metaobject {
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

            const { data, errors, extensions } = await shopifyClient.request(customerMetafieldQuery, { variables });
            console.log('errors', errors);

            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
            }

            // console.log('data', data);
            // console.log('userErrors', data.userErrors);
            
            
            // var metaObjectData = data;
        } catch (error) {
            res.status(401).json({ message: error.message });
        }

        if (typeof req.body.fields.mesures !== 'undefined') {
            const { pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur } = req.body.fields.mesures;

            if (typeof pied_gauche_longueur === 'undefined' && typeof pied_gauche_largeur === 'undefined' && typeof pied_droit_longueur === 'undefined' && typeof pied_droit_largeur === 'undefined') {
                const mesureError = 'You must provide at least one on this parameters in the measure object: pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur'
                res.status(401).json({ message: mesureError });
            }

            let date = new Date();
            const offset = date.getTimezoneOffset();
            date = new Date(date.getTime() - (offset*60*1000));
            const now = date.toISOString().split('T')[0];

            const sdf = [
                // ...((typeof pied_gauche_longueur !== 'undefined') && {b: 5}),
                {
                    "key": "date_de_la_mesure",
                    "value": `${now}`
                }
            ];

            let variables = {
                "handle": {
                    "type": "mm_mesures",
                    "handle": `${now}-${first_name}-${customerId}`
                },
                "metaobject": {
                    "capabilities" : {
                        "publishable": {
                            "status": 'ACTIVE'
                        }
                    },
                    "fields": sdf
                }
            };

            // const fields = 
            //     {
            //         "key": "date_de_la_mesure",
            //         "value": `${now}`
            //     };

            // variables.metaobject.fields.push({"test": "sfqsdf"}, {"test2": "sfqsdf"});

            // console.log('fields', variables.metaobject.fields);
            

            // const test = {
            //     "test": "dfgsdfg",
            //     "test2": "tuiui"
            // };

            // fields.push({
            //     "test": "dfgsdfg",
            //     "test2": "tuiui"
            // });

            console.log(variables);


            // const newObj = fields.map((item, i)=>({...item}));
            

            // if (typeof pied_gauche_longueur !== 'undefined') {
            //     fields.push({
            //         "key": "pied_gauche_longueur",
            //         "value": `${pied_gauche_longueur}`
            //     })
            // }

            // if (typeof pied_gauche_largeur !== 'undefined') {
            //     fields.push(JSON.stringify({
            //         "key": "pied_gauche_largeur",
            //         "value": `${pied_gauche_largeur}`
            //     }))
            // }

            // if (typeof pied_droit_longueur !== 'undefined') {
            //     fields.push(JSON.stringify({
            //         "key": "pied_droit_longueur",
            //         "value": `${pied_droit_longueur}`
            //     }))
            // }

            // if (typeof pied_droit_largeur !== 'undefined') {
            //     fields.push(JSON.stringify({
            //         "key": "pied_droit_largeur",
            //         "value": `${pied_droit_largeur}`
            //     }))
            // }

            


            // console.log("variables", variables);
            // return;
            try {
                const customerMetafieldQuery = `
                    mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
                        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
                            metaobject {
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

                // "handle": `${first_name}-${customerId}`
                const { data, errors, extensions } = await shopifyClient.request(customerMetafieldQuery, {variables});

            
                if (typeof errors !== 'undefined') {
                    handleErrors(errors, res);
                }

                console.log('data', data);
                
                
                var metaObjectData = data;
            } catch (error) {
                res.status(401).json({ message: error.message });
            }
        }
    } 
    // else if (updateType === "upsert mesure") {
        
        
        
    // }

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
}

export default router;