const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const userMoneyFile = path.join(__dirname, "userMoney.json");

if (!fs.existsSync(userMoneyFile)) {
  fs.writeFileSync(userMoneyFile, JSON.stringify({}));
}

app.post("/register", (req, res) => {
  const { userID } = req.body;
  const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));

  if (usersMoney[userID] !== undefined) {
    return res.status(400).json({ error: "User already registered." });
  }

  usersMoney[userID] = 1000;
  fs.writeFileSync(userMoneyFile, JSON.stringify(usersMoney));
  res.json({ userID, balance: usersMoney[userID] });
});

const updateUserBalance = (req, res, operation) => {
  const { userID, amount } = req.query;
  const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));

  if (usersMoney[userID] === undefined) {
    return res.status(400).json({ error: "User not found." });
  }

  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }

  if (operation === "add") {
    usersMoney[userID] += parsedAmount;
  } else {
    if (usersMoney[userID] < parsedAmount) {
      return res.status(400).json({ error: "Insufficient funds." });
    }
    usersMoney[userID] -= parsedAmount;
  }

  fs.writeFileSync(userMoneyFile, JSON.stringify(usersMoney));
  res.json({ userID, totalMoney: usersMoney[userID] });
};

app.get("/save-money", (req, res) => updateUserBalance(req, res, "add"));
app.get("/deduct-money", (req, res) => updateUserBalance(req, res, "deduct"));

app.get("/check-user", (req, res) => {
  const { userID } = req.query;
  const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));
  const exists = usersMoney[userID] !== undefined;
  const balance = exists ? usersMoney[userID] : 0;

  res.json({ exists, balance });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});