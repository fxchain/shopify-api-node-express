import express, { json } from 'express';
import shopifyClient from './services/shopifyService.js';
import auth from './middleware/auth.js';
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
 *                   enum: ["upsertChild", "upsertmeasures", "deleteChild", deletemeasure]
 *                 fields:
 *                   type: object
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

    if (updateType === 'upsertChild') {
        const {handle, first_name, birthday, persona, chaussures_associees} = req.body.fields;
        
        if (typeof first_name === 'undefined' && typeof handle === 'undefined') {
            res.status(400).json({ error: 'Bad request', message: 'You must provide at least of of "fields.first_name" or "fields.handle" parameters.' });
            return;
        }
        const childHandle = (typeof handle === 'undefined') ? '' : handle;

        const fieldsProfilEnfant = [
            {"key": metas.enfant.fields.name, "value": first_name},
        ]

        if (typeof birthday !== 'undefined') {
            fieldsProfilEnfant.push({"key": metas.enfant.fields.birthday, "value": birthday}); 
        }

        if (typeof chaussures_associees !== 'undefined') {
            // const chaussures = chaussures_associees.split(',')
            // const chaussures = chaussures_associees.map((chaussure) => {
            //     return 
            // });
            fieldsProfilEnfant.push({"key": metas.enfant.fields.chaussures, "value": JSON.stringify(chaussures_associees)}); 
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
            return;
        }

        
    } else if (updateType === 'upsertmeasures') {
        const { handle, childId, pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur } = req.body.fields;

        if (typeof pied_gauche_longueur === 'undefined' && typeof pied_gauche_largeur === 'undefined' && typeof pied_droit_longueur === 'undefined' && typeof pied_droit_largeur === 'undefined') {
            const measureError = 'You must provide at least one on these parameters in the fields object: pied_gauche_longueur, pied_gauche_largeur, pied_droit_longueur, pied_droit_largeur'
            res.status(400).json({ message: measureError });
            return;
        }

        if (typeof childId === 'undefined') {
            const childIdError = 'You must provide the "fields.childId" parameter.'
            res.status(400).json({ message: childIdError });
            return;
        }

        let date = new Date();
        const offset = date.getTimezoneOffset();
        date = new Date(date.getTime() - (offset*60*1000));
        const now = date.toISOString().split('T')[0];

        const measureHandle = (typeof handle === 'undefined') ? '' : handle;

        const fieldsmeasure = [
            {
                "key": metas.measures.fields.date,
                "value": `${now}`
            }
        ];

        if (typeof pied_gauche_longueur !== 'undefined') {
            fieldsmeasure.push({
                "key": metas.measures.fields.g_longeur,
                "value": `${pied_gauche_longueur}`
            })
        }

        if (typeof pied_gauche_largeur !== 'undefined') {
            fieldsmeasure.push({
                "key": metas.measures.fields.g_largeur,
                "value": `${pied_gauche_largeur}`
            })
        }

        if (typeof pied_droit_longueur !== 'undefined') {
            fieldsmeasure.push({
                "key": metas.measures.fields.d_longeur,
                "value": `${pied_droit_longueur}`
            })
        }

        if (typeof pied_droit_largeur !== 'undefined') {
            fieldsmeasure.push({
                "key": metas.measures.fields.d_largeur,
                "value": `${pied_droit_largeur}`
            })
        }

        variables = {
            "handle": {
                "type": metas.measures.name,
                "handle": measureHandle
            },
            "metaobject": {
                "capabilities" : {
                    "publishable": {
                        "status": 'ACTIVE'
                    }
                },
                "fields": fieldsmeasure
            }
        };        

        try {
            const measuresMetafieldQuery = `
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
            const { data, errors, extensions } = await shopifyClient.request(measuresMetafieldQuery, { variables: variables });
        
            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
                return;
            }

            if (typeof handle === 'undefined') {
                await assignmeasureToChild(childId, data.metaobjectUpsert.metaobject.id, res);
            }

            res.json({
                data
            })
        } catch (error) {
            res.status(500).json({ message: error.message + '0'});
            return;
        }
    } else if (updateType === 'deleteChild') {
        const { childId } = req.body;

        if (typeof childId === 'undefined') {
            const childIdError = 'You must provide the child\'s "childId" parameter.'
            res.status(400).json({ message: deleteHandleError });
            return;
        }

        try {
            const getChildMetaobjectQuery = `{
                metaobject(id: "gid://shopify/Metaobject/${childId}") {
                    handle
                    field (key: "${metas.enfant.fields.measures}") {
                        value
                    }
                }
            }`;

            const { data, errors} = await shopifyClient.request(getChildMetaobjectQuery);

            var dataChild = data;

        
        } catch (error) {
            res.status(500).json({ message: error.message });
        }

        if (dataChild.metaobject.field.value !== null) {
            const measuresString = dataChild.metaobject.field.value.replace('[', '').replace(']', '').replaceAll('"', '');
            const measureIds = measuresString.split(',');

            variables = {
                "where": {
                    "ids": measureIds
                }
            }
            const deleteMetaobjectsQuery = `
                mutation DeleteMetaobjects($where: MetaobjectBulkDeleteWhereCondition!) {
                    metaobjectBulkDelete(where: $where) {
                        job {
                            id
                            done
                        }
                    }
                }
            `;
            const { data, errors} = await shopifyClient.request(deleteMetaobjectsQuery, { variables: variables });
        }

        try {
            variables = {
                "id": `gid://shopify/Metaobject/${childId}`
            };

            const deleteMetaobjectQuery = `
                mutation DeleteMetaobject($id: ID!) {
                    metaobjectDelete(id: $id) {
                        deletedId
                        userErrors {
                            field
                            message
                            code
                        }
                    }
                }
            `;
            // 
            const { data, errors } = await shopifyClient.request(deleteMetaobjectQuery, { variables: variables });
        
            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
                return;
            }

            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
            return;
        }
    } else if (updateType === 'deletemeasure') {
        const { measureId } = req.body;
        
        try {
            variables = {
                "id": `gid://shopify/Metaobject/${measureId}`
            };

            const deleteMetaobjectQuery = `
                mutation DeleteMetaobject($id: ID!) {
                    metaobjectDelete(id: $id) {
                        deletedId
                        userErrors {
                            field
                            message
                            code
                        }
                    }
                }
            `;
            const { data, errors } = await shopifyClient.request(deleteMetaobjectQuery, { variables: variables });
        
            if (typeof errors !== 'undefined') {
                handleErrors(errors, res);
                return;
            }

            res.json(data);
        } catch (error) {
            res.status(500).json({ message: error.message });
            return;
        }
    } else {
        res.status(400).json({ message: `updateType '${updateType}' does not exist` });
        return;
    }
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

