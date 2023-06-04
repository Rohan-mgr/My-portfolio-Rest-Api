const express = require("express");
const adminController = require("../controller/admin");
const router = express.Router();
const isAuth = require("../middleware/isAuth");

router.post("/signup", adminController.createAdmin);
router.post("/signin", adminController.adminLogin);
router.post("/reset", adminController.GetPasswordReset);
router.post("/new-password/:id/:token", adminController.handlePasswordReset);
router.post("/upload-projects", isAuth, adminController.handleProjectUpload);
router.post("/upload-message", adminController.handleMessageUpload);

router.get("/projects", adminController.fetchAllProjects);
router.get("/messages/:filterParam", isAuth, adminController.fetchAllMessages);

module.exports = router;
