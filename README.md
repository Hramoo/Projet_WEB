# Projet WEB – EventsSquare

Ce projet contient un **frontend React (Vite)** et un **backend Node/Express** avec une base **PostgreSQL**.

---

## Prérequis
- **Node.js** (recommandé: 18+)
- **npm**
- **PostgreSQL** en local

---

## Configuration de la base de données
Par défaut, la connexion DB est définie dans `event_backend/src/db.js` :

```
host: "localhost"
port: 5432
user: "postgres"
password: "rACIne"
database: "postgres"
```

Si besoin, modifiez ces valeurs selon votre environnement.

### Schéma SQL (à exécuter une seule fois)
Vous pouvez lancer ces requêtes dans `psql` ou pgAdmin :

```sql
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

Le serveur démarre par défaut sur **http://localhost:5001**  
Vous pouvez tester : `GET /api/health`

---

## Lancer le frontend
Dans un autre terminal :

```bash
cd event-frontend
npm install
npm run dev
```

Le frontend sera disponible sur **http://localhost:5173**  
Le proxy Vite redirige automatiquement `/api` vers le backend.

---

## Créer un admin
Après avoir créé un utilisateur via l’UI (inscription), vous pouvez le passer admin :

```sql
UPDATE public.users
SET role = 'admin'
WHERE username = 'votre_login';
```

---

## Scripts utiles
Frontend (`event-frontend`):
- `npm run dev` : démarrage local
- `npm run build` : build de prod
- `npm run preview` : aperçu du build

Backend (`event_backend`):
- `node src/server.js` : démarrage serveur

---

Si besoin, je peux aussi ajouter un script `npm run start` côté backend pour simplifier.
