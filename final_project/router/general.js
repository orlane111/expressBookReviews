const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req,res) => {
  try {
    // Récupérer le nom d'utilisateur et le mot de passe du corps de la requête
    const { username, password } = req.body;

    // Vérifier si le nom d'utilisateur et le mot de passe sont fournis
    if (!username || !password) {
      return res.status(400).json({
        message: "Le nom d'utilisateur et le mot de passe sont requis"
      });
    }

    // Vérifier si le nom d'utilisateur existe déjà
    if (users.find(user => user.username === username)) {
      return res.status(409).json({
        message: `L'utilisateur "${username}" existe déjà`
      });
    }

    // Vérifier la longueur minimale du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        message: "Le mot de passe doit contenir au moins 6 caractères"
      });
    }

    // Ajouter le nouvel utilisateur
    users.push({ username, password });

    return res.status(201).json({
      message: "Utilisateur enregistré avec succès",
      username: username
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de l'enregistrement de l'utilisateur",
      error: error.message
    });
  }
});

// Fonction pour simuler une requête API avec délai
const simulateAPICall = (data, delay = 1000) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

// Task 10: Get the book list available in the shop
public_users.get('/', async (req, res) => {
  try {
    // Simuler un appel API asynchrone
    const booksList = await simulateAPICall(books);
    return res.status(200).json(booksList);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des livres",
      error: error.message
    });
  }
});

// Task 11: Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    // Simuler un appel API asynchrone
    const book = await simulateAPICall(books[isbn]);
    
    if (!book) {
      return res.status(404).json({
        message: `Aucun livre trouvé avec l'ISBN ${isbn}`
      });
    }
    
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la recherche du livre",
      error: error.message
    });
  }
});

// Task 12: Get book details based on author
public_users.get('/author/:author', async (req, res) => {
  try {
    const requestedAuthor = req.params.author;
    // Simuler un appel API asynchrone
    const allBooks = await simulateAPICall(books);
    
    const authorBooks = Object.keys(allBooks)
      .filter(id => allBooks[id].author.toLowerCase() === requestedAuthor.toLowerCase())
      .reduce((acc, id) => {
        acc[id] = allBooks[id];
        return acc;
      }, {});

    if (Object.keys(authorBooks).length === 0) {
      return res.status(404).json({
        message: `Aucun livre trouvé pour l'auteur "${requestedAuthor}"`
      });
    }

    return res.status(200).json(authorBooks);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la recherche des livres",
      error: error.message
    });
  }
});

// Task 13: Get book details based on title
public_users.get('/title/:title', async (req, res) => {
  try {
    const requestedTitle = req.params.title;
    // Simuler un appel API asynchrone
    const allBooks = await simulateAPICall(books);
    
    const titleBooks = Object.keys(allBooks)
      .filter(id => allBooks[id].title.toLowerCase().includes(requestedTitle.toLowerCase()))
      .reduce((acc, id) => {
        acc[id] = allBooks[id];
        return acc;
      }, {});

    if (Object.keys(titleBooks).length === 0) {
      return res.status(404).json({
        message: `Aucun livre trouvé avec le titre contenant "${requestedTitle}"`
      });
    }

    return res.status(200).json(titleBooks);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la recherche des livres",
      error: error.message
    });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  try {
    // Récupérer l'ISBN depuis les paramètres
    const isbn = req.params.isbn;

    // Vérifier si le livre existe
    if (!books[isbn]) {
      return res.status(404).json({
        message: `Aucun livre trouvé avec l'ISBN ${isbn}`
      });
    }

    // Récupérer les critiques du livre
    const bookReviews = books[isbn].reviews;

    // Vérifier s'il y a des critiques
    if (Object.keys(bookReviews).length > 0) {
      return res.status(200).json({
        isbn: isbn,
        title: books[isbn].title,
        reviews: bookReviews
      });
    } else {
      return res.status(200).json({
        message: `Aucune critique disponible pour le livre "${books[isbn].title}"`,
        isbn: isbn,
        title: books[isbn].title,
        reviews: {}
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des critiques",
      error: error.message
    });
  }
});

module.exports.general = public_users;
