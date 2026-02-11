# Projet WEB – EventsSquare

Ce projet contient un **frontend React (Vite)** et un **backend Node/Express** avec une base **PostgreSQL**.


## Configuration de la base de données
Par défaut, la connexion DB est définie dans `event_backend/src/db.js` :

```
host: "localhost"
port: 5432
user: "postgres"
password: "rACIne" a modifier en fonction
database: "postgres" a modifier en fonction aussi
```

Si besoin, modifiez ces valeurs selon votre environnement.

### Schéma SQL (à exécuter une seule fois)
Vous pouvez lancer ces requêtes dans `psql` ou pgAdmin  deja testeer avec un autre pc avec PG admin en copiant les requetes dans le Query editor :


```postgre creation des tables avec colonne
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS public.events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  capacity INTEGER NOT NULL,
  places_left INTEGER NOT NULL,
  owner_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  image_data BYTEA,
  image_mime TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  tags_colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_events (
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id INTEGER NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS events_tags_gin_idx
  ON public.events USING GIN (tags);
```

### Si vous aviez déjà une base existante
Ajoutez les colonnes tags avec :

```sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags_colors jsonb NOT NULL DEFAULT '{}'::jsonb;
```

---

## Lancer le backend
Dans un terminal :

```bash
cd event_backend
npm install
node src/server.js
```

Le serveur démarre par défaut sur **http://localhost:5001** (car un service tourne déjà sur 5000).  
Vous pouvez tester : `GET /api/health`

---

## Lancer le frontend
Dans un autre terminal :

```bash
cd event-frontend
npm install
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**  ou voir le 
Le proxy Vite redirige automatiquement `/api` vers le backend.

---

## Création automatique d’un admin (admin/admin)
Un script rapide permet de créer **admin/admin** avec le rôle **admin**.  
À lancer une seule fois (ou pour réinitialiser le mot de passe).

```bash
cd event_backend
node -e "const {Pool}=require('pg'); const bcrypt=require('bcrypt'); (async()=>{ const pool=new Pool({host:'localhost',port:5432,user:'postgres',password:'rACIne',database:'postgres'}); const hash=await bcrypt.hash('admin',10); await pool.query(\"INSERT INTO public.users(username,password,role) VALUES('admin',$1,'admin') ON CONFLICT (username) DO UPDATE SET password=EXCLUDED.password, role='admin'\", [hash]); await pool.end(); console.log('admin/admin prêt'); })().catch(e=>{console.error(e); process.exit(1);});"
```

Si vous avez modifié `event_backend/src/db.js`, adaptez les paramètres DB dans la commande.

---

## commandes utiles
Frontend (`event-frontend`):
- `npm run dev` : démarrage local
- `npm run build` : build de prod
- `npm run preview` : aperçu du build

Backend (`event_backend`):
- `node src/server.js` : démarrage serveur
