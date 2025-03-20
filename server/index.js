const {
  client,
  createTables,
  createUser,
  createItem,
  fetchUsers,
  fetchAllItems,
  fetchItem,
  fetchItemReviews,
  fetchUserReviews,
  createReview,
  updateReview,
  destroyReview,
  fetchReview,
  authenticate,
  findUserWithToken,
  destroyComment,
  updateComment,
  createComment,
  fetchUserComments
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
    res.send(await fetchItem(req.params.itemId));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/items/:itemId/reviews', async(req, res, next)=> {
  try {
    res.send(await fetchItemReviews(req.params.itemId));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/items/:itemId/reviews/:reviewId', async(req, res, next)=> {
try {
  res.send(await fetchReview(req.params.itemId, req.params.reviewId));
}
catch(ex){
  next(ex);
}
});

app.post('/api/items/:itemId/reviews/', isLoggedIn, async(req, res, next)=> {
try {
  if(req.user.id !== req.body.user_id){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  res.status(201).send(await createReview({user_id: req.body.user_id, item_id: req.params.itemId, rating: req.body.rating, review: req.body.review}));
}
catch(ex){
  next(ex);
}
});

app.get('/api/reviews/me', isLoggedIn, async(req, res, next)=> {
try {
  res.send(await fetchUserReviews(req.user.id));
}
catch(ex){
  next(ex);
}
});

app.put('/api/users/:userId/reviews/:reviewId', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.user.id !== req.params.userId){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.status(201).send(await updateReview({id: req.params.reviewId, user_id: req.params.userId, rating: req.body.rating, review: req.body.review}));
  }
  catch(ex){
    next(ex);
  }
  });

app.post('/api/items/:itemId/reviews/:reviewId/comments', isLoggedIn, async(req, res, next)=> {
try {
  if(req.user.id !== req.body.user_id){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  res.status(201).send(await createComment({user_id: req.body.user_id, item_id: req.params.itemId, review_id: req.params.reviewId, comment: req.body.comment}));
}
catch(ex){
  next(ex);
}
});

app.get('/api/comments/me', isLoggedIn, async(req, res, next)=> {
try {
  res.send(await fetchUserComments(req.user.id));
}
catch(ex){
  next(ex);
}
});

app.put('/api/users/:userId/comments/:commentId', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.user.id !== req.params.userId){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.status(201).send(await updateComment({id: req.params.commentId, user_id: req.params.userId, comment: req.body.comment}));
  }
  catch(ex){
    next(ex);
  }
  });

app.delete('/api/users/:user_id/reviews/:reviewId', isLoggedIn, async(req, res, next)=> {
try {
  if(req.params.user_id !== req.user.id){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  await destroyReview({user_id: req.params.user_id, id: req.params.reviewId });
  res.sendStatus(204);
}
catch(ex){
  next(ex);
}
});

app.delete('/api/users/:user_id/comments/:commentId', isLoggedIn, async(req, res, next)=> {
try {
  if(req.params.user_id !== req.user.id){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  await destroyComment({user_id: req.params.user_id, id: req.params.commentId });
  res.sendStatus(204);
}
catch(ex){
  next(ex);
}
});

app.use((err, req, res, next)=> {
console.log(err);
res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

const init = async()=> {
const port = process.env.PORT || 3000;
await client.connect();
console.log('connected to database');

await createTables();
console.log('tables created');

const [moe, lucy, curly, computer, restaurant] = await Promise.all([
  createUser({ username: 'moe', password: 'm_pw'}),
  createUser({ username: 'lucy', password: 'l_pw'}),
  createUser({ username: 'curly', password: 'c_pw'}),
  createItem({ name: 'computer', description: "Moe's PC" }),
  createItem({ name: 'restaurant', description: "WcDonald's" }),
]);

console.log(await fetchUsers());
console.log(await fetchAllItems());

console.log(await fetchItemReviews(computer.id));
const favorite = await createReview({user_id: moe.id, item_id: computer.id, rating: 5, review: 'This is my favorite computer.'});
await createReview({user_id: curly.id, item_id: computer.id, rating: 5, review: "I sold this computer to Moe after I'd given it some upgrades."});
console.log(await fetchItemReviews(computer.id));

console.log(await fetchUserComments(lucy.id));
const comment = await createComment({user_id: lucy.id, item_id: computer.id, review_id: favorite.id, comment: "I've borrowed this computer several times and it's never given me any issue."});
console.log(await fetchUserComments(lucy.id));

app.listen(port, ()=> console.log(`listening on port ${port}`));
};

init();