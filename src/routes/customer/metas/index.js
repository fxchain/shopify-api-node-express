import express, { json } from 'express';
import shopifyClient from '../../../services/shopifyService.js';
import auth from '../../../middleware/auth.js';
import metas from './metas.json' with { type: "json" };
const router = express.Router();

//TODO: readd auth
router.post("/", async (req, res) => {
    // const customerId = req.customerId;
    const customerId = 8643416850746;

    // const metafieldNamespace = 'custom';
    // const metafieldKey = 'mm_kids';

    const updateType = req.body.updateType;

    if (!updateType) {
        res.status(400).json({ error: 'Bad request', message: 'Required "updateType" parameter not provided.' });
        return;
    }
    let variables;

    if (updateType === 'child') {
        const {handle, first_name, birthday, chaussures_associees} = req.body.fields;
        
        if (typeof first_name === 'undefined') {
            res.status(400).json({ error: 'Bad request', message: 'Required "fields.first_name" parameter not provided.' });
        }
        const childHandle = (typeof handle === 'undefined') ? '' : handle;

        let fieldsProfilEnfant = [
            {"key": metas.enfant.fields.name, "value": first_name},
        ]

        if (typeof birthday !== 'undefined') {
           fieldsProfilEnfant.push({"key": metas.enfant.fields.birthday, "value": birthday}); 
        }

        if (typeof chaussures_associees !== 'undefined') {
           fieldsProfilEnfant.push({"key": metas.enfant.fields.chaussures, "value": chaussures_associees}); 
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
            const { data, errors, extensions } = await shopifyClient.request(customerMetafieldQuery, { variables: variables });

            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
            }

            // console.log('data', data);
            // console.log('userErrors', data.userErrors);
            
            // TODO: fix this
            // const customerData = await assignChildToCustomeer(customerId, data.metaobjectUpsert.metaobject.id, res);
            res.json(data);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }

    } else if (updateType === 'mesures') {
        const { handle, pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur } = req.body.fields;

        if (typeof pied_gauche_longueur === 'undefined' && typeof pied_gauche_largeur === 'undefined' && typeof pied_droit_longueur === 'undefined' && typeof pied_droit_largeur === 'undefined') {
            const mesureError = 'You must provide at least one on these parameters in the fields object: pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur'
            res.status(401).json({ message: mesureError });
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
                "key": metas.mesures.fields.g_longueur,
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
                "key": metas.mesures.fields.d_longueur,
                "value": `${pied_droit_longueur}`
            })
        }

        if (typeof pied_droit_largeur !== 'undefined') {
            fieldsMesure.push({
                "key": metas.mesures.fields.d_largeur,
                "value": `${pied_droit_largeur}`
            })
        }

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


        console.log("variables", variables);
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
            const { data, errors, extensions } = await shopifyClient.request(customerMetafieldQuery, { variables: variables });
        
            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
            }

            console.log('data', data);
            
            
            var metaObjectData = data;
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    
    } else if (updateType === 'persona') {
        const {child_id, persona_id} = req.body.fields;
        
        if (typeof child_id === 'undefined' || typeof persona_id === 'undefined') {
            res.status(400).json({ error: 'Bad request', message: 'Required "child_id" or "persona_id" parameters not provided.' });
        }

        // const personaHandle = (typeof handle === 'undefined') ? '' : handle;

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

            const metafields = [
                {
                    key: metas.customer.enfants.key,
                    namespace: metas.customer.enfants.namespace,
                    ownerId: `gid://shopify/Customer/${customerId}`,
                    type: "metaobject_reference",
                    value: [metaObjectId]
                }
            ];

            console.log('mf', metafields);
            

            const { data, errors } = await shopifyClient.request(setMetaOjectToMetafield, {
                variables: {
                    metafields: {
                        key: metas.customer.enfants.key,
                        namespace: metas.customer.enfants.namespace,
                        ownerId: `gid://shopify/Customer/${customerId}`,
                        type: "metaobject_reference",
                        value: [metaObjectId]
                    }
                }
            });

            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
            }
    console.log('data', data);
    console.log('errors', errors);

            var setMfdata = data;
            
        } catch (error) {
            res.status(401).json({ message: error.message });
        }

        return setMfdata;
        
    } else {
        res.status(400).json({ error: 'Bad request', message: 'Required "updateType" is not either "child", "mesures", "persona".' });
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

const assignChildToCustomeer = async (customerId, metaObjectId, res) => {
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

        const metafields = [
            {
                key: metas.customer.enfants.key,
                namespace: metas.customer.enfants.namespace,
                ownerId: `gid://shopify/Customer/${customerId}`,
                type: "metaobject_reference",
                value: [metaObjectId]
            }
        ];

        console.log('mf', metafields);
        

        const { data, errors } = await shopifyClient.request(setMetaOjectToMetafield, {
            variables: {
                metafields: {
                    key: metas.customer.enfants.key,
                    namespace: metas.customer.enfants.namespace,
                    ownerId: `gid://shopify/Customer/${customerId}`,
                    type: "metaobject_reference",
                    value: [metaObjectId]
                }
            }
        });

        if (typeof errors !== 'undefined') {
            handleErrors(errors, res);
        }
console.log('data', data);
console.log('errors', errors);

        var setMfdata = data;
        
    } catch (error) {
        res.status(401).json({ message: error.message });
    }

    return setMfdata;
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
}

export default router;