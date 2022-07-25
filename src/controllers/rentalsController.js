import connection from '../dbStrategy/postgres.js';
import joi from 'joi';
import dayjs from "dayjs";

export async function getRentals(req, res) {

  const { customerId, gameId } = req.query;
  try {
    let filter;
    const query = [];

    if (customerId && gameId) {
      filter = 'WHERE "customerId" = $1 AND "gameId" = $2';
      query.push(customerId, gameId);
    } else if (customerId) {
      filter = 'WHERE "customerId" = $1';
      query.push(customerId);
    } else if (gameId) {
      filter = 'WHERE "gameId" = $1';
      query.push(gameId);
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
      ${filter}
      `,
      query
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
      console.log(rentalsJoin)
      rentalsArray.push(rentalsJoin)
    }

    

    res.status(200).send(rentalsArray);


  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
}

export async function getCustomersById(req, res) {
  const { id } = req.params;
  const { rows: custumer } = await connection.query(`
    SELECT * FROM customers WHERE id = $1`, [id]);

  if (custumer){
    res.send(custumer).status(200);
  }
  else{
    return res.sendStatus(404);
  }

  
}

export async function createRental(req, res) {
  const newRental = req.body;

  

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
    res.sendStatus(409);
  }

//-------

  let rentDate = dayjs().format('YYYY/MM/DD');

  const originalPrice = doesGameExist[0].pricePerDay * newRental.daysRented;

  console.log(rentDate)
  await connection.query(
    `INSERT INTO rentals ("customerId","gameId","rentDate", "daysRented", "returnDate", "originalPrice","delayFee")  
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [newRental.customerId, newRental.gameId, rentDate, newRental.daysRented, null, originalPrice, null]
  );

  res.sendStatus(201);
}

export async function updateCostumer(req, res) {
  const { id } = req.params;
  const newCostumer = req.body;

  const costumerSchema = joi.object({
      name: joi.string().required(),
      phone: joi.string().pattern(/^[0-9]{10,11}$/).required(),
      cpf: joi.string().pattern(/^[0-9]{11}$/).required(),
      birthday: joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required()
  });

  const { error } = costumerSchema.validate(newCostumer);

  console.log(id)
  if (error ) {
    return res.sendStatus(400);
  }
  if(!id){
    return res.sendStatus(400);
  }
  
  await connection.query(
    `UPDATE customers SET name = '${newCostumer.name}', phone = '${newCostumer.phone}', 
      cpf = '${newCostumer.cpf}', birthday = '${newCostumer.birthday}' WHERE id = $1`, [id]
  );

  res.sendStatus(200);
}
