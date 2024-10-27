const express = require("express");
require("dotenv").config();
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;
const url = process.env.API_URL;
const token = process.env.API_TOKEN;

const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";

app.use(cors());

app.get("/", async (req, res) => {
  res.send(
    `<a href="/api">/api</a> to access the API or <a href="/docs">docs</a>`
  );
});

/**
 * @openapi
 * /api:
 *   get:
 *     tags:
 *       - Trip API
 *     summary: Get Trip Data
 *     description: |
 *       Retrieve trip data filtered by a single query parameter:
 *       fare amount, distance, or payment type. Only one parameter
 *       should be provided at a time.
 *     parameters:
 *       - name: fare_amount
 *         in: query
 *         description: Filter by fare amount.
 *         required: false
 *         schema:
 *           type: string
 *       - name: distance
 *         in: query
 *         description: Filter by trip distance.
 *         required: false
 *         schema:
 *           type: string
 *       - name: payment_type
 *         in: query
 *         description: Filter by payment type.
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Fetched Successfully
 *       '400':
 *         description: Bad Request
 *       '500':
 *         description: Server Error
 */
app.get("/api", async (req, res) => {
  // Create query for SOQL
  let query = "";

  // validate the parameter should only one
  if (Object.keys(req.query).length > 1) {
    res
      .status(400)
      .json({ error: "Only one parameter should be provided at a time." });
    return;
  }

  // Assign query req.query for fetching
  if (req.query["fare_amount"]) {
    query = `$where=fare_amount = ${req.query["fare_amount"]}`;
  } else if (req.query["distance"]) {
    query = `$where=trip_distance = ${req.query["distance"]}`;
  } else if (req.query["payment_type"]) {
    query = `$where=payment_type = ${req.query["payment_type"]}`;
  }

  // Check if query for SOQL exists, if it is concatenate URL and query if not just put URL
  const fetchUrl = query ? `${url}?${query}` : url;

  // Fetching the data
  try {
    const response = await fetch(fetchUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-App-Token": token,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const result = await response.json();

    // Create trip_time record cuz the result didn't have trip_time record
    const processedData = result
      .map((col) => {
        // Get tripTime by subtracting dropoff and pickup time
        const tripTime =
          new Date(col.dropoff_datetime) - new Date(col.pickup_datetime);
        return {
          ...col,
          trip_time: tripTime,
        };
      })
      .sort((a, b) => a.trip_time - b.trip_time);

    res.status(200).json(processedData);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

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
  apis: ["index.js"],
};

const swaggerSpec = swaggerJsdoc(options);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customCssUrl: CSS_URL })
);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
