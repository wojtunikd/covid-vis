const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.set("views", "views");

app.engine("html", require("ejs").renderFile);

app.use("/visualisations", (req, res) => res.render("visualisations.html"));

app.use("/contact", (req, res) => res.render("contact.html"));

app.use("/", (req, res) => res.render("index.html"));

const PORT = process.env.PORT || 3333;
app.listen(PORT);