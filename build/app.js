const { createApp } = Vue

createApp({
    data() {
        return {
            token: '',
            message: 'Hello Vue!'
        }
    },
    methods: {
        async getToken() {
            const response = await fetch("http://localhost:3000/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ customerId: "8643416850746", cookie: true }),
            })            
            // .then(function(response) {
            //     // The response is a Response instance.
            //     // You parse the data into a useable format using `.json()`                
            //     return response.json();
            // }).then(function(data) {
            //     // `data` is the parsed version of the JSON returned from the above endpoint.
            //     console.log(data);  // { "userId": 1, "id": 1, "title": "...", "body": "..." }
            // });
            .then((response) => response.json())
            .then((body) => {                
                this.token = body.token
            });
        },
        async sendData() {
            const body = {
                // "handle": "mm-mesures-g8pe3aym",
                "childId": 202340204858,
                "pied_gauche_longueur": 45,
                "pied_gauche_largeur": 5,
                "pied_droit_longueur": 21,
                "pied_droit_largeur": 6
            };
            
            const headers = {
                "Authorization": this.token,
                "Content-Type": "application/json",
            }

            const response = await fetch("http://localhost:3000/api/customer/measure/upsert", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body),
            })
            .then((response) => response.json())
            .then((body) => {
                console.log('response', body);                
            });
        }
    },
    mounted() {
        this.getToken()
    }
}).mount('#app')