import connection from '../dbStrategy/postgres.js';
import joi from 'joi';
import dayjs from "dayjs";

export async function getRentals(req, res) {

  const { customerId, gameId } = req.query;

  try {
    let filter;
    const params = [];

    if (customerId && gameId) {
      filter = 'WHERE "customerId" = $1 AND "gameId" = $2';
      params.push(customerId, gameId);
    } else if (customerId) {
      filter = 'WHERE "customerId" = $1';
      params.push(customerId);
    } else if (gameId) {
      filter = 'WHERE "gameId" = $1';
      params.push(gameId);
    } else {
      filter = "";
    }


    const { rows: rentals } = await connection.query(
      `
      SELECT rentals.*, 
      customers.name as custoname, customers.id as custoid, 
      games.name as gamename, games."categoryId" as gamecatid, 
      categories.name as gamecatname
      FROM rentals
      JOIN customers ON rentals."customerId" = customers.id
      JOIN games ON rentals."gameId" = games.id
      JOIN categories ON games."categoryId" = categories.id
      ${filter}`,
      params
    );

 


    let rentalsArray = [];
    for (let i =0; i < rentals.length; i++){
      const rentalsJoin = {
        ...rentals[i],
        customer: {id:rentals[i].custoid, name:rentals[i].custoname},
        game: {id:rentals[i].gameId, name:rentals[i].gamename, categoryId:rentals[i].gamecatid, categoryName:rentals[i].gamecatname}
      }
      delete rentalsJoin.custoid;
      delete rentalsJoin.custoname;
      delete rentalsJoin.name;
      delete rentalsJoin.name;
      delete rentalsJoin.gamename;
      delete rentalsJoin.gamecatid;
      delete rentalsJoin.gamecatname;
      rentalsArray.push(rentalsJoin)
    }

    

    return res.status(200).send(rentalsArray);


  } catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}


export async function createRental(req, res) {
  const newRental = req.body;

  
  try{
// Validations
  const rentalSchema = joi.object({
    
    customerId: joi.number().min(1).required(),
    gameId: joi.number().min(1).required(),
    daysRented: joi.number().min(1).required(),
  });

  const { error } = rentalSchema.validate(newRental);

  if (error) {
    return res.send(error).Status(400);
  }

  
  const { rows: doesCostumereExist } = await connection.query(`
  SELECT * FROM customers where id = '${newRental.customerId}'
  `);

  
  if (!doesCostumereExist.length){
    
  return res.sendStatus(400);
  }

  const { rows: doesGameExist } = await connection.query(`
  SELECT * FROM games where id = '${newRental.gameId}'
  `);

  if (!doesGameExist.length){
    return res.sendStatus(400);
  }

  
  const { rows: rentals } = await connection.query(`
    SELECT * FROM rentals WHERE "gameId" = '${newRental.gameId}'
    `,
  );

  if (doesGameExist[0].stockTotal <= rentals.length) {
    return res.sendStatus(409);
  }

//-------

  let rentDate = dayjs().format('YYYY/MM/DD');

  const originalPrice = doesGameExist[0].pricePerDay * newRental.daysRented;

  await connection.query(
    `INSERT INTO rentals ("customerId","gameId","rentDate", "daysRented", "returnDate", "originalPrice","delayFee")  
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [newRental.customerId, newRental.gameId, rentDate, newRental.daysRented, null, originalPrice, null]
  );

  return res.sendStatus(201);
  } catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}


export async function finishRental(req, res) {

  const { id } = req.params;

  try {
    const { rows: rental } = await connection.query(
      ` SELECT * FROM rentals WHERE id = $1;`,
      [id]
    );

    if (rental.length === 0) {
      return res.sendStatus(404);
    }

    const { rows: game } = await connection.query(
      `SELECT * FROM games WHERE id = $1`,
      [rental[0].gameId]
    );


    if (rental[0].returnDate !== null) {
      return res.sendStatus(400);
    }

    const delayFee = dayjs().diff(rental[0].rentDate, "day");

    await connection.query(
      `
                UPDATE rentals 
                SET "returnDate" = $1, "delayFee" = $2
                WHERE id = $3
            `,
      [dayjs().format("YYYY-MM-DD"), delayFee * game[0].pricePerDay, id]
    );

    return res.sendStatus(200);
  } catch(err){
    console.log(err)
    return res.send(err).status(500);
  }
}

export async function deleteRental(req, res) {
  const { id } = req.params;

  try {
    const { rows: rental } = await connection.query(`
      SELECT * FROM rentals WHERE id = $1
      `,
      [id]
    );

    if (rental.length === 0) {
      return res.sendStatus(404);
    }

    if (rental[0].returnDate === null) {
      return res.sendStatus(400);
    }

    await connection.query(`
      DELETE FROM rentals WHERE id = $1
      `,
      [id]
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.send(err).status(500);
  }
}