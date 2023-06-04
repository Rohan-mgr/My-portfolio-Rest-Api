const mongoose = require("mongoose");
const path = require("path");
const Admin = require("../Model/admin");
const Project = require("../Model/project");
const Message = require("../Model/message");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailer");

exports.adminLogin = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      const error = new Error("User does not Exists!");
      error.statusCode = 401;
      throw error;
    }
    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      const error = new Error("Incorrect Password! Try Again!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: email,
        adminId: admin._id.toString(),
      },
      process.env.JWT_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.status(200).send({
      message: "Login Successfull",
      status: 200,
      token: token,
      adminId: admin._id.toString(),
    });
  } catch (error) {
    console.log(error.message);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.GetPasswordReset = async (req, res, next) => {
  const email = req.body.email;
  try {
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
      const error = new Error("Email Address does not exists!");
      error.statusCode = 401;
      throw error;
    }
    const resetToken = jwt.sign(
      {
        email: admin.email,
        Id: admin._id.toString(),
      },
      process.env.JWT_TOKEN_SECRET,
      { expiresIn: "120s" }
    );
    admin.passwordResetToken = resetToken;
    const result = await admin.save();
    sendEmail({
      admin,
      resetToken,
    });
    res
      .status(200)
      .json({ message: "Password Reset mail send successfully", status: 200 });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.handlePasswordReset = async (req, res, next) => {
  const token = req.params.token;
  const adminId = req.params.id;
  const newPassword = req.body.newPassword;

  try {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      const error = new Error("Invalid User Id");
      error.statusCode = 401;
      throw error;
    }
    const existingAdmin = await Admin.findOne({
      _id: adminId,
      passwordResetToken: token,
    });
    const verifyToken = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

    if (!existingAdmin || !verifyToken.Id) {
      const error = new Error("Token is not valid!");
      error.statusCode = 404;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    existingAdmin.password = hashedPassword;

    const result = existingAdmin.save();

    res
      .status(200)
      .json({ message: "Password Updated Successfully", status: 200 });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      console.log("mongoose error");
      error.message = "mongoose error";
      // throw new Error("Invalid UserId!");
    }
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (error.name === "TokenExpiredError") {
      error.message = "Token is expired! Try Again";
    }
    if (error.name === "JsonWebTokenError") {
      error.message = "Token is not valid!";
    }
    next(error);
  }
};

exports.createAdmin = async (req, res, next) => {
  //   const errors = validationResult(req);
  const fullName = req.body.fullName;
  const email = req.body.email;
  const pass = req.body.password;
  let dupUser;
  //   if (!errors.isEmpty()) {
  //     const error = new Error("Validation failed!");
  //     error.statusCode = 422;
  //     throw error;
  //   }
  try {
    dupUser = await Admin.findOne({ email: email });
    if (dupUser) {
      const error = new Error("Email Address already exists!");
      error.statusCode = 409;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(pass, 12);
    const admin = new Admin({
      fullName: fullName,
      email: email,
      password: hashedPassword,
    });
    const result = await admin.save();
    console.log(result, "result");
    res
      .status(200)
      .json({ message: "Admin created successfully", userId: result._id });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.fetchAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find();
    if (!projects) {
      const error = new Error("No projects found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Projects fetched Successfully",
      data: projects,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.handleProjectUpload = async (req, res, next) => {
  const title = req.body.title;
  const desc = req.body.description;
  const githubLink = req.body.githubLink;
  const deployedLink = req.body.deployedLink;
  const is_feature_project = req.body.feature_project == "true";
  const techList = JSON.parse(req.body.techList);

  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      const error = new Error("No Admin exists yet!");
      error.statusCode = 404;
      throw error;
    }

    if (is_feature_project && !req.file) {
      const err = new Error("Image not provided");
      err.statusCode = 404;
      throw err;
    }

    const project = new Project({
      title: title,
      description: desc,
      githubLink: githubLink,
      deployedLink: deployedLink,
      feature_project: is_feature_project,
      techList: techList,
      imageUrl: is_feature_project ? req.file.path : "null",
    });

    const newUploadedProject = await project.save();
    res.status(200).json({
      message: "Project uploaded successfully",
      status: 200,
      newProject: newUploadedProject,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.handleMessageUpload = async (req, res, next) => {
  const name = req.body.from_name;
  const phone = +req.body.phone;
  const email = req.body.user_email;
  const message = req.body.message;
  try {
    const newMessage = new Message({
      senderName: name,
      senderPhone: phone,
      senderEmail: email,
      senderMessage: message,
    });

    const uploadedMessage = await newMessage.save();
    res.status(200).json({
      message: "Message Sent Successfully",
      status: 200,
      newMessage: uploadedMessage,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.fetchAllMessages = async (req, res, next) => {
  const filterParam = req.params.filterParam;

  let filter;
  if (filterParam === "last10days") {
    const last10days = new Date();
    last10days.setDate(last10days.getDate() - 10); // Subtract 10 days from the current date

    filter = {
      createdAt: {
        $gte: new Date(last10days.setHours(0, 0, 0, 0)), // Start of 30 days ago
        $lt: new Date(),
      },
    };
  } else if (filterParam === "today") {
    const today = new Date();
    filter = {
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)), // Start of today
        $lt: new Date(today.setHours(23, 59, 59, 999)), // End of today
      },
    };
  } else {
    filter = null;
  }

  try {
    const messages = await Message.find(filter);
    if (!messages) {
      const error = new Error("No Messages found!");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: "Messages fetched Successfully",
      data: messages,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};
