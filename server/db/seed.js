const {
    client,
    createTables,
    createUser,
    createItem,
    fetchUsers,
    fetchAllItems,
    fetchItemReviews,
    createReview,
    createComment,
    fetchUserComments
  } = require('./db');
  const express = require('express');
  const app = express();
  app.use(express.json());

const init = async()=> {
    // const port = process.env.PORT || 3000;
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

    // app.listen(port, ()=> console.log(`listening on port ${port}`));

};

if (require.main === module) {
    init();
}

module.exports = init;

// init();