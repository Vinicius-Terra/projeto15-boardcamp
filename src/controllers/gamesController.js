import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getGames(req, res) {

  let name = req.query.name;
  

  try{
    if (!name){
      console.log("0")
      const { rows: games } = await connection.query(`
        SELECT games.*, categories.name as "categoryName"  FROM games 
        JOIN categories
        ON games."categoryId" = categories.id
      `);

      return res.send(games).status(200);
    }
    else{
      const { rows: games } = await connection.query(`
      SELECT games.*, categories.name as "categoryName"  FROM games 
      JOIN categories
      ON games."categoryId" = categories.id
      `);

    name = name.toLowerCase();
		let searchedGames = games.filter(g => g.name
			  .toLowerCase()
			  .startsWith(name.slice(0, Math.max(g.name.length - 1, 1)))
			);

      return res.send(searchedGames).status(200);
      }
  }
  catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}

export async function createGame(req, res) {
  const newGame = req.body;

  try{
    const gameSchema = joi.object({
      name: joi.string().required(),
      stockTotal: joi.number().min(1).required(),
      pricePerDay: joi.number().min(1).required(),
      categoryId: joi.number().min(1).required(),
      image: joi.string().pattern(/^(https:\/\/)/).required()
    });

    const { error } = gameSchema.validate(newGame);

    if (error) {
      return res.send(error).status(400);
    }

    const { rows: doesGameExist } = await connection.query(`
      SELECT * FROM games where name = '${newGame.name}'
    `);

    if (doesGameExist.length){
      return res.sendStatus(409);
    }

    const { rows: doesCategorieExist } = await connection.query(`
      SELECT * FROM categories where id = '${newGame.categoryId}'
    `);

    if (!doesCategorieExist.length){
      return res.sendStatus(400);
    }

    await connection.query(
      `INSERT INTO games (name,image,"stockTotal","categoryId","pricePerDay") 
        VALUES ('${newGame.name}','${newGame.image}','${newGame.stockTotal}','${newGame.categoryId}', '${newGame.pricePerDay}')`
    );

    return res.sendStatus(201);
  }
  catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}