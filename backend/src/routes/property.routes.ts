import { Router } from 'express';
import { searchProperties, getNearbyAmenities, addProperty } from '../controllers/property.controller';
const router = Router();

router.get('/search', searchProperties);
router.get('/:id/nearby-amenities', getNearbyAmenities);
router.post('/add', addProperty);
router.get('/:id/nearby', getNearbyAmenities);

export default router;
