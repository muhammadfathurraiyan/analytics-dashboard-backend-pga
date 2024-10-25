import express from "express";
import dotenv from "dotenv";
import swaggerDocs from "./swagger.js";

dotenv.config();

const app = express();
const port = 3000;
const url = process.env.API_URL;
const token = process.env.API_TOKEN;

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
 *       - name: $fare_amount
 *         in: query
 *         description: Filter by fare amount.
 *         required: false
 *         schema:
 *           type: number
 *       - name: $distance
 *         in: query
 *         description: Filter by trip distance.
 *         required: false
 *         schema:
 *           type: number
 *       - name: $payment_type
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

  // Assign query req.query for fetching
  if (req.query["$fare_amount"]) {
    query = `$where=fare_amount = ${req.query["$fare_amount"]}`;
  } else if (req.query["$distance"]) {
    query = `$where=trip_distance = ${req.query["$distance"]}`;
  } else if (req.query["$payment_type"]) {
    query = `$where=payment_type = ${req.query["$payment_type"]}`;
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

    // Create trip_time record since the result didn't have trip_time record
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

    res.send(processedData);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

swaggerDocs(app, port);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
