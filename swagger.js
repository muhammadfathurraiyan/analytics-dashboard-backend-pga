import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Trip Api",
      description:
        "API endpoints for analytics Trip API documented on Swagger.",
      contact: {
        name: "Muhammad Fathur Raiyan",
        email: "raiyanfathur@gmail.com",
        url: "https://github.com/muhammadfathurraiyan/analytics-dashboard-backend-pga",
      },
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local server",
      },
      {
        url: "https://analytics-dashboard-backend-pga.vercel.app",
        description: "Live server",
      },
    ],
  },
  apis: ["index.js"], // Ensure this file path points to your API documentation
};

const swaggerSpec = swaggerJsdoc(options);

function swaggerDocs(app, port) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}

export default swaggerDocs;
