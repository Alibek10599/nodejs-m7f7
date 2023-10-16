const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");
const corsOptions = require ("./utils/corsOptions");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT  || 3000 ;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/../client/public"));
app.use(cookieParser());

app.use(cors((corsOptions)));

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const orgRoutes = require("./routes/orgRoutes");
const subAccountRoutes = require("./routes/subAccountRoutes");
const walletRoutes = require("./routes/walletRoutes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/organization", orgRoutes);
app.use("api/v1/subaccount", subAccountRoutes);
app.use("/api/v1/wallet",walletRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
