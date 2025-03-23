const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://postgres:DAN0NOAH1@localhost/fsu_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const JWT = process.env.JWT;

const createTables = async () => {
    const SQL = `
        DROP TABLE IF EXISTS users CASCADE;
        DROP TABLE IF EXISTS items CASCADE;
        DROP TABLE IF EXISTS reviews CASCADE;
        DROP TABLE IF EXISTS comments;
        CREATE TABLE users(
            id UUID PRIMARY KEY,
            username VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
        CREATE TABLE items(
            id UUID PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            description VARCHAR(255) NOT NULL
        );
        CREATE TABLE reviews(
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) NOT NULL,
            item_id UUID REFERENCES items(id) NOT NULL,
            CONSTRAINT unique_user_id_and_item_id UNIQUE (user_id, item_id),
            rating SMALLINT NOT NULL CHECK (rating BETWEEN 0 and 6),
            review VARCHAR(255) NOT NULL
        );
        CREATE TABLE comments(
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) NOT NULL,
            item_id UUID REFERENCES items(id) NOT NULL,
            review_id UUID REFERENCES reviews(id) NOT NULL,
            comment VARCHAR(255) NOT NULL
        );
    `;
    await client.query(SQL);
}

const createUser = async({ username, password })=> {
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
  return response.rows[0];
};

const createItem = async({ name, description })=> {
  const SQL = `
    INSERT INTO items(id, name, description) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name, description]);
  return response.rows[0];
};

const createReview = async({ user_id, item_id, rating, review })=> {
  const SQL = `
    INSERT INTO reviews(id, user_id, item_id, rating, review) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, item_id, rating, review]);
  return response.rows[0];
};

const updateReview = async({ id, user_id, rating, review })=> {
  const SQL = `
    UPDATE reviews
    SET rating = $3, review = $4
    WHERE id = $1 AND user_id = $2;
  `;
  const response = await client.query(SQL, [id, user_id, rating, review]);
  return response.rows[0];
};

const destroyReview = async({ user_id, id })=> {
  const SQL = `
    DELETE FROM reviews WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

const fetchUserComments = async(user_id)=> {
  const SQL = `
    SELECT * FROM comments WHERE user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const createComment = async({ user_id, item_id, review_id, comment })=> {
  const SQL = `
    INSERT INTO comments(id, user_id, item_id, review_id, comment) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, item_id, review_id, comment]);
  return response.rows[0];
};

const updateComment = async({ id, user_id, comment })=> {
  const SQL = `
    UPDATE comments
    SET comment = $3
    WHERE id = $1 AND user_id = $2;
  `;
  const response = await client.query(SQL, [id, user_id, comment]);
  return response.rows[0];
};

const destroyComment = async({ user_id, id })=> {
  const SQL = `
    DELETE FROM comments WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

const authenticate = async({ username, password })=> {
  const SQL = `
    SELECT id, password FROM users WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password))=== false){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id}, JWT);
  return {token};
};

const findUserWithToken = async(token)=> {
  let id;
  try {
    const payload = jwt.verify(token, JWT);
    id = payload.id;
  }
  catch(ex){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if(!response.rows.length){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const fetchUsers = async()=> {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchAllItems = async()=> {
  const SQL = `
    SELECT * FROM items;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchItem = async(item_id)=> {
  const SQL = `
    SELECT * FROM items WHERE id = $1;
  `;
  const response = await client.query(SQL, [item_id]);
  return response.rows;
};

const fetchItemReviews = async(item_id)=> {
  const SQL = `
    SELECT * FROM reviews WHERE item_id = $1
  `;
  const response = await client.query(SQL, [item_id]);
  return response.rows;
};

const fetchUserReviews = async(user_id)=> {
  const SQL = `
    SELECT * FROM reviews WHERE user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const fetchReview = async(item_id, review_id)=> {
  const SQL = `
    SELECT * FROM reviews WHERE item_id = $1 AND id = $2
  `;
  const response = await client.query(SQL, [item_id, review_id]);
  return response.rows;
};

module.exports = {
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
    fetchUserComments,
    createComment,
    updateComment,
    destroyComment,
    authenticate,
    findUserWithToken
  };