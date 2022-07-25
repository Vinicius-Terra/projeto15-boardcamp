import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getCategories(req, res) {
  try{
  const { rows: categories } = await connection.query(`
    SELECT * FROM categories ;
  `);

  return res.send(categories).status(200);
  }
  catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}

export async function getPostById(req, res) {
  const { id } = req.params;

  const { rows: categories } = await connection.query(
    `
      SELECT posts.titulo, posts.post, posts.id, users.nome FROM posts
      JOIN user_posts
      ON posts.id = user_posts.postid
      JOIN users
      ON users.id = user_posts.userid
      WHERE posts.id = $1
    `,
    [id]
  );

  return res.send(categories);
}

export async function createCategorie(req, res) {
  const newCategorie = req.body;

  try{
    const CategorieSchema = joi.object({
      name: joi.string().required()
    });

    const { error } = CategorieSchema.validate(newCategorie);

    if (error) {
      return res.sendStatus(400);
    }

    const { rows: doesCategorieExist } = await connection.query(`
      SELECT * FROM categories where name = '${newCategorie.name}'
    `);

    console.log(doesCategorieExist.length)

    if (doesCategorieExist.length){
      return res.sendStatus(409);
    }

    await connection.query(
      `INSERT INTO categories (name) VALUES ('${newCategorie.name}')`
    );

    return res.sendStatus(201);
  }
  catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}
