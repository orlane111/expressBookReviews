const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Vérifier si l'utilisateur existe
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
  // Vérifier si les identifiants correspondent
  return users.find(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    // Vérifier si les champs sont présents
    if (!username || !password) {
      return res.status(400).json({
        message: "Le nom d'utilisateur et le mot de passe sont requis"
      });
    }

    // Vérifier si l'utilisateur existe
    if (!isValid(username)) {
      return res.status(401).json({
        message: "Utilisateur non trouvé"
      });
    }

    // Authentifier l'utilisateur
    if (!authenticatedUser(username, password)) {
      return res.status(401).json({
        message: "Mot de passe incorrect"
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { username: username },
      "fingerprint_customer",
      { expiresIn: "1h" }
    );

    // Enregistrer dans la session
    req.session.authorized = true;
    req.session.token = token;
    req.session.user = username;

    return res.status(200).json({
      message: "Connexion réussie",
      token: token,
      username: username
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  try {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.session.user;

    // Vérifier si le livre existe
    if (!books[isbn]) {
      return res.status(404).json({
        message: `Aucun livre trouvé avec l'ISBN ${isbn}`
      });
    }

    // Vérifier si la critique est fournie
    if (!review) {
      return res.status(400).json({
        message: "La critique est requise"
      });
    }

    // Vérifier si l'utilisateur est connecté
    if (!username) {
      return res.status(401).json({
        message: "Vous devez être connecté pour ajouter une critique"
      });
    }

    // Initialiser l'objet reviews s'il n'existe pas
    if (!books[isbn].reviews) {
      books[isbn].reviews = {};
    }

    // Ajouter ou modifier la critique
    books[isbn].reviews[username] = {
      review: review,
      date: new Date().toISOString()
    };

    return res.status(200).json({
      message: "Critique ajoutée avec succès",
      book: books[isbn].title,
      review: {
        username: username,
        review: review,
        date: books[isbn].reviews[username].date
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'ajout de la critique",
      error: error.message
    });
  }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  try {
    const isbn = req.params.isbn;
    const username = req.session.user;

    // Vérifier si le livre existe
    if (!books[isbn]) {
      return res.status(404).json({
        message: `Aucun livre trouvé avec l'ISBN ${isbn}`
      });
    }

    // Vérifier si l'utilisateur est connecté
    if (!username) {
      return res.status(401).json({
        message: "Vous devez être connecté pour supprimer une critique"
      });
    }

    // Vérifier si le livre a des critiques
    if (!books[isbn].reviews) {
      return res.status(404).json({
        message: "Aucune critique n'existe pour ce livre"
      });
    }

    // Vérifier si l'utilisateur a une critique pour ce livre
    if (!books[isbn].reviews[username]) {
      return res.status(404).json({
        message: "Vous n'avez pas de critique à supprimer pour ce livre"
      });
    }

    // Supprimer la critique
    delete books[isbn].reviews[username];

    return res.status(200).json({
      message: "Critique supprimée avec succès",
      book: books[isbn].title
    });

  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la suppression de la critique",
      error: error.message
    });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