const assignmeasureToChild = async (childId, measureId, res) => {
    try {
        // Get current child handle and measures IDs
        const getChildMetaobjectQuery = `{
            metaobject(id: "gid://shopify/Metaobject/${childId}") {
                handle
                field (key: "${metas.enfant.fields.measures}") {
                    value
                }
            }
        }`;

        const { data, errors} = await shopifyClient.request(getChildMetaobjectQuery);

        var dataChild = data;
    console.log('getChildMetaobjectQuery', getChildMetaobjectQuery);
    console.log('dataChild', data);
    console.log('errorsChild', errors);

       
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
    
    let measuresIds = measureId;

    if (dataChild.metaobject.field.value !== null && !dataChild.metaobject.field.value.includes(measureId)) {
        const cleaned = dataChild.metaobject.field.value.replace(']', '');
        measuresIds = `${cleaned},"${measureId}"]`;
    } else {
        measuresIds = `["${measureId}"]`;
    }
    
    console.log("dataChild.metaobject.handle", dataChild.metaobject.handle);
    console.log("measuresIds", measuresIds);
    
    // return;
    


    try {
        const measureMetafieldQuery = `
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
                "handle": dataChild.metaobject.handle
            },
            "metaobject": {
                "fields": {
                    "key": metas.enfant.fields.measures,
                    "value": measuresIds
                }
            }
        }
        console.log('variables', variables);
        
        const { data, errors } = await shopifyClient.request(measureMetafieldQuery, { variables: variables });

        // if (typeof errors !== 'undefined') {
        //     handleErrors(errors, res);
        //     return;
        // }

        if (data.metaobjectUpsert.userErrors.length > 0) {
            console.log('data.metaobjectUpsert.userErrors', data.metaobjectUpsert.userErrors);
            
        }

        console.log('data', JSON.stringify(data));
        
        var measuresData;

        // return data;
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

    return measuresData;
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