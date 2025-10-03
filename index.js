const express = require('express');
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Pasta de uploads ---
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir); // cria a pasta se não existir
}

// --- Configuração Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- Configuração do Postgres ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eNfZyv9op2VR@ep-floral-forest-adc9dzvt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

// --- Servir imagens ---
app.use("/uploads", express.static(uploadDir));

// --- GET: lista todos os usuários ---
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.send("Erro ao buscar usuários: " + err.message);
  }
});

app.post("/usuarios", upload.single("foto"), async (req, res) => {
  try {
    const { nome, idade, sexo, cidade, bio } = req.body;
    const foto = req.file ? req.file.filename : null;

    // Validação mínima
    if (!nome || !idade || !sexo || !cidade || !bio) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios." });
    }

    const result = await pool.query(
      `INSERT INTO users (nome, idade, sexo, cidade, bio, foto)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [nome, parseInt(idade), sexo, cidade, bio, foto]
    );

    console.log("Usuário cadastrado:", result.rows[0]);

    // Retorna JSON para o frontend
    res.json({ message: "Usuário cadastrado com sucesso!", usuario: result.rows[0] });

  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    res.status(500).json({ message: "Erro ao cadastrar usuário", detalhe: err.message });
  }
});



app.get("/usuarios/sorteio", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, idade, bio, foto
      FROM users
      ORDER BY RANDOM()
      LIMIT 1
    `);

    console.log("Registros do DB:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao buscar usuários para sorteio:", err);
    res.json([]);
  }
});




// --- Inicia servidor ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));


