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

// Fonction qui retourne une promesse pour obtenir tous les livres
const getAllBooks = () => {
  return new Promise((resolve, reject) => {
    try {
      const booksList = JSON.stringify(books, null, 2);
      resolve(JSON.parse(booksList));
    } catch (error) {
      reject(error);
    }
  });
};

// Version asynchrone utilisant async/await
public_users.get('/', async (req, res) => {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la récupération des livres",
      error: error.message
    });
  }
});

// Version alternative utilisant les promesses directement
public_users.get('/promise', (req, res) => {
  getAllBooks()
    .then(books => {
      return res.status(200).json(books);
    })
    .catch(error => {
      return res.status(500).json({
        message: "Erreur lors de la récupération des livres",
        error: error.message
      });
    });
});

// Fonction qui retourne une promesse pour obtenir un livre par ISBN
const getBookByISBN = (isbn) => {
  return new Promise((resolve, reject) => {
    try {
      if (books[isbn]) {
        resolve(books[isbn]);
      } else {
        reject(new Error(`Aucun livre trouvé avec l'ISBN ${isbn}`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Get book details based on ISBN - Version async/await
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const isbn = req.params.isbn;
    const book = await getBookByISBN(isbn);
    return res.status(200).json(book);
  } catch (error) {
    return res.status(404).json({
      message: error.message
    });
  }
});

// Get book details based on ISBN - Version Promise
public_users.get('/isbn/promise/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  
  getBookByISBN(isbn)
    .then(book => {
      return res.status(200).json(book);
    })
    .catch(error => {
      return res.status(404).json({
        message: error.message
      });
    });
});

// Fonction qui retourne une promesse pour obtenir les livres par auteur
const getBooksByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    try {
      const bookIds = Object.keys(books);
      const authorBooks = bookIds
        .filter(id => books[id].author.toLowerCase() === author.toLowerCase())
        .reduce((acc, id) => {
          acc[id] = books[id];
          return acc;
        }, {});

      if (Object.keys(authorBooks).length > 0) {
        resolve(authorBooks);
      } else {
        reject(new Error(`Aucun livre trouvé pour l'auteur "${author}"`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Get books by author - Version async/await
public_users.get('/author/:author', async (req, res) => {
  try {
    const requestedAuthor = req.params.author;
    const authorBooks = await getBooksByAuthor(requestedAuthor);
    return res.status(200).json(authorBooks);
  } catch (error) {
    return res.status(404).json({
      message: error.message
    });
  }
});

// Get books by author - Version Promise
public_users.get('/author/promise/:author', (req, res) => {
  const requestedAuthor = req.params.author;
  
  getBooksByAuthor(requestedAuthor)
    .then(authorBooks => {
      return res.status(200).json(authorBooks);
    })
    .catch(error => {
      return res.status(404).json({
        message: error.message
      });
    });
});

// Fonction qui retourne une promesse pour obtenir les livres par titre
const getBooksByTitle = (title) => {
  return new Promise((resolve, reject) => {
    try {
      const bookIds = Object.keys(books);
      const titleBooks = bookIds
        .filter(id => books[id].title.toLowerCase().includes(title.toLowerCase()))
        .reduce((acc, id) => {
          acc[id] = books[id];
          return acc;
        }, {});

      if (Object.keys(titleBooks).length > 0) {
        resolve(titleBooks);
      } else {
        reject(new Error(`Aucun livre trouvé avec le titre contenant "${title}"`));
      }
    } catch (error) {
      reject(error);
    }
  });
};

// Get books by title - Version async/await
public_users.get('/title/:title', async (req, res) => {
  try {
    const requestedTitle = req.params.title;
    const titleBooks = await getBooksByTitle(requestedTitle);
    return res.status(200).json(titleBooks);
  } catch (error) {
    return res.status(404).json({
      message: error.message
    });
  }
});

// Get books by title - Version Promise
public_users.get('/title/promise/:title', (req, res) => {
  const requestedTitle = req.params.title;
  
  getBooksByTitle(requestedTitle)
    .then(titleBooks => {
      return res.status(200).json(titleBooks);
    })
    .catch(error => {
      return res.status(404).json({
        message: error.message
      });
    });
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
