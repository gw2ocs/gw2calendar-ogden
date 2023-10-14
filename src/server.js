import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import bodyParser from 'body-parser';
import url from 'url';
import path from 'path';
import fetch from 'node-fetch';
import pg from 'pg';
import { remove as diacritics } from 'diacritics';
import crypto from 'crypto';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pgPool = new pg.Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: 'postgres',
    database: process.env.POSTGRES_DB,
});

function now() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), {
	dotfiles: 'ignore'
}));

app.get('/', async (req, res) => {
    console.log('foo');
    res.send('Hello world!');
});

app.get('/question_of_the_day', async (req, res) => {
    try {
        const { rows: questionRows} = await pgPool.query('SELECT question_id, title FROM questions WHERE day = $1', [now().getDate()]);
        if (!questionRows.length) {
            return res.send({ error: 'Pas de question pour aujourd\'hui !' });
        }
        res.send({ data: questionRows[0] });
    } catch (e) {
        console.error(e);
        return res.send({ error: 'Une erreur est survenue, veuillez essayer à nouveau. Si le problème persiste, merci de contacter l\'administrateur.' });
    }
});

app.post('/check_account', async (req, res) => {
    const { account } = req.body;
    try {
        const { rows } = await pgPool.query('SELECT COUNT(*) FROM participations WHERE day = $1 AND account = $2 AND valid is TRUE', [now().getDate(), account]);
        res.send({ data: rows[0].count !== '0' }); 
    } catch (e) {
        console.error(e);
        return res.send({ error: 'Une erreur est survenue, veuillez essayer à nouveau. Si le problème persiste, merci de contacter l\'administrateur.' });
    }
});

const testAnswer = (answers, text) => {
    return answers
            .some(ans => ans.content.split(/\s*;\s*/)
                .every(str => new RegExp(diacritics(str.trim()).replace(/ /g, '.*').replace(/[’'-]/g, '.'), "gi").test(diacritics(text).replace(/-/g, ' '))));
};

app.post('/check_answer', async (req, res) => {
    const { uid, account, token, answer } = req.body;
    try {
        const { rows } = await pgPool.query('SELECT COUNT(*) FROM participations WHERE day = $1 AND account = $2 AND valid is TRUE', [now().getDate(), account]);
        console.log(rows);
        if (rows[0].count !== '0') {
            return res.send({ error: 'Vous avez déjà participé aujourd\'hui. Revenez demain pour la prochaine question !'});
        }
        const { rows: answerRows } = await pgPool.query('SELECT content FROM answers a LEFT JOIN questions q ON a.question_id = q.question_id WHERE day = $1', [now().getDate()]);
        const result = testAnswer(answerRows, answer);
        const ret = { data: result };
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // if correct, inform calendar
        if (result) {
            const data = {
                uid,
                account,
                token
            };
            const hash = crypto.createHmac(process.env.CRYPTO_ALGO || 'sha1', process.env.CRYPTO_SECRET).update((new URLSearchParams(data)).toString()).digest('hex');
            data.signature = hash;
            console.log(data);
            const formdata = new URLSearchParams(data);
            await fetch('https://calendrier.gw2.fr/api/trivia', {
                method: 'post',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formdata
            }).then(async res => {
                /*
                - 404 : utilisateur introuvable
                - 401 : signature incorrecte
                - 425 : participation déjà enregistrée aujourd'hui
                - 200 : participation enregistrée 
                */
                switch (res.status) {
                    case 200:
                        await pgPool.query('INSERT INTO participations (account, content, ip, valid, day) VALUES ($1, $2, $3, $4, $5)', [account, answer, ip, result, now().getDate()]);
                        break;
                    default:
                        await pgPool.query('INSERT INTO participations (account, content, ip, valid, day) VALUES ($1, $2, $3, $4, $5)', [account, answer, ip, false, now().getDate()]);
                        ret.error = `Une erreur s'est produite. Code d'erreur : ${res.status}. Veuillez réessayer, et si l'erreur persiste, contacter l'administrateur.`;
                        break;
                }
            }).catch(async err => {
                console.error(err);
                pgPool.query('INSERT INTO participations (account, content, ip, valid, day) VALUES ($1, $2, $3, $4, $5)', [account, answer, ip, false, now().getDate()]);
                ret.error = `Une erreur s'est produite. Veuillez réessayer, et si l'erreur persiste, contacter l'administrateur.`;
            });
        } else {
            pgPool.query('INSERT INTO participations (account, content, ip, valid, day) VALUES ($1, $2, $3, $4, $5)', [account, answer, ip, result, now().getDate()]);
        }

        console.log('returning ', ret);
        res.send(ret); 
    } catch (e) {
        console.error(e);
        return res.send({ error: 'Une erreur est survenue, veuillez essayer à nouveau. Si le problème persiste, merci de contacter l\'administrateur.' });
    }
});

export default server;