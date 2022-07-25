import connection from '../dbStrategy/postgres.js';
import joi from 'joi';

export async function getCustomers(req, res) {

  let cpf = req.query.cpf;

  try{
    if (cpf){
      const { rows: customers } = await connection.query(`
        SELECT * FROM customers `);

      cpf = cpf.toString();
      let searchedCustomers = customers.filter(c => c.cpf
            .toLowerCase()
            .startsWith(cpf.slice(0, Math.max(c.cpf.length - 1, 1)))
          );
    
      return res.send(searchedCustomers).status(200);
    }
    else{
      const { rows: customers } = await connection.query(`
        SELECT * FROM customers `);
     return res.send(customers).status(200);
    }
  }
  catch(err){
    console.log(err)
    res.send(err).status(500);
  }

  
}

export async function getCustomersById(req, res) {
  const { id } = req.params;

  console.log(id)
  const { rows: custumer } = await connection.query(`
    SELECT * FROM customers WHERE id = $1`, [id]);

  if (custumer.length){
    res.send(custumer).status(200);
  }
  else{
    return res.sendStatus(404);
  }

  
}

export async function createCostumer(req, res) {
  const newCostumer = req.body;

  const costumerSchema = joi.object({
      name: joi.string().required(),
      phone: joi.string().pattern(/^[0-9]{10,11}$/).required(),
      cpf: joi.string().pattern(/^[0-9]{11}$/).required(),
      birthday: joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).required()
  });

  const { error } = costumerSchema.validate(newCostumer);

  if (error) {
    return res.sendStatus(400);
  }

  const { rows: doesCostumereExist } = await connection.query(`
    SELECT * FROM customers where cpf = '${newCostumer.cpf}'
  `);

  if (doesCostumereExist.length){
    return res.sendStatus(409);
  }

  await connection.query(
    `INSERT INTO customers (name, phone, cpf, birthday)  
      VALUES ('${newCostumer.name}','${newCostumer.phone}','${newCostumer.cpf}','${newCostumer.birthday}')`
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
  
  const { rows: doesCostumereExist } = await connection.query(`
  SELECT * FROM customers where cpf = '${newCostumer.cpf}'
  `);

  if (doesCostumereExist.length){
  return res.sendStatus(409);
  }

  await connection.query(
    `UPDATE customers SET name = '${newCostumer.name}', phone = '${newCostumer.phone}', 
      cpf = '${newCostumer.cpf}', birthday = '${newCostumer.birthday}' WHERE id = $1`, [id]
  );

  res.sendStatus(200);
}