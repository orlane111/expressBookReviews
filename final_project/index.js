const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

app.use("/customer/auth/*", function auth(req, res, next) {
    // Vérifier si l'utilisateur a une session active
    if (!req.session.authorized) {
        return res.status(401).json({
            message: "Session non autorisée. Veuillez vous connecter."
        });
    }

    // Vérifier si le token est présent dans la session
    if (!req.session.token) {
        return res.status(401).json({
            message: "Token manquant. Veuillez vous reconnecter."
        });
    }

    try {
        // Vérifier la validité du token
        const decoded = jwt.verify(req.session.token, "fingerprint_customer");
        req.user = decoded;
        next();
    } catch (err) {
        // Si le token est invalide, supprimer la session
        req.session.destroy();
        return res.status(401).json({
            message: "Session expirée ou invalide. Veuillez vous reconnecter."
        });
    }
});

const PORT = 5000;
app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
