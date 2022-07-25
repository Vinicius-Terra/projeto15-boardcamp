import { createRental, getRentals, finishRental, deleteRental } from '../controllers/rentalsController.js';
import { Router } from 'express';

const router = Router();

router.get('/rentals/:customerId?/:gameId?', getRentals);
router.post('/rentals', createRental );
router.post("/rentals/:id/return", finishRental);
router.delete("/rentals/:id", deleteRental);

export default router;
