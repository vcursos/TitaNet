import { Router } from 'express';
import { checkNetworkStatus, manageConnections, reportOutage } from './networkService';

const router = Router();

// Route to check the network status
router.get('/status', async (req, res) => {
    try {
        const status = await checkNetworkStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching network status', error });
    }
});

// Route to manage network connections
router.post('/connections', async (req, res) => {
    try {
        const result = await manageConnections(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error managing connections', error });
    }
});

// Route to report a network outage
router.post('/outage', async (req, res) => {
    try {
        const result = await reportOutage(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error reporting outage', error });
    }
});

export default router;