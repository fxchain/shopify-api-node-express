const { createApp } = Vue

createApp({
    data() {
        return {
            token: '',
            message: 'Hello Vue!'
        }
    },
    methods: {
        
        getToken() {
            this.token = fetch("https://shopify-node-app.netlify.app/api/token", {
                method: "POST",
                body: JSON.stringify({ customerId: "8643416850746" }),
            });
        }
    },
    mounted() {
        this.getToken()
    }
}).mount('#app')