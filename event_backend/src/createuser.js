const bcrypt = require("bcryptjs");
const { pool }= require("../db");

async function seed(){
    const hash = await bcrypt.hash("123",10);
    await pool.query("INSERT INTO users (username,password) VALUES($1,$2)",["user",hash]);
    console.log("User inserted : OK");
    process.exit;
}

seed()