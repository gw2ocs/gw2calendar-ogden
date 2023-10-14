#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import server from '../server.js';

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${server.address().port}`);
});