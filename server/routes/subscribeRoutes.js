const express = require("express");
const router = express.Router();

const { subscribe, unsubscribe, fetchAllSubscribers } = require("../controllers//subscriberController");



router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);
router.get("/allSubscribers", fetchAllSubscribers);

module.exports = router;