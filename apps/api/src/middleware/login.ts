const express = require("express");
cosnt jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.post("/signup", (req, res) => {
    const email = req.body.email();
    const password = req.body.password();

    

    const user = prisma.user.findFirst({
        email,
        password,
    })

    if(user) {
        res.json({
            msg: user already exist
        })
    }

    const user = prisma.user.create({
        email,
        password,
    })
})

app.post("/signin", (req, res) => {
    const email = req.body.email();
    const password = req.body.password();

    

    const user = prisma.user.findFirst({
        email,
    })

    if(user.password == password) {
        const token = jwt.sign({id: user.id}, "secret", {expiresIn: "1d"});
        res.json({
            msg: "sign in successfully"
        })
    }

    res.json({
        msg: "Unauthorized user,"
    })
})


module.exports = app;
    