import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import packageFile from "../../package.json" with { type: "json" };

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PPDG Shopify middleware REST API docs",
      version: packageFile.version,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [{name: "Authorization"}, {name: "Childs metaobject"}, {name: "Measures metaobject"}],
  },
  apis: ["./src/routes/**/*.js"],
};

 const swaggerOptions = {
    swaggerOptions: {
        operationsSorter: (a, b) => {
            var methodsOrder = ["get", "post", "put", "patch", "delete", "options", "trace"];
            var result = methodsOrder.indexOf(a.get("method")) - methodsOrder.indexOf(b.get("method"));

            if (result === 0) {
                result = a.get("path").localeCompare(b.get("path"));
            }

            return result;
        }
    }
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = ((app, port) => {
  // Swagger page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

  // Docs in JSON format
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/docs or in JSON format at http://localhost:${port}/docs.json`);
});

export default swaggerDocs;