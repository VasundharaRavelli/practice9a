const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "userData.db");
let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running...");
    });
  } catch (error) {
    console.log(`Db Error ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 12);
  const checkUserQuery = `SELECT * FROM user where username=${username}`;
  const checkUserResponse = await database.get(checkUserQuery);
  if (checkUserResponse === undefined) {
    const createUserQuery = `INSERT INTO user (username, name, password, gender, location)
       VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
    if (password.length > 5) {
      const createUserResponse = await database.run(createUserQuery);
      response.send("User created Successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exist");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user where username=${username}`;
  const userNameResponse = await database.get(checkUserQuery);

  if (userNameResponse !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userNameResponse.password
    );
    if (isPasswordMatched) {
      response.status(200);
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  } else {
    response.status(400);
    response.send("Invalid User");
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `SELECT * FROM user where username=${username}`;
  const userDetails = await database.get(checkUserQuery);

  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const updatePasswordQuery = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}'`;
        const updatePasswordResponse = await database.run(updatePasswordQuery);
        response.status(200);
        response.send("Password Updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid Current Password");
    }
  } else {
    response.status(400);
    response.send("Invalid User");
  }
});

module.exports = app;
