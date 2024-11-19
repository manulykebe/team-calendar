// server/src/scripts/generateHash.ts
import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'manu';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Hash for password "${password}":`, hash);
}

generateHash();

/*
node --loader ts-node/esm src/scripts/generateHash.ts
*/