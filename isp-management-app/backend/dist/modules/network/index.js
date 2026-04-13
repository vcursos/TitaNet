"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const networkService_1 = require("./networkService");
const router = (0, express_1.Router)();
// Route to check the network status
router.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const status = yield (0, networkService_1.checkNetworkStatus)();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching network status', error });
    }
}));
// Route to manage network connections
router.post('/connections', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, networkService_1.manageConnections)(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error managing connections', error });
    }
}));
// Route to report a network outage
router.post('/outage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, networkService_1.reportOutage)(req.body);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Error reporting outage', error });
    }
}));
exports.default = router;
