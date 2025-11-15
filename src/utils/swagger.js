// import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import packageFile from "../../package.json" with { type: "json" };

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PPDG middleware REST API docs",
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
    tags: [{name: "Authorization"}, {name: "Childs metaobject"}]
  },
  apis: ["./src/serer.js"],
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  // Swagger page
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`Docs available at http://localhost:${port}/docs`);
  console.log(`Docs in a JSON format available at http://localhost:${port}/docs.json`);
}

export default swaggerDocs;