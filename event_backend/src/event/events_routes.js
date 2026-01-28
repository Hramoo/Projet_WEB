const express = require("express");
const router = express.Router();

const { requireAuth } = require("../auth/authMiddleware");

const events = require("./events_controllers");
const reservations = require("./reservations_controller");

// LIST
router.get("/", requireAuth, events.getEvents);

// CREATE
router.post("/", requireAuth, events.createEvent);

// EDIT (update)
router.put("/:id", requireAuth, events.updateEvent);

// DELETE
router.delete("/:id", requireAuth, reservations.deleteEvent);

// RESERVE / UNRESERVE
router.post("/:id/reserve", requireAuth, reservations.reserveEvent);
router.post("/:id/unreserve", requireAuth, reservations.unreserveEvent);

module.exports = router;
