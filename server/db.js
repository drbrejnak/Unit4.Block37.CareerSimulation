const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://postgres:DAN0NOAH1@localhost/fsu_db');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';

const createTables = async () => {
    const SQL = `
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS reviews;
        CREATE TABLE users(
            id UUID PRIMARY KEY,
            username VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        );
        CREATE TABLE items(
            id UUID PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
            desc VARCHAR(255) NOT NULL,
        );
        CREATE TABLE reviews(
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id) NOT NULL,
            item_id UUID REFERENCES items(id) NOT NULL,
            CONSTRAINT unique_user_id_and_item_id UNIQUE (user_id, item_id)
            rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 and 5),
            review VARCHAR(255) NOT NULL
        );
    `;
    await client.query(SQL);
}

const createUser = async({ username, password})=> {
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
  return response.rows[0];
};

const createItem = async({ name, desc })=> {
  const SQL = `
    INSERT INTO items(id, name, desc) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name, desc]);
  return response.rows[0];
};

const createReview = async({ user_id, item_id, rating, review })=> {
  const SQL = `
    INSERT INTO reviews(id, user_id, item_id, rating, review) VALUES($1, $2, $3, $4, $5) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, item_id, rating, review]);
  return response.rows[0];
};

const destroyReview = async({ user_id, id })=> {
  const SQL = `
    DELETE FROM reviews WHERE user_id=$1 AND id=$2
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
    SELECT * FROM items where item_id = $1;
  `;
  const response = await client.query(SQL, [item_id]);
  return response.rows;
};

const fetchReviews = async(item_id)=> {
  const SQL = `
    SELECT * FROM reviews where item_id = $1
  `;
  const response = await client.query(SQL, [item_id]);
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
    fetchReviews,
    createReview,
    destroyReview,
    authenticate,
    findUserWithToken
  };
