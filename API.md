# 📡 Xplorism API Reference

This document provides a comprehensive list of API endpoints available in the Xplorism backend service.

---

## Authentication & Profile

| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| **POST** | `/auth/register` | No | `{ "name", "email", "password" }` | Registers a new user account, returns JWT. |
| **POST** | `/auth/login` | No | `{ "email", "password" }` | Authenticates user credentials, returns JWT. |
| **POST** | `/auth/google` | No | `{ "token" }` | Authenticates Google Sign-In credentials. |
| **POST** | `/auth/verify-otp` | No | `{ "email", "otp" }` | Verifies a 2FA or registration OTP token. |
| **POST** | `/auth/forgot-password` | No | `{ "email" }` | Sends password recovery instructions and OTP. |
| **POST** | `/auth/reset-password` | No | `{ "email", "otp", "newPassword" }` | Resets password after OTP confirmation. |
| **GET** | `/auth/profile` | **Yes (JWT)** | *None* | Fetches profile photo, history, and preferences. |
| **PUT** | `/auth/profile` | **Yes (JWT)** | `{ "name", "profile_photo", "preferences" }` | Updates profile details and preference parameters. |

---

## Trip & Itinerary

| Method | Endpoint | Auth Required | Request Body / Query Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/trips` | **Yes (JWT)** | *None* | Retrieves all saved trips and itineraries. |
| **POST** | `/trips` | **Yes (JWT)** | `{ destination, startDate, endDate, budget, travelers, travelStyle, interests, itinerary }` | Saves a new trip to the database. |
| **PUT** | `/trips/:id` | **Yes (JWT)** | `{ destination, startDate, endDate, budget, travelers, travelStyle, interests, itinerary, packingList }` | Updates details or pack lists of a trip. |
| **DELETE**| `/trips/:id` | **Yes (JWT)** | *None* | Deletes trip and cascades to itineraries. |
| **POST** | `/trips/generate`| No | `{ destination, startDate, endDate, budget, travelers, travelStyle, interests }` | Requests Gemini/Ollama to generate custom itinerary JSON. |
| **GET** | `/trips/share/:id`| No | *None* | Public shared link reader for read-only view. |
| **GET** | `/trips/:id/packing` | **Yes (JWT)** | *None* | Fetches the trip's packing checklist items. |
| **PUT** | `/trips/:id/packing` | **Yes (JWT)** | `{ "packingList" }` | Updates/toggles checklist items. |
| **GET** | `/trips/:id/events` | **Yes (JWT)** | *None* | Fetches real local events for the trip area. |

---

## Collaborative Workspace & Chat

| Method | Endpoint | Auth Required | Request Body / Query Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/trips/shared-workspace` | **Yes (JWT)** | *None* | Lists all collaborative workspaces user is part of. |
| **GET** | `/trips/:id/collaborators` | **Yes (JWT)** | *None* | Retrieves collaborator list and status for a trip. |
| **POST** | `/trips/:id/collaborators` | **Yes (JWT)** | `{ "email" }` | Invites a co-traveler to collaborate on a trip. |
| **DELETE**| `/trips/:id/collaborators/:userId` | **Yes (JWT)** | *None* | Removes a co-traveler from the trip workspace. |
| **POST** | `/trips/:id/join` | **Yes (JWT)** | *None* | Joins workspace via active invite token. |
| **POST** | `/trips/:id/collaborators/respond`| **Yes (JWT)** | `{ "status" }` | Approves or declines a workspace invitation. |
| **GET** | `/trips/:id/messages` | **Yes (JWT)** | *None* | Fetches historical trip workspace chat messages. |
| **POST** | `/trips/:id/messages` | **Yes (JWT)** | `{ "message" }` | Broadcasts group messages via Kafka brokers. |

---

## Trip Polls

| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/trips/:id/polls` | **Yes (JWT)** | *None* | Fetches all active voting polls in the workspace. |
| **POST** | `/trips/:id/polls` | **Yes (JWT)** | `{ "question", "options" }` | Creates a new voting poll for co-travelers. |
| **POST** | `/trips/:id/polls/:pollId/vote` | **Yes (JWT)** | `{ "optionIndex" }` | Casts or updates a vote on a specific poll. |
| **DELETE**| `/trips/:id/polls/:pollId` | **Yes (JWT)** | *None* | Deletes a poll from the workspace. |

---

## Document Vault

| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/documents` | **Yes (JWT)** | *None* | Fetches general/unlinked document metadata list. |
| **GET** | `/documents/trip/:tripId`| **Yes (JWT)** | *None* | Fetches metadata of documents associated with a trip. |
| **GET** | `/documents/:id/download` | **Yes (JWT)** | *None* | Decrypts document content dynamically in memory. |
| **POST** | `/documents` | **Yes (JWT)** | `{ title, type, file_name, file_content, trip_id }` | Encrypts (AES-256-GCM) and uploads a new document. |
| **PUT** | `/documents/:id` | **Yes (JWT)** | `{ title, type, file_name, file_content }` | Updates metadata or file content in the vault. |
| **DELETE**| `/documents/:id` | **Yes (JWT)** | *None* | Permanently removes document and its encrypted files. |

---

## Budget & Expenses

| Method | Endpoint | Auth Required | Request Body / Query Params | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/budget/:id/budget` | **Yes (JWT)** | *None* | Aggregates actual vs planned spending categories. |
| **POST** | `/budget/:id/budget/insights` | **Yes (JWT)** | *None* | Calls Gemini to analyze category expenses. |
| **POST** | `/budget/:id/budget/scan-receipt` | **Yes (JWT)** | `{ "fileContent" }` | OCR receipt processing via Gemini. |
| **POST** | `/budget/:id/expenses` | **Yes (JWT)** | `{ category, item_name, planned_amount, actual_amount, currency, paid_by, date, notes }` | Logs a new expense item inside the trip. |
| **PUT** | `/budget/:id/expenses/:expenseId` | **Yes (JWT)** | `{ category, item_name, planned_amount, actual_amount, currency, paid_by, date, notes }` | Updates a logged expense record. |
| **DELETE**| `/budget/:id/expenses/:expenseId` | **Yes (JWT)** | *None* | Deletes an expense item. |

---

## Hotels & Payments

| Method | Endpoint | Auth Required | Query Parameters | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/hotels/search` | No | `destination=CityName` | Fetches 20 real-world hotels dynamically with coordinates and pricing. |

---

## Community Feed

| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/posts` | **Yes (JWT)** | *None* | Retrieves list of global community travel posts. |
| **POST** | `/posts` | **Yes (JWT)** | `{ title, content, trip_destination, photo_content }` | Creates a global feed post with base64 image support. |
| **POST** | `/posts/:id/like` | **Yes (JWT)** | *None* | Likes or un-likes a post dynamically. |
| **PUT** | `/posts/:id` | **Yes (JWT)** | `{ title, content, trip_destination, photo_content }` | Edits an existing post. |
| **DELETE**| `/posts/:id` | **Yes (JWT)** | *None* | Deletes a community post. |

---

## Geocoding & Discovery

| Method | Endpoint | Auth Required | Query Parameters | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GET** | `/geocode` | No | `q=CityName` | Proxies searches to Nominatim with cache lookups and fallback keywords. |
| **GET** | `/overpass` | No | `data=QueryString` | Proxies searches to public Overpass mirrors with round-robin failover to avoid CORS. |
| **GET** | `/nearby` | No | `destination=CityName` | Prompts Gemini/Ollama to recommend 8 nearby sites within 100km. |
| **GET** | `/health` | No | *None* | Simple API heartbeat indicator. |
