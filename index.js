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
    const { userID, username } = req.body;
    const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));

    if (usersMoney[userID]) {
        return res.status(400).json({ error: "User already registered." });
    }

    usersMoney[userID] = { username, balance: 1000 };
    fs.writeFileSync(userMoneyFile, JSON.stringify(usersMoney));
    res.json({ userID, username, balance: usersMoney[userID].balance });
});

const updateUserBalance = (req, res, operation) => {
    const { userID, amount } = req.query;
    const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));

    if (!usersMoney[userID]) {
        return res.status(400).json({ error: "User not found." });
    }

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
        return res.status(400).json({ error: "Invalid amount." });
    }

    if (operation === "add") {
        usersMoney[userID].balance += parsedAmount;
    } else if (usersMoney[userID].balance >= parsedAmount) {
        usersMoney[userID].balance -= parsedAmount;
    } else {
        return res.status(400).json({ error: "Insufficient funds." });
    }

    fs.writeFileSync(userMoneyFile, JSON.stringify(usersMoney));
    res.json({ userID, balance: usersMoney[userID].balance });
};

app.get("/save-money", (req, res) => updateUserBalance(req, res, "add"));
app.get("/deduct-money", (req, res) => updateUserBalance(req, res, "deduct"));

app.get("/check-user", (req, res) => {
    const { userID } = req.query;
    const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));
    const exists = Boolean(usersMoney[userID]);
    const balance = exists ? usersMoney[userID].balance : 0;

    res.json({ exists, balance });
});

app.get("/leaderboard", (req, res) => {
    const usersMoney = JSON.parse(fs.readFileSync(userMoneyFile, "utf8"));
    const leaderboard = Object.values(usersMoney)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 5)
        .map((user, index) => ({
            rank: index + 1,
            username: user.username,
            balance: user.balance,
        }));

    res.json(leaderboard);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
