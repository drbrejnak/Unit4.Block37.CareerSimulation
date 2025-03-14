const {
    client,
    createTables,
    createUser,
    createItem,
    fetchUsers,
    fetchAllItems
    fetchItem,
    fetchReviews,
    createReview,
    destroyReview,
    authenticate,
    findUserWithToken
  } = require('./db')
const express = require('express');
const app = express();
app.use(express.json());

const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets')));

const isLoggedIn = async(req, res, next)=> {
  try {
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};

app.post('/api/auth/login', async(req, res, next)=> {
    try {
      res.send(await authenticate(req.body));
    }
    catch(ex){
      next(ex);
    }
});

app.post('/api/auth/register', async(req, res, next)=> {
    try {
      res.send(createUser(req.body))
    }
    catch(ex){
      next(ex);
    }
});

app.get('/api/auth/me', async(req, res, next)=> {
    try {
      res.send(await findUserWithToken(req.headers.authorization));
    }
    catch(ex){
      next(ex);
    }
});

app.get('/api/items', async(req, res, next)=> {
    try {
      res.send(await fetchAllItems());
    }
    catch(ex){
      next(ex);
    }
});

app.get('/api/items/:itemId', async(req, res, next)=> {
    try {
      res.send(await fetchItem(req.params.id));
    }
    catch(ex){
      next(ex);
    }
});

app.get('/api/items/:itemId/reviews', async(req, res, next)=> {
    try {
      res.send(await fetchReviews(req.params.id));
    }
    catch(ex){
      next(ex);
    }
});