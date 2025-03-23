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
} = require('../db/db')
const express = require('express');
const router = express.Router();

// const app = express();
// app.use(express.json());
// const port = process.env.PORT || 3000;

client.connect();

const path = require('path');
router.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
router.use('/assets', express.static(path.join(__dirname, '../client/dist/assets')));

const isLoggedIn = async(req, res, next)=> {
try {
  req.user = await findUserWithToken(req.headers.authorization);
  next();
}
catch(ex){
  next(ex);
}
};

router.post('/api/auth/register', async(req, res, next)=> {
  try {
    res.send(createUser(req.body))
  }
  catch(ex){
    next(ex);
  }
});

router.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

router.get('/api/auth/me', async(req, res, next)=> {
  try {
    res.send(await findUserWithToken(req.headers.authorization));
  }
  catch(ex){
    next(ex);
  }
});

router.get('/api/items', async(req, res, next)=> {
  try {
    res.send(await fetchAllItems());
  }
  catch(ex){
    next(ex);
  }
});

router.get('/api/items/:itemId', async(req, res, next)=> {
  try {
    res.send(await fetchItem(req.params.itemId));
  }
  catch(ex){
    next(ex);
  }
});

router.get('/api/items/:itemId/reviews', async(req, res, next)=> {
  try {
    res.send(await fetchItemReviews(req.params.itemId));
  }
  catch(ex){
    next(ex);
  }
});

router.get('/api/items/:itemId/reviews/:reviewId', async(req, res, next)=> {
try {
  res.send(await fetchReview(req.params.itemId, req.params.reviewId));
}
catch(ex){
  next(ex);
}
});

router.post('/api/items/:itemId/reviews/', isLoggedIn, async(req, res, next)=> {
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

router.get('/api/reviews/me', isLoggedIn, async(req, res, next)=> {
try {
  res.send(await fetchUserReviews(req.user.id));
}
catch(ex){
  next(ex);
}
});

router.put('/api/users/:userId/reviews/:reviewId', isLoggedIn, async(req, res, next)=> {
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

router.post('/api/items/:itemId/reviews/:reviewId/comments', isLoggedIn, async(req, res, next)=> {
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

router.get('/api/comments/me', isLoggedIn, async(req, res, next)=> {
try {
  res.send(await fetchUserComments(req.user.id));
}
catch(ex){
  next(ex);
}
});

router.put('/api/users/:userId/comments/:commentId', isLoggedIn, async(req, res, next)=> {
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

router.delete('/api/users/:user_id/reviews/:reviewId', isLoggedIn, async(req, res, next)=> {
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

router.delete('/api/users/:user_id/comments/:commentId', isLoggedIn, async(req, res, next)=> {
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

router.use((err, req, res, next)=> {
    console.log(err);
    res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

// const init = async () => {
//     await client.connect();
//     router.listen(port, ()=> console.log(`listening on port ${port}`));
// }

// init();

module.exports = router;