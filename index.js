const express = require('express');
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors()); // permite que o front-end acesse
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eNfZyv9op2VR@ep-floral-forest-adc9dzvt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    ssl: { rejectUnauthorized: false }
});

app.listen(8080, () => {
    console.log("Servidor rodando na porta 8080");
});

// GET: lista todos os usuários
app.get("/usuarios", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao buscar usuários");
    }
});

// POST: cadastra um usuário
app.post("/usuarios", async (req, res) => {
    try {
        const { email, nome, idade, sexo, cidade, bio, foto } = req.body;

        const result = await pool.query(
            `INSERT INTO users (email, nome, idade, sexo, cidade, bio, foto)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [email, nome, idade, sexo, cidade, bio, foto]
        );

        res.json({
            message: "Usuário cadastrado com sucesso!",
            usuario: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao cadastrar usuário");
    }
});
 