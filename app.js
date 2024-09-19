const express = require("express");
const app = express();

const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const userModel = require("./models/userModel");
const postModel = require("./models/postModel");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/new/register", async (req, res) => {
  const { name, age, email, password } = req.body;
  if (await userModel.findOne({ email: email }).exec()) {
    res.redirect("/login");
    return;
  }
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      const user = await userModel.create({
        name,
        age,
        email,
        password: hash,
      });
      const token = jwt.sign({ email: email }, "secret");
      res.cookie("token", token);
      await user.populate("posts")
      res.render("home", { user });
    });
  });
});

app.post("/new/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email: email }).exec();

  if (user) {
    bcrypt.compare(password, user.password, async function (err, result) {
      if (result) {
        const token = jwt.sign({ email: email }, "secret");
        res.cookie("token", token);
        await user.populate("posts")
        res.render("home", { user });
      } else {
        res.send("Password not matched");
        return;
      }
    });
  } else {
    res.send("User Not Found");
    return;
  }
});

app.get("/home", isLoggedIn,async (req, res) => {
  const user = req.user;
  await user.populate("posts")
  res.render("home", { user });
});

app.post("/logout", (req, res) => {
  if (req.cookies.token !== "") {
    res.cookie("token", "");
    res.redirect("/");
  } else {
    res.redirect("/");
  }
});

app.post("/newpost/:userid", isLoggedIn, async (req, res) => {
  const userid = req.params.userid;
  const content = req.body.content;
  const post = await postModel.create({
    content: content,
    user_id: userid,
  });
  const user = await userModel.findOne({ _id: userid }).exec();
  user.posts.push(post._id);
  await user.save();
  res.redirect("/home");
});

async function isLoggedIn(req, res, next) {
  if (req.cookies.token !== "") {
    const decoded = jwt.verify(req.cookies.token, "secret");
    const email = decoded.email;
    req.user = await userModel.findOne({ email: email }).exec();
    next();
  } else {
    res.redirect("/");
  }
}

app.listen(3000);
