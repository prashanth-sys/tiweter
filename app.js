const express = require("express");
const app = express();
app.use(express.json());
/*const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");*/
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "twitterClone.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:/localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
  }
};

initializeDBAndServer();

//api 1 post

app.post("/register/", async (request, response) => {
  let { username, password, name, gender } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let checkUser = `SELECT * FROM user WHERE username = '${username}';`;
  let userData = await db.get(checkUser);
  if (userData === undefined) {
    let postNewUserQuery = `
      INSERT INTO
      user(username, password, name, gender)
      VALUES
      (
          '${username}',
          '${hashedPassword}',
          '${name}',
          '${gender}'
      );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api 2 post

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatch === true) {
      const payLode = {
        username: username,
      };
      const jwtToken = jwt.sign(payLode, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//authentication
let authenticationToken = (request, response, next) => {
  let jwtToken;
  let autHeader = request.headers["authorization"];
  if (autHeader !== undefined) {
    jwtToken = autHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.send(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
//api 3 get
app.get("/user/tweets/feed/", async (request, response) => {
  const userQuery = `
    SELECT 
    username,
    tweet,
    date_time AS dateTime
    FROM 
    user,tweet,follower
    WHERE 
    following_user_id = ${tweet_id}
    ORDER BY username asc
    LIMIT 4
    OFFSET 1`;
  const userArray = await db.all(userQuery);
  response.send(userArray);
});
module.exports = app;
