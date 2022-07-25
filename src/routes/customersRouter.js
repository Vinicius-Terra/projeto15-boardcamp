import { getCustomers, getCustomersById, createCostumer, updateCostumer } from '../controllers/customersController.js';
import { Router } from 'express';

const router = Router();

router.get('/customers/:id', getCustomersById);
router.get('/customers/:cpf?', getCustomers);
router.post('/customers', createCostumer);
router.put('/customers/:id', updateCostumer);

export default router;
